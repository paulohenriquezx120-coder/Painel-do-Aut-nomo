const express = require('express');
const db = require('../db');
const stripe = require('../stripe');
const asaas = require('../asaas');
const { requireAuth } = require('../middleware/auth');
const { syncUserFromSubscription } = require('../billingSync');
const asyncHandler = require('../asyncHandler');

const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const CURRENCY = process.env.ASAAS_PLAN_CURRENCY || process.env.STRIPE_PLAN_CURRENCY || 'brl';

function ensureStripeConfigured(res) {
  if (!stripe) {
    res.status(503).json({
      error: 'Confirmação de pagamento ainda não configurada. Defina STRIPE_SECRET_KEY no servidor.',
    });
    return false;
  }
  return true;
}

function ensureAsaasConfigured(res) {
  if (!asaas.isConfigured()) {
    res.status(503).json({ error: 'Pagamento ainda não configurado. Defina ASAAS_API_KEY no servidor.' });
    return false;
  }
  return true;
}

// Planos: 'monthly' cobra todo mês, 'quarterly' cobra a cada 3 meses.
const PLAN_CONFIG = {
  monthly: { label: 'Mensal', amountEnv: 'ASAAS_PLAN_MONTHLY_AMOUNT', intervalCount: 1, cycle: 'MONTHLY' },
  quarterly: { label: 'Trimestral', amountEnv: 'ASAAS_PLAN_QUARTERLY_AMOUNT', intervalCount: 3, cycle: 'QUARTERLY' },
};

function planFromEnv(id) {
  const cfg = PLAN_CONFIG[id];
  const amount = Number(process.env[cfg.amountEnv]) || 0;
  if (!amount) return null;
  return { id, label: cfg.label, amount, currency: CURRENCY, interval: 'month', intervalCount: cfg.intervalCount };
}

router.get('/plans', (req, res) => {
  const plans = Object.keys(PLAN_CONFIG).map(planFromEnv).filter(Boolean);
  if (plans.length === 0) {
    return res.status(503).json({ error: 'Planos ainda não configurados no servidor.' });
  }
  res.json({ plans });
});

router.use(requireAuth);

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

// Cria (ou reaproveita) o cliente e a assinatura no Asaas e devolve o link de
// pagamento hospedado (cartão/Pix/boleto) para o front redirecionar o usuário.
router.post(
  '/subscribe',
  asyncHandler(async (req, res) => {
    if (!ensureAsaasConfigured(res)) return;

    const planId = req.body?.planId;
    const cfg = PLAN_CONFIG[planId];
    if (!cfg) return res.status(400).json({ error: 'Plano inválido.' });

    const cpfCnpj = onlyDigits(req.body?.cpfCnpj);
    if (cpfCnpj.length !== 11 && cpfCnpj.length !== 14) {
      return res.status(400).json({ error: 'Informe um CPF ou CNPJ válido.' });
    }

    const amount = Number(process.env[cfg.amountEnv]) || 0;
    if (!amount) return res.status(503).json({ error: 'Plano ainda não configurado no servidor.' });

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);

    let asaasCustomerId = user.asaas_customer_id;
    try {
      if (!asaasCustomerId) {
        const existing = await asaas.findCustomerByCpfCnpj(cpfCnpj);
        if (existing) {
          asaasCustomerId = existing.id;
        } else {
          const customer = await asaas.createCustomer({
            name: user.business_name || user.name,
            email: user.email,
            cpfCnpj,
            externalReference: String(user.id),
          });
          asaasCustomerId = customer.id;
        }
        await db.prepare('UPDATE users SET asaas_customer_id = ? WHERE id = ?').run(asaasCustomerId, user.id);
      }

      const subscription = await asaas.createSubscription({
        customer: asaasCustomerId,
        billingType: 'UNDEFINED',
        cycle: cfg.cycle,
        value: amount / 100,
        nextDueDate: todayISODate(),
        description: `Painel do Autônomo - ${cfg.label}`,
        externalReference: String(user.id),
      });

      await db
        .prepare('UPDATE users SET asaas_subscription_id = ? WHERE id = ?')
        .run(subscription.id, user.id);

      const payments = await asaas.listSubscriptionPayments(subscription.id);
      const firstPayment = payments.data?.[0];
      if (!firstPayment?.invoiceUrl) {
        return res.status(502).json({ error: 'Não foi possível gerar o link de pagamento.' });
      }

      res.json({ invoiceUrl: firstPayment.invoiceUrl });
    } catch (err) {
      console.error('Erro criando assinatura no Asaas:', err.data || err.message);
      res.status(err.status && err.status < 500 ? 400 : 500).json({
        error: err.data?.errors?.[0]?.description || 'Não foi possível iniciar a assinatura.',
      });
    }
  })
);

router.post(
  '/cancel',
  asyncHandler(async (req, res) => {
    if (!ensureAsaasConfigured(res)) return;
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    if (!user.asaas_subscription_id) {
      return res.status(400).json({ error: 'Você não tem uma assinatura para cancelar.' });
    }
    try {
      await asaas.cancelSubscription(user.asaas_subscription_id);
      await db.prepare("UPDATE users SET subscription_status = 'canceled' WHERE id = ?").run(user.id);
      res.json({ ok: true });
    } catch (err) {
      console.error('Erro cancelando assinatura no Asaas:', err.data || err.message);
      res.status(500).json({ error: 'Não foi possível cancelar a assinatura.' });
    }
  })
);

// Confirma a assinatura assim que o cliente volta do Payment Link, sem depender de webhook
// (útil em desenvolvimento local, onde o Stripe não consegue chamar localhost).
router.post('/verify-session', async (req, res) => {
  if (!ensureStripeConfigured(res)) return;
  const { sessionId } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'sessionId é obrigatório.' });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
    if (session.client_reference_id !== String(req.userId)) {
      return res.status(403).json({ error: 'Sessão não pertence a este usuário.' });
    }
    if (session.subscription) {
      await syncUserFromSubscription(session.customer, session.subscription);
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Não foi possível confirmar a assinatura.' });
  }
});

router.post('/portal', async (req, res) => {
  if (!ensureStripeConfigured(res)) return;
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user?.stripe_customer_id) {
    return res.status(400).json({ error: 'Você ainda não tem uma assinatura para gerenciar.' });
  }
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${CLIENT_URL}/assinatura`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Não foi possível abrir o portal de assinatura.' });
  }
});

module.exports = router;

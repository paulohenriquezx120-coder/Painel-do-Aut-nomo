const express = require('express');
const db = require('../db');
const stripe = require('../stripe');
const { requireAuth } = require('../middleware/auth');
const { syncUserFromSubscription } = require('../billingSync');

const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

function ensureStripeConfigured(res) {
  if (!stripe) {
    res.status(503).json({
      error: 'Confirmação de pagamento ainda não configurada. Defina STRIPE_SECRET_KEY no servidor.',
    });
    return false;
  }
  return true;
}

// Dados estáticos dos planos: não dependem da chave secreta, então funcionam mesmo
// antes do backend ter acesso à API do Stripe (o checkout usa Payment Links prontos).
const CURRENCY = process.env.STRIPE_PLAN_CURRENCY || 'brl';

function plan(id, label, amountEnv, intervalCount, linkEnv) {
  const amount = Number(process.env[amountEnv]) || 0;
  const paymentLinkUrl = process.env[linkEnv];
  if (!amount || !paymentLinkUrl) return null;
  return { id, label, amount, currency: CURRENCY, interval: 'month', intervalCount, paymentLinkUrl };
}

router.get('/plans', (req, res) => {
  const plans = [
    plan('monthly', 'Mensal', 'STRIPE_PLAN_MONTHLY_AMOUNT', 1, 'STRIPE_PLAN_MONTHLY_LINK'),
    plan('quarterly', 'Trimestral', 'STRIPE_PLAN_QUARTERLY_AMOUNT', 3, 'STRIPE_PLAN_QUARTERLY_LINK'),
  ].filter(Boolean);

  if (plans.length === 0) {
    return res.status(503).json({ error: 'Planos ainda não configurados no servidor.' });
  }
  res.json({ plans });
});

router.use(requireAuth);

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

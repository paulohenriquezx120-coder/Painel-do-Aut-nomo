const express = require('express');
const db = require('../db');
const asaas = require('../asaas');

const router = express.Router();

const CONFIRMED_STATUSES = new Set(['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED']);
const OVERDUE_STATUSES = new Set(['PAYMENT_OVERDUE']);
const CANCELED_STATUSES = new Set(['PAYMENT_DELETED', 'PAYMENT_REFUNDED', 'SUBSCRIPTION_DELETED']);

router.post('/', async (req, res) => {
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN;
  if (expectedToken && req.headers['asaas-access-token'] !== expectedToken) {
    return res.status(401).send('Token inválido.');
  }

  try {
    const event = req.body?.event;
    const payment = req.body?.payment;
    const subscriptionId = payment?.subscription;

    if (subscriptionId && (CONFIRMED_STATUSES.has(event) || OVERDUE_STATUSES.has(event) || CANCELED_STATUSES.has(event))) {
      const user = await db
        .prepare('SELECT id FROM users WHERE asaas_subscription_id = ?')
        .get(subscriptionId);

      if (user) {
        if (CONFIRMED_STATUSES.has(event)) {
          let currentPeriodEnd = null;
          try {
            const subscription = await asaas.getSubscription(subscriptionId);
            currentPeriodEnd = subscription.nextDueDate || null;
          } catch (err) {
            console.error('Erro buscando assinatura no Asaas:', err.message);
          }
          await db
            .prepare("UPDATE users SET subscription_status = 'active', current_period_end = ? WHERE id = ?")
            .run(currentPeriodEnd, user.id);
        } else if (OVERDUE_STATUSES.has(event)) {
          await db.prepare("UPDATE users SET subscription_status = 'past_due' WHERE id = ?").run(user.id);
        } else if (CANCELED_STATUSES.has(event)) {
          await db.prepare("UPDATE users SET subscription_status = 'canceled' WHERE id = ?").run(user.id);
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Erro processando webhook do Asaas:', err);
    res.status(500).send('Erro interno');
  }
});

module.exports = router;

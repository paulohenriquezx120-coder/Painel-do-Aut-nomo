const express = require('express');
const db = require('../db');
const stripe = require('../stripe');
const { syncUserFromSubscription } = require('../billingSync');

const router = express.Router();

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).send('Stripe não configurado.');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook signature inválida: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          syncUserFromSubscription(session.customer, subscription);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object;
        syncUserFromSubscription(subscription.customer, subscription);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const user = db.prepare('SELECT id FROM users WHERE stripe_customer_id = ?').get(subscription.customer);
        if (user) {
          db.prepare("UPDATE users SET subscription_status = 'canceled' WHERE id = ?").run(user.id);
        }
        break;
      }
      default:
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Erro processando webhook do Stripe:', err);
    res.status(500).send('Erro interno');
  }
});

module.exports = router;

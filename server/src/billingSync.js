const db = require('./db');

function syncUserFromSubscription(customerId, subscription) {
  const user = db.prepare('SELECT id FROM users WHERE stripe_customer_id = ?').get(customerId);
  if (!user) return;
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;
  db.prepare(
    'UPDATE users SET stripe_subscription_id = ?, subscription_status = ?, current_period_end = ? WHERE id = ?'
  ).run(subscription.id, subscription.status, periodEnd, user.id);
}

module.exports = { syncUserFromSubscription };

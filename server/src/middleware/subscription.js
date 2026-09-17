const db = require('../db');
const { hasActiveAccess } = require('../accessControl');

async function requireActiveAccess(req, res, next) {
  const user = await db.prepare('SELECT email, subscription_status, trial_ends_at FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });

  if (hasActiveAccess(user)) return next();

  return res.status(402).json({ error: 'Assine para continuar usando.', code: 'SUBSCRIPTION_REQUIRED' });
}

module.exports = { requireActiveAccess };

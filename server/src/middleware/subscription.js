const db = require('../db');

function requireActiveAccess(req, res, next) {
  const user = db.prepare('SELECT subscription_status, trial_ends_at FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });

  const isTrialing = user.subscription_status === 'trialing' && new Date(user.trial_ends_at) > new Date();
  const isActive = user.subscription_status === 'active';

  if (isTrialing || isActive) return next();

  return res.status(402).json({ error: 'Seu teste grátis acabou. Assine para continuar usando.', code: 'SUBSCRIPTION_REQUIRED' });
}

module.exports = { requireActiveAccess };

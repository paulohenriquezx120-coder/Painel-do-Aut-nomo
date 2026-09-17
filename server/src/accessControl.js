const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function hasActiveAccess(user) {
  if (ADMIN_EMAILS.includes(user.email.toLowerCase())) return true;
  const isTrialing = user.subscription_status === 'trialing' && new Date(user.trial_ends_at) > new Date();
  return isTrialing || user.subscription_status === 'active';
}

module.exports = { hasActiveAccess };

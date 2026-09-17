const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');
const { hasActiveAccess } = require('../accessControl');
const asyncHandler = require('../asyncHandler');
const { sendPasswordResetEmail } = require('../email');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    businessName: user.business_name,
    email: user.email,
    subscription: {
      status: user.subscription_status,
      trialEndsAt: user.trial_ends_at,
      currentPeriodEnd: user.current_period_end,
      hasAccess: hasActiveAccess(user),
    },
  };
}

const envTrialDays = Number(process.env.TRIAL_DAYS);
const TRIAL_DAYS = Number.isFinite(envTrialDays) ? envTrialDays : 7;

router.post('/register', asyncHandler(async (req, res) => {
  const { name, businessName, email, password } = req.body || {};
  if (!name || !businessName || !email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });
  }
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'Já existe uma conta com este e-mail.' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const info = await db
    .prepare(
      'INSERT INTO users (name, business_name, email, password_hash, trial_ends_at) VALUES (?, ?, ?, ?, ?)'
    )
    .run(name.trim(), businessName.trim(), email.toLowerCase().trim(), hash, trialEndsAt);
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.cookie('token', token, COOKIE_OPTS);
  res.json({ user: publicUser(user) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }
  const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.cookie('token', token, COOKIE_OPTS);
  res.json({ user: publicUser(user) });
}));

router.post('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTS);
  res.json({ ok: true });
});

router.get('/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });
  res.json({ user: publicUser(user) });
}));

const GENERIC_FORGOT_MESSAGE = 'Se esse e-mail tiver uma conta, enviamos um link de redefinição.';

router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Informe o e-mail.' });

  const user = await db.prepare('SELECT id, email FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await db
      .prepare('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)')
      .run(user.id, tokenHash, expiresAt);

    const resetUrl = `${CLIENT_URL}/redefinir-senha?token=${token}`;
    sendPasswordResetEmail(user.email, resetUrl).catch((err) =>
      console.error('Erro ao enviar e-mail de redefinição:', err)
    );
  }

  // Resposta sempre igual, mesmo se o e-mail não existir — evita expor quais contas existem.
  res.json({ message: GENERIC_FORGOT_MESSAGE });
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, password } = req.body || {};
  if (!token || !password) return res.status(400).json({ error: 'Dados incompletos.' });
  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const reset = await db
    .prepare(
      "SELECT * FROM password_resets WHERE token_hash = ? AND used = 0 AND expires_at > datetime('now')"
    )
    .get(tokenHash);

  if (!reset) {
    return res.status(400).json({ error: 'Link inválido ou expirado. Peça uma nova redefinição.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, reset.user_id);
  await db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(reset.id);

  res.json({ ok: true });
}));

module.exports = router;

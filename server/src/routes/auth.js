const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function publicUser(user) {
  const isTrialing = user.subscription_status === 'trialing' && new Date(user.trial_ends_at) > new Date();
  return {
    id: user.id,
    name: user.name,
    businessName: user.business_name,
    email: user.email,
    subscription: {
      status: user.subscription_status,
      trialEndsAt: user.trial_ends_at,
      currentPeriodEnd: user.current_period_end,
      hasAccess: isTrialing || user.subscription_status === 'active',
    },
  };
}

const TRIAL_DAYS = Number(process.env.TRIAL_DAYS) || 7;

router.post('/register', (req, res) => {
  const { name, businessName, email, password } = req.body || {};
  if (!name || !businessName || !email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'A senha precisa ter pelo menos 6 caracteres.' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'Já existe uma conta com este e-mail.' });
  }
  const hash = bcrypt.hashSync(password, 10);
  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const info = db
    .prepare(
      'INSERT INTO users (name, business_name, email, password_hash, trial_ends_at) VALUES (?, ?, ?, ?, ?)'
    )
    .run(name.trim(), businessName.trim(), email.toLowerCase().trim(), hash, trialEndsAt);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.cookie('token', token, COOKIE_OPTS);
  res.json({ user: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.cookie('token', token, COOKIE_OPTS);
  res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTS);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(401).json({ error: 'Não autenticado' });
  res.json({ user: publicUser(user) });
});

module.exports = router;

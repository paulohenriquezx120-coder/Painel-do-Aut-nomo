const express = require('express');
const db = require('../db');
const asyncHandler = require('../asyncHandler');
const { sendSuggestionEmail } = require('../email');

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const message = String(req.body?.message || '').trim();
    if (!message) {
      return res.status(400).json({ error: 'Escreva sua sugestão antes de enviar.' });
    }
    if (message.length > 2000) {
      return res.status(400).json({ error: 'Sugestão muito longa (máximo 2000 caracteres).' });
    }

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);

    const sent = await sendSuggestionEmail({
      name: user.name,
      businessName: user.business_name,
      email: user.email,
      message,
    });

    if (!sent) {
      return res.status(503).json({ error: 'Não foi possível enviar sua sugestão agora. Tente de novo em instantes.' });
    }

    res.json({ ok: true });
  })
);

module.exports = router;

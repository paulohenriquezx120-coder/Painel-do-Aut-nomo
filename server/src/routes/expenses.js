const express = require('express');
const db = require('../db');
const asyncHandler = require('../asyncHandler');
const { periodStart } = require('../period');

const router = express.Router();

function serialize(e) {
  return {
    id: e.id,
    description: e.description,
    amount: e.amount,
    expenseDate: e.expense_date,
    createdAt: e.created_at,
  };
}

router.get('/', asyncHandler(async (req, res) => {
  let rows = await db
    .prepare('SELECT * FROM expenses WHERE user_id = ? ORDER BY expense_date DESC, id DESC')
    .all(req.userId);

  const start = periodStart(req.query.period || 'all');
  if (start) {
    rows = rows.filter((e) => new Date(e.expense_date) >= start);
  }

  const expenses = rows.map(serialize);
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  res.json({ expenses, total });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { description, amount, expenseDate } = req.body || {};
  const desc = String(description || '').trim();
  const value = Number(amount);

  if (!desc) return res.status(400).json({ error: 'Informe a descrição da despesa.' });
  if (!value || value <= 0) return res.status(400).json({ error: 'Informe um valor maior que zero.' });

  const date = expenseDate || new Date().toISOString().slice(0, 10);
  const info = await db
    .prepare('INSERT INTO expenses (user_id, description, amount, expense_date) VALUES (?, ?, ?, ?)')
    .run(req.userId, desc, value, date);

  const expense = await db.prepare('SELECT * FROM expenses WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ expense: serialize(expense) });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const expense = await db
    .prepare('SELECT * FROM expenses WHERE id = ? AND user_id = ?')
    .get(req.params.id, req.userId);
  if (!expense) return res.status(404).json({ error: 'Despesa não encontrada.' });
  await db.prepare('DELETE FROM expenses WHERE id = ?').run(expense.id);
  res.json({ ok: true });
}));

module.exports = router;

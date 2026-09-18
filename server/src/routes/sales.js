const express = require('express');
const db = require('../db');
const asyncHandler = require('../asyncHandler');
const { periodStart } = require('../period');

const router = express.Router();

function serialize(s) {
  return {
    id: s.id,
    productId: s.product_id,
    productName: s.product_name,
    quantity: s.quantity,
    purchasePrice: s.purchase_price,
    salePrice: s.sale_price,
    total: s.total,
    profit: s.profit,
    saleDate: s.sale_date,
    createdAt: s.created_at,
  };
}

router.get('/', asyncHandler(async (req, res) => {
  const period = req.query.period || 'all';
  let rows = await db
    .prepare('SELECT * FROM sales WHERE user_id = ? ORDER BY sale_date DESC, id DESC')
    .all(req.userId);

  const start = periodStart(period);
  if (start) {
    rows = rows.filter((s) => new Date(s.sale_date) >= start);
  }

  const sales = rows.map(serialize);

  const totalSold = sales.reduce((sum, s) => sum + s.total, 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
  const count = sales.length;
  const avgTicket = count > 0 ? totalSold / count : 0;

  let expenseRows = await db.prepare('SELECT * FROM expenses WHERE user_id = ?').all(req.userId);
  if (start) {
    expenseRows = expenseRows.filter((e) => new Date(e.expense_date) >= start);
  }
  const totalExpenses = expenseRows.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalProfit - totalExpenses;

  const byProduct = new Map();
  for (const s of sales) {
    const key = s.productName;
    if (!byProduct.has(key)) {
      byProduct.set(key, { productName: key, quantity: 0, revenue: 0, profit: 0 });
    }
    const entry = byProduct.get(key);
    entry.quantity += s.quantity;
    entry.revenue += s.total;
    entry.profit += s.profit;
  }
  const ranking = Array.from(byProduct.values()).sort((a, b) => b.revenue - a.revenue);

  res.json({
    sales,
    summary: { totalSold, totalProfit, count, avgTicket, totalExpenses, netProfit },
    ranking,
  });
}));

router.post('/', asyncHandler(async (req, res) => {
  const { productId, productName, quantity, purchasePrice, salePrice, saleDate } = req.body || {};
  const qty = Number(quantity);
  const pPrice = Number(purchasePrice);
  const sPrice = Number(salePrice);
  const name = (productName || '').trim();

  if (!name) return res.status(400).json({ error: 'Informe o produto vendido.' });
  if (!qty || qty <= 0) return res.status(400).json({ error: 'Quantidade inválida.' });
  if (Number.isNaN(pPrice) || Number.isNaN(sPrice)) {
    return res.status(400).json({ error: 'Preços inválidos.' });
  }

  let linkedProductId = null;
  if (productId) {
    const product = await db
      .prepare('SELECT * FROM products WHERE id = ? AND user_id = ?')
      .get(productId, req.userId);
    if (product) {
      linkedProductId = product.id;
      const newQty = Math.max(0, Number(product.quantity) - qty);
      await db.prepare("UPDATE products SET quantity = ?, updated_at = datetime('now') WHERE id = ?").run(
        newQty,
        product.id
      );
    }
  }

  const total = qty * sPrice;
  const profit = qty * (sPrice - pPrice);
  const date = saleDate || new Date().toISOString().slice(0, 10);

  const info = await db
    .prepare(
      `INSERT INTO sales (user_id, product_id, product_name, quantity, purchase_price, sale_price, total, profit, sale_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(req.userId, linkedProductId, name, qty, pPrice, sPrice, total, profit, date);

  const sale = await db.prepare('SELECT * FROM sales WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ sale: serialize(sale) });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const sale = await db.prepare('SELECT * FROM sales WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!sale) return res.status(404).json({ error: 'Venda não encontrada.' });
  await db.prepare('DELETE FROM sales WHERE id = ?').run(sale.id);
  res.json({ ok: true });
}));

module.exports = router;

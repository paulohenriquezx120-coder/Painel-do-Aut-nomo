const express = require('express');
const db = require('../db');

const router = express.Router();

function serialize(p) {
  return {
    id: p.id,
    name: p.name,
    sku: p.sku || '',
    quantity: p.quantity,
    minQuantity: p.min_quantity,
    purchasePrice: p.purchase_price,
    salePrice: p.sale_price,
    lowStock: p.quantity <= p.min_quantity,
    outOfStock: p.quantity <= 0,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

// Lista + busca, com estoque baixo sempre primeiro
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  let rows = db.prepare('SELECT * FROM products WHERE user_id = ?').all(req.userId);
  if (q) {
    rows = rows.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.sku || '').toLowerCase().includes(q)
    );
  }
  rows.sort((a, b) => {
    const aLow = a.quantity <= a.min_quantity ? 1 : 0;
    const bLow = b.quantity <= b.min_quantity ? 1 : 0;
    if (aLow !== bLow) return bLow - aLow;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
  const products = rows.map(serialize);
  const summary = {
    total: products.length,
    lowStock: products.filter((p) => p.lowStock).length,
    totalUnits: products.reduce((sum, p) => sum + Number(p.quantity), 0),
  };
  res.json({ products, summary });
});

router.get('/export.csv', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM products WHERE user_id = ? ORDER BY name COLLATE NOCASE')
    .all(req.userId);
  const header = ['Nome', 'SKU', 'Quantidade', 'Estoque mínimo', 'Preço de compra', 'Preço de venda'];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [header.map(escape).join(',')];
  for (const p of rows) {
    lines.push(
      [p.name, p.sku || '', p.quantity, p.min_quantity, p.purchase_price, p.sale_price]
        .map(escape)
        .join(',')
    );
  }
  const csv = '﻿' + lines.join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="estoque.csv"');
  res.send(csv);
});

router.post('/', (req, res) => {
  const { name, sku, quantity, minQuantity, purchasePrice, salePrice } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Informe o nome do produto.' });
  }
  const info = db
    .prepare(
      `INSERT INTO products (user_id, name, sku, quantity, min_quantity, purchase_price, sale_price)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.userId,
      name.trim(),
      (sku || '').trim(),
      Number(quantity) || 0,
      Number(minQuantity) || 0,
      Number(purchasePrice) || 0,
      Number(salePrice) || 0
    );
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ product: serialize(product) });
});

function getOwnedProduct(id, userId) {
  return db.prepare('SELECT * FROM products WHERE id = ? AND user_id = ?').get(id, userId);
}

router.patch('/:id', (req, res) => {
  const product = getOwnedProduct(req.params.id, req.userId);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });
  const { name, sku, minQuantity, purchasePrice, salePrice } = req.body || {};
  db.prepare(
    `UPDATE products SET
      name = COALESCE(?, name),
      sku = COALESCE(?, sku),
      min_quantity = COALESCE(?, min_quantity),
      purchase_price = COALESCE(?, purchase_price),
      sale_price = COALESCE(?, sale_price),
      updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    name != null ? String(name).trim() : null,
    sku != null ? String(sku).trim() : null,
    minQuantity != null ? Number(minQuantity) : null,
    purchasePrice != null ? Number(purchasePrice) : null,
    salePrice != null ? Number(salePrice) : null,
    product.id
  );
  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(product.id);
  res.json({ product: serialize(updated) });
});

router.patch('/:id/quantity', (req, res) => {
  const product = getOwnedProduct(req.params.id, req.userId);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });
  const { delta, quantity } = req.body || {};
  let newQty;
  if (quantity != null) {
    newQty = Number(quantity);
  } else {
    newQty = Number(product.quantity) + Number(delta || 0);
  }
  if (Number.isNaN(newQty)) return res.status(400).json({ error: 'Quantidade inválida.' });
  newQty = Math.max(0, newQty);
  db.prepare("UPDATE products SET quantity = ?, updated_at = datetime('now') WHERE id = ?").run(
    newQty,
    product.id
  );
  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(product.id);
  res.json({ product: serialize(updated) });
});

router.delete('/:id', (req, res) => {
  const product = getOwnedProduct(req.params.id, req.userId);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });
  db.prepare('DELETE FROM products WHERE id = ?').run(product.id);
  res.json({ ok: true });
});

module.exports = router;

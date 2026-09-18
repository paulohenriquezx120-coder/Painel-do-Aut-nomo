const express = require('express');
const multer = require('multer');
const db = require('../db');
const asyncHandler = require('../asyncHandler');
const { parseCsv } = require('../csv');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function uploadSingle(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || 'Falha ao enviar o arquivo.' });
    next();
  });
}

function normalizeHeader(h) {
  return String(h || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

const FIELD_ALIASES = {
  name: ['nome', 'produto', 'name', 'descricao'],
  sku: ['sku', 'codigo', 'cod'],
  quantity: ['quantidade', 'qtd', 'quantity', 'estoque'],
  minQuantity: ['estoque minimo', 'minimo', 'quantidade minima', 'min quantity', 'estoque min'],
  purchasePrice: ['preco de compra', 'custo', 'purchase price', 'preco compra'],
  salePrice: ['preco de venda', 'venda', 'sale price', 'preco venda'],
};

function toNumber(raw) {
  let v = String(raw ?? '').trim();
  if (!v) return 0;
  v = v.replace(/[^\d,.-]/g, '');
  if (v.includes(',') && v.includes('.')) {
    v = v.replace(/\./g, '').replace(',', '.');
  } else if (v.includes(',')) {
    v = v.replace(',', '.');
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

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
router.get('/', asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim().toLowerCase();
  let rows = await db.prepare('SELECT * FROM products WHERE user_id = ?').all(req.userId);
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
}));

router.get('/export.csv', asyncHandler(async (req, res) => {
  const rows = await db
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
}));

router.post(
  '/import',
  uploadSingle,
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Envie um arquivo .csv.' });

    const ext = (req.file.originalname.split('.').pop() || '').toLowerCase();
    if (ext !== 'csv') {
      return res.status(400).json({
        error: 'Envie um arquivo .csv. No Excel: Arquivo > Salvar como > CSV (separado por vírgulas).',
      });
    }

    const { headers, rows } = parseCsv(req.file.buffer.toString('utf8'));
    if (rows.length === 0) {
      return res.status(400).json({ error: 'A planilha está vazia.' });
    }
    if (rows.length > 2000) {
      return res.status(400).json({ error: 'Máximo de 2000 linhas por importação.' });
    }

    const headerMap = {};
    for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
      const found = headers.find((h) => aliases.includes(normalizeHeader(h)));
      if (found) headerMap[field] = found;
    }
    if (!headerMap.name) {
      return res.status(400).json({
        error: 'Não encontrei uma coluna de nome do produto. Use uma coluna chamada "Nome".',
      });
    }

    let imported = 0;
    const errors = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = String(row[headerMap.name] || '').trim();
      if (!name) {
        errors.push(`Linha ${i + 2}: sem nome, ignorada.`);
        continue;
      }
      await db
        .prepare(
          `INSERT INTO products (user_id, name, sku, quantity, min_quantity, purchase_price, sale_price)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          req.userId,
          name,
          headerMap.sku ? String(row[headerMap.sku] || '').trim() : '',
          headerMap.quantity ? toNumber(row[headerMap.quantity]) : 0,
          headerMap.minQuantity ? toNumber(row[headerMap.minQuantity]) : 0,
          headerMap.purchasePrice ? toNumber(row[headerMap.purchasePrice]) : 0,
          headerMap.salePrice ? toNumber(row[headerMap.salePrice]) : 0
        );
      imported++;
    }

    res.json({ imported, skipped: errors.length, errors: errors.slice(0, 20) });
  })
);

router.post('/', asyncHandler(async (req, res) => {
  const { name, sku, quantity, minQuantity, purchasePrice, salePrice } = req.body || {};
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Informe o nome do produto.' });
  }
  const info = await db
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
  const product = await db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ product: serialize(product) });
}));

function getOwnedProduct(id, userId) {
  return db.prepare('SELECT * FROM products WHERE id = ? AND user_id = ?').get(id, userId);
}

router.patch('/:id', asyncHandler(async (req, res) => {
  const product = await getOwnedProduct(req.params.id, req.userId);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });
  const { name, sku, minQuantity, purchasePrice, salePrice } = req.body || {};
  await db.prepare(
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
  const updated = await db.prepare('SELECT * FROM products WHERE id = ?').get(product.id);
  res.json({ product: serialize(updated) });
}));

router.patch('/:id/quantity', asyncHandler(async (req, res) => {
  const product = await getOwnedProduct(req.params.id, req.userId);
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
  await db.prepare("UPDATE products SET quantity = ?, updated_at = datetime('now') WHERE id = ?").run(
    newQty,
    product.id
  );
  const updated = await db.prepare('SELECT * FROM products WHERE id = ?').get(product.id);
  res.json({ product: serialize(updated) });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const product = await getOwnedProduct(req.params.id, req.userId);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });
  await db.prepare('DELETE FROM products WHERE id = ?').run(product.id);
  res.json({ ok: true });
}));

module.exports = router;

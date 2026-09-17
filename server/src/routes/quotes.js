const express = require('express');
const PDFDocument = require('pdfkit');
const db = require('../db');

const router = express.Router();

function serialize(q) {
  return {
    id: q.id,
    issuerName: q.issuer_name,
    clientName: q.client_name,
    description: q.description || '',
    validityDays: q.validity_days,
    items: JSON.parse(q.items_json),
    total: q.total,
    createdAt: q.created_at,
  };
}

function fmtBRL(n) {
  return Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM quotes WHERE user_id = ? ORDER BY created_at DESC, id DESC')
    .all(req.userId);
  res.json({ quotes: rows.map(serialize) });
});

router.post('/', (req, res) => {
  const { issuerName, clientName, description, validityDays, items } = req.body || {};
  if (!issuerName || !issuerName.trim()) return res.status(400).json({ error: 'Informe o nome do negócio/emissor.' });
  if (!clientName || !clientName.trim()) return res.status(400).json({ error: 'Informe o cliente.' });
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Adicione ao menos um item.' });
  }
  const cleanItems = items.map((it) => ({
    name: String(it.name || '').trim() || 'Item',
    quantity: Number(it.quantity) || 0,
    unitPrice: Number(it.unitPrice) || 0,
  }));
  const total = cleanItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  const info = db
    .prepare(
      `INSERT INTO quotes (user_id, issuer_name, client_name, description, validity_days, items_json, total)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.userId,
      issuerName.trim(),
      clientName.trim(),
      (description || '').trim(),
      Number(validityDays) || 7,
      JSON.stringify(cleanItems),
      total
    );
  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ quote: serialize(quote) });
});

router.delete('/:id', (req, res) => {
  const quote = db.prepare('SELECT * FROM quotes WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!quote) return res.status(404).json({ error: 'Orçamento não encontrado.' });
  db.prepare('DELETE FROM quotes WHERE id = ?').run(quote.id);
  res.json({ ok: true });
});

router.get('/:id/pdf', (req, res) => {
  const quote = db.prepare('SELECT * FROM quotes WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!quote) return res.status(404).json({ error: 'Orçamento não encontrado.' });
  const q = serialize(quote);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="orcamento-${q.id}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  doc.pipe(res);

  const accent = '#1e4d4a';
  const gray = '#5b6664';

  // Cabeçalho
  doc.fillColor(accent).fontSize(20).font('Helvetica-Bold').text(q.issuerName, { continued: false });
  doc.moveDown(0.2);
  doc.fillColor(gray).fontSize(10).font('Helvetica').text('Orçamento');
  doc.moveDown(1);

  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#dfe4e2').lineWidth(1).stroke();
  doc.moveDown(1);

  const createdAt = new Date(q.createdAt);
  const validUntil = new Date(createdAt.getTime() + q.validityDays * 24 * 60 * 60 * 1000);
  const fmtDate = (d) => d.toLocaleDateString('pt-BR');

  const infoTop = doc.y;
  doc.fillColor(gray).fontSize(9).font('Helvetica-Bold').text('CLIENTE', 50, infoTop);
  doc.fillColor('#1a1f1e').fontSize(11).font('Helvetica').text(q.clientName, 50, infoTop + 13);

  doc.fillColor(gray).fontSize(9).font('Helvetica-Bold').text('DATA', 300, infoTop);
  doc.fillColor('#1a1f1e').fontSize(11).font('Helvetica').text(fmtDate(createdAt), 300, infoTop + 13);

  doc.fillColor(gray).fontSize(9).font('Helvetica-Bold').text('VÁLIDO ATÉ', 420, infoTop);
  doc.fillColor('#1a1f1e').fontSize(11).font('Helvetica').text(fmtDate(validUntil), 420, infoTop + 13);

  doc.moveDown(2.2);

  if (q.description) {
    doc.fillColor(gray).fontSize(9).font('Helvetica-Bold').text('DESCRIÇÃO DO SERVIÇO');
    doc.fillColor('#1a1f1e').fontSize(10).font('Helvetica').text(q.description, { width: 495 });
    doc.moveDown(1);
  }

  // Tabela de itens
  const tableTop = doc.y + 5;
  const col = { desc: 50, qty: 330, unit: 390, subtotal: 470 };
  doc.fillColor('#ffffff').rect(50, tableTop, 495, 22).fill(accent);
  doc
    .fillColor('#ffffff')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('DESCRIÇÃO', col.desc + 8, tableTop + 6)
    .text('QTD', col.qty, tableTop + 6, { width: 50, align: 'right' })
    .text('VALOR UNIT.', col.unit, tableTop + 6, { width: 70, align: 'right' })
    .text('SUBTOTAL', col.subtotal, tableTop + 6, { width: 65, align: 'right' });

  let y = tableTop + 22;
  doc.font('Helvetica').fontSize(10);
  q.items.forEach((item, idx) => {
    const rowHeight = 24;
    if (idx % 2 === 1) {
      doc.rect(50, y, 495, rowHeight).fill('#f4f6f5');
    }
    const subtotal = item.quantity * item.unitPrice;
    doc
      .fillColor('#1a1f1e')
      .text(item.name, col.desc + 8, y + 7, { width: 270 })
      .text(String(item.quantity), col.qty, y + 7, { width: 50, align: 'right' })
      .text(fmtBRL(item.unitPrice), col.unit, y + 7, { width: 70, align: 'right' })
      .text(fmtBRL(subtotal), col.subtotal, y + 7, { width: 65, align: 'right' });
    y += rowHeight;
    if (y > 700) {
      doc.addPage();
      y = 50;
    }
  });

  doc.moveTo(50, y + 5).lineTo(545, y + 5).strokeColor('#dfe4e2').stroke();

  doc
    .fillColor(gray)
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('TOTAL GERAL', col.unit, y + 18, { width: 70, align: 'right' });
  doc
    .fillColor(accent)
    .fontSize(14)
    .font('Helvetica-Bold')
    .text(fmtBRL(q.total), col.subtotal, y + 14, { width: 65, align: 'right' });

  doc
    .fillColor(gray)
    .fontSize(8)
    .font('Helvetica')
    .text(`Orçamento válido por ${q.validityDays} dia(s) a partir da emissão.`, 50, 760, {
      width: 495,
      align: 'center',
    });

  doc.end();
});

module.exports = router;

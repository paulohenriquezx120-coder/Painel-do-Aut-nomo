require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const db = require('./db');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');
const quoteRoutes = require('./routes/quotes');
const billingRoutes = require('./routes/billing');
const stripeWebhook = require('./routes/stripeWebhook');
const asaasWebhook = require('./routes/asaasWebhook');
const { requireAuth } = require('./middleware/auth');
const { requireActiveAccess } = require('./middleware/subscription');
const asyncHandler = require('./asyncHandler');

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Necessário atrás do proxy do Render para cookies "secure" e detecção de HTTPS funcionarem.
app.set('trust proxy', 1);

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));

// Precisa do corpo bruto para validar a assinatura do Stripe; por isso vem antes do express.json().
app.use('/api/billing/webhook', stripeWebhook);

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/billing/asaas-webhook', asaasWebhook);
app.use('/api/billing', billingRoutes);
app.use('/api/products', requireAuth, asyncHandler(requireActiveAccess), productRoutes);
app.use('/api/sales', requireAuth, asyncHandler(requireActiveAccess), salesRoutes);
app.use('/api/quotes', requireAuth, asyncHandler(requireActiveAccess), quoteRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Em produção o build do frontend (client/dist) é servido pelo mesmo serviço,
// então só precisamos de um deploy no Render.
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

db.migrate()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Falha ao migrar o banco de dados:', err);
    process.exit(1);
  });

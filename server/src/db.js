const { DatabaseSync } = require('node:sqlite');
const path = require('path');

// DB_PATH permite apontar para um disco persistente em produção (ex: Render Disks)
// sem precisar mudar código — sem ela, usa um arquivo local ao lado do servidor.
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data.sqlite');
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  quantity REAL NOT NULL DEFAULT 0,
  min_quantity REAL NOT NULL DEFAULT 0,
  purchase_price REAL NOT NULL DEFAULT 0,
  sale_price REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity REAL NOT NULL,
  purchase_price REAL NOT NULL,
  sale_price REAL NOT NULL,
  total REAL NOT NULL,
  profit REAL NOT NULL,
  sale_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issuer_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  description TEXT,
  validity_days INTEGER NOT NULL DEFAULT 7,
  items_json TEXT NOT NULL,
  total REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_user ON quotes(user_id);
`);

const userColumns = db.prepare("PRAGMA table_info(users)").all().map((c) => c.name);
const addColumn = (name, def) => {
  if (!userColumns.includes(name)) {
    db.exec(`ALTER TABLE users ADD COLUMN ${name} ${def}`);
  }
};
addColumn('stripe_customer_id', 'TEXT');
addColumn('stripe_subscription_id', 'TEXT');
addColumn('subscription_status', "TEXT NOT NULL DEFAULT 'trialing'");
addColumn('trial_ends_at', "TEXT");
addColumn('current_period_end', 'TEXT');

const envTrialDays = Number(process.env.TRIAL_DAYS);
const trialDays = Number.isFinite(envTrialDays) ? envTrialDays : 7;
const backfillTrial = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();
db.prepare("UPDATE users SET trial_ends_at = ? WHERE trial_ends_at IS NULL").run(backfillTrial);

// Teste grátis desativado (TRIAL_DAYS <= 0): corta o acesso de quem ainda estava
// dentro do período de teste, além de zerar o período para novos cadastros.
if (trialDays <= 0) {
  db.prepare(
    "UPDATE users SET trial_ends_at = datetime('now') WHERE subscription_status = 'trialing' AND trial_ends_at > datetime('now')"
  ).run();
}

module.exports = db;

const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Camada fina que imita a API síncrona do better-sqlite3/node:sqlite (prepare().get/all/run),
// só que assíncrona — o Turso é um banco remoto, toda consulta é uma chamada de rede.
function prepare(sql) {
  return {
    async get(...args) {
      const result = await client.execute({ sql, args });
      return result.rows[0] ? { ...result.rows[0] } : undefined;
    },
    async all(...args) {
      const result = await client.execute({ sql, args });
      return result.rows.map((row) => ({ ...row }));
    },
    async run(...args) {
      const result = await client.execute({ sql, args });
      return {
        lastInsertRowid: Number(result.lastInsertRowid),
        changes: Number(result.rowsAffected),
      };
    },
  };
}

async function migrate() {
  await client.executeMultiple(`
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

    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
    CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
    CREATE INDEX IF NOT EXISTS idx_quotes_user ON quotes(user_id);
    CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
  `);

  const columnsResult = await client.execute('PRAGMA table_info(users)');
  const userColumns = columnsResult.rows.map((c) => c.name);
  const addColumn = async (name, def) => {
    if (!userColumns.includes(name)) {
      await client.execute(`ALTER TABLE users ADD COLUMN ${name} ${def}`);
    }
  };
  await addColumn('stripe_customer_id', 'TEXT');
  await addColumn('stripe_subscription_id', 'TEXT');
  await addColumn('subscription_status', "TEXT NOT NULL DEFAULT 'trialing'");
  await addColumn('trial_ends_at', 'TEXT');
  await addColumn('current_period_end', 'TEXT');
  await addColumn('asaas_customer_id', 'TEXT');
  await addColumn('asaas_subscription_id', 'TEXT');

  const envTrialDays = Number(process.env.TRIAL_DAYS);
  const trialDays = Number.isFinite(envTrialDays) ? envTrialDays : 7;
  const backfillTrial = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000).toISOString();
  await client.execute({
    sql: 'UPDATE users SET trial_ends_at = ? WHERE trial_ends_at IS NULL',
    args: [backfillTrial],
  });

  // Teste grátis desativado (TRIAL_DAYS <= 0): corta o acesso de quem ainda estava
  // dentro do período de teste, além de zerar o período para novos cadastros.
  if (trialDays <= 0) {
    await client.execute(
      "UPDATE users SET trial_ends_at = datetime('now') WHERE subscription_status = 'trialing' AND trial_ends_at > datetime('now')"
    );
  }
}

module.exports = { prepare, migrate };

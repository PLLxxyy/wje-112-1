import db from './db';

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      taste_sweet INTEGER DEFAULT 0,
      taste_salty INTEGER DEFAULT 0,
      taste_spicy INTEGER DEFAULT 0,
      nut_allergy INTEGER DEFAULT 0,
      preferences_set INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS snacks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      image TEXT,
      category TEXT NOT NULL,
      taste_sweet INTEGER DEFAULT 0,
      taste_salty INTEGER DEFAULT 0,
      taste_spicy INTEGER DEFAULT 0,
      contains_nuts INTEGER DEFAULT 0,
      price REAL DEFAULT 0,
      stock INTEGER DEFAULT 100,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      snacks_count INTEGER NOT NULL,
      billing_cycle TEXT DEFAULT 'monthly',
      popular INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      start_date TEXT NOT NULL,
      next_ship_date TEXT,
      pause_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (plan_id) REFERENCES plans(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subscription_id TEXT,
      plan_id TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_method TEXT,
      paid_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
      FOREIGN KEY (plan_id) REFERENCES plans(id)
    );

    CREATE TABLE IF NOT EXISTS boxes (
      id TEXT PRIMARY KEY,
      subscription_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      shipped_at TEXT,
      delivered_at TEXT,
      tracking_number TEXT,
      logistics_company TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS box_snacks (
      id TEXT PRIMARY KEY,
      box_id TEXT NOT NULL,
      snack_id TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      FOREIGN KEY (box_id) REFERENCES boxes(id),
      FOREIGN KEY (snack_id) REFERENCES snacks(id)
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      snack_id TEXT NOT NULL,
      box_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (snack_id) REFERENCES snacks(id),
      FOREIGN KEY (box_id) REFERENCES boxes(id),
      UNIQUE(user_id, snack_id, box_id)
    );
  `);
}

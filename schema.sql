CREATE TABLE IF NOT EXISTS products (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  roast TEXT NOT NULL CHECK (roast IN ('light','medium','dark')),
  notes TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL,
  tint TEXT NOT NULL DEFAULT 'tint-1',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS subscribers (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL DEFAULT 'newsletter',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL CHECK (plan IN ('weekly','fortnightly','monthly')),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

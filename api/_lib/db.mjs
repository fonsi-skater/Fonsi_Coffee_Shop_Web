import { sql } from '@vercel/postgres';

let ready = null;

export function db() {
  if (!ready) {
    ready = (async () => {
      await sql`CREATE TABLE IF NOT EXISTS products (
        slug TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        roast TEXT NOT NULL CHECK (roast IN ('light','medium','dark')),
        notes TEXT NOT NULL DEFAULT '',
        price_cents INTEGER NOT NULL,
        tint TEXT NOT NULL DEFAULT 'tint-1',
        sort_order INTEGER NOT NULL DEFAULT 0
      )`;
      await sql`CREATE TABLE IF NOT EXISTS subscribers (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        source TEXT NOT NULL DEFAULT 'newsletter',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await sql`CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        plan TEXT NOT NULL CHECK (plan IN ('weekly','fortnightly','monthly')),
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      const existing = await sql`SELECT COUNT(*)::int AS n FROM products`;
      if (existing.rows[0].n === 0) {
        await sql`INSERT INTO products (slug, name, roast, notes, price_cents, tint, sort_order) VALUES
          ('sunrise-blend','Sunrise Blend','light','Citrus,Honey,Jasmine',1800,'tint-1',1),
          ('ember-house','Ember House','medium','Cocoa,Caramel,Almond',1600,'tint-5',2),
          ('yirgacheffe-gold','Yirgacheffe Gold','light','Bergamot,Peach,Black tea',2100,'tint-2',3),
          ('colombia-huila','Colombia Huila','medium','Red apple,Toffee,Plum',1900,'tint-3',4),
          ('midnight-oak','Midnight Oak','dark','Dark chocolate,Smoke,Molasses',1700,'tint-6',5),
          ('sumatra-reserve','Sumatra Reserve','dark','Cedar,Brown sugar,Dried fig',2000,'tint-4',6)
          ON CONFLICT (slug) DO NOTHING`;
      }
    })().catch(err => {
      ready = null;
      throw err;
    });
  }
  return ready;
}

export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.end(JSON.stringify(body));
}

export function isEmail(v) {
  return typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) && v.length <= 254;
}

export async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function handleCors(req, res) {
  if (req.method === 'OPTIONS') {
    json(res, 204, {});
    return true;
  }
  return false;
}

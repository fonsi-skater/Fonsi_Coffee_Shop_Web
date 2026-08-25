import { sql } from '@vercel/postgres';
import { db, json, handleCors } from './_lib/db.mjs';

export default async function handler(req, res) {
  if (await handleCors(req, res)) return;
  if (req.method !== 'GET') {
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }
  try {
    await db();
    const { rows } = await sql`SELECT slug, name, roast, notes, price_cents, tint
      FROM products ORDER BY sort_order ASC`;
    json(res, 200, {
      ok: true,
      products: rows.map(r => ({
        slug: r.slug,
        name: r.name,
        roast: r.roast,
        notes: r.notes ? r.notes.split(',').map(s => s.trim()) : [],
        priceCents: r.price_cents,
        tint: r.tint
      }))
    });
  } catch (err) {
    console.error('products error:', err);
    json(res, 503, { ok: false, error: 'Database not configured' });
  }
}

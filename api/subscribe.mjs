import { sql } from '@vercel/postgres';
import { db, json, isEmail, readJson, handleCors } from './_lib/db.mjs';

export default async function handler(req, res) {
  if (await handleCors(req, res)) return;
  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }
  const body = await readJson(req);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!isEmail(email)) {
    return json(res, 400, { ok: false, error: 'Please enter a valid email address.' });
  }
  try {
    await db();
    const inserted = await sql`
      INSERT INTO subscribers (email, source)
      VALUES (${email}, 'newsletter')
      ON CONFLICT (email) DO NOTHING
      RETURNING id`;
    const isNew = inserted.rows.length > 0;
    json(res, isNew ? 201 : 200, {
      ok: true,
      message: isNew
        ? 'Welcome in — check your inbox for 15% off.'
        : 'You are already on the list. Coffee is coming.'
    });
  } catch (err) {
    console.error('subscribe error:', err);
    json(res, 503, { ok: false, error: 'Database not configured' });
  }
}

import { sql } from '@vercel/postgres';
import { db, json, isEmail, readJson, handleCors } from './_lib/db.mjs';

const PLANS = new Set(['weekly', 'fortnightly', 'monthly']);

export default async function handler(req, res) {
  if (await handleCors(req, res)) return;
  if (req.method !== 'POST') {
    return json(res, 405, { ok: false, error: 'Method not allowed' });
  }
  const body = await readJson(req);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const plan = typeof body.plan === 'string' ? body.plan.trim().toLowerCase() : '';
  if (!isEmail(email)) {
    return json(res, 400, { ok: false, error: 'Please enter a valid email address.' });
  }
  if (!PLANS.has(plan)) {
    return json(res, 400, { ok: false, error: 'Please choose a delivery plan.' });
  }
  try {
    await db();
    await sql`
      INSERT INTO subscriptions (email, plan)
      VALUES (${email}, ${plan})
      ON CONFLICT (email) DO UPDATE SET plan = EXCLUDED.plan, status = 'active'`;
    await sql`
      INSERT INTO subscribers (email, source)
      VALUES (${email}, 'subscription')
      ON CONFLICT (email) DO NOTHING`;
    json(res, 201, {
      ok: true,
      message: 'Subscription started — your first roast ships within 48 hours.'
    });
  } catch (err) {
    console.error('subscriptions error:', err);
    json(res, 503, { ok: false, error: 'Database not configured' });
  }
}

import { readFileSync, existsSync } from 'node:fs';
import { sql } from '@vercel/postgres';
import { db } from '../api/_lib/db.mjs';

for (const f of ['.env.local', '.env.development.local', '.env']) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
}

await db();
const r = await sql`SELECT slug, name, roast FROM products ORDER BY sort_order`;
console.log(`Seeded ${r.rows.length} products via production db() path:`);
for (const p of r.rows) console.log(`  - ${p.slug} (${p.roast})`);
process.exit(0);

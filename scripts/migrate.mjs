import { readFileSync, existsSync } from 'node:fs';
import { sql } from '@vercel/postgres';

function loadEnv(file) {
  if (!existsSync(file)) return false;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(m[1] in process.env)) process.env[m[1]] = v;
  }
  return true;
}

let found = false;
for (const f of ['.env.local', '.env.development.local', '.env']) {
  if (loadEnv(f)) found = true;
}

const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.error('No POSTGRES_URL found.');
  console.error('Run: npx vercel env pull .env.local');
  console.error('(or copy POSTGRES_URL from Vercel > Storage > ember-oak-db > .env.local into a .env file)');
  process.exit(1);
}
console.log(`Found connection string: ${found ? '(loaded from env file)' : '(from environment)'}`);
console.log(`Host: ${new URL(url).host}\n`);

const raw = readFileSync(new URL('../schema.sql', import.meta.url), 'utf8');
const statements = raw
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

console.log(`Running ${statements.length} migration statements...\n`);
for (const [i, stmt] of statements.entries()) {
  const label = stmt.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1] || `statement ${i + 1}`;
  await sql.query(stmt);
  console.log(`  OK  ${label}`);
}

const tables = ['products', 'subscribers', 'subscriptions'];
console.log('\nVerification:');
for (const t of tables) {
  const res = await sql.query(`SELECT COUNT(*)::int AS n FROM ${t}`);
  console.log(`  ${t.padEnd(14)} ${res.rows[0].n} rows`);
}

console.log('\nMigration complete.');
console.log('Note: the products table self-seeds with the six roasts on the first GET /api/products request.');
process.exit(0);

/**
 * CFP Malaysia — Database Client
 * Supports Turso (cloud) and local SQLite via @libsql/client + Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL || 'file:./data/cfp_local.db';

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (_db) return _db;

  if (TURSO_URL && TURSO_TOKEN) {
    // ── Turso cloud ──────────────────────────────────────────────────────────
    console.log('[DB] ☁️  Connecting to Turso cloud');
    const client = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    });
    _db = drizzle(client, { schema });
  } else {
    // ── Local SQLite ────────────────────────────────────────────────────────
    console.log('[DB] 💾  Using local SQLite:', DATABASE_URL);
    const client = createClient({ url: DATABASE_URL });
    _db = drizzle(client, { schema });
  }

  return _db;
}

export { schema };

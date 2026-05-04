import { defineConfig } from 'drizzle-kit';

const dbCredentials: Record<string, string> = {
  url: process.env.DATABASE_URL || 'file:./data/cfp_local.db',
};

if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  dbCredentials.url = process.env.TURSO_DATABASE_URL;
  dbCredentials.authToken = process.env.TURSO_AUTH_TOKEN;
}

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials,
});
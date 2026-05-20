import { defineConfig } from 'drizzle-kit';
import path from 'path';

export default defineConfig({
  schema: path.resolve(__dirname, './lib/db/schema.ts').replace(/\\/g, '/'),
  out: path.resolve(__dirname, './lib/db/migrations').replace(/\\/g, '/'),
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

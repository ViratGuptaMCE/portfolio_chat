import { config } from 'dotenv';
import path from 'path';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';

// Ensure env vars are loaded when this package is imported outside of Next.js
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '../../.env.local') });

if (!process.env.DATABASE_URL) {
  console.warn('[DB WARNING] DATABASE_URL is not set in environment variables.');
}

// Create a connection pool to Neon
const sql = neon(process.env.DATABASE_URL || 'postgres://localhost:5432/mock');

// Export the Drizzle client, schema, and drizzle-orm operators
export const db = drizzle(sql, { schema });
export * from './schema.js';
export * from 'drizzle-orm';

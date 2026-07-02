import { config } from 'dotenv';
import path from 'path';

// Ensure env vars are loaded when this package is imported outside of Next.js
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '../../.env.local') });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables.');
}

// Create a connection pool to Neon
const sql = neon(process.env.DATABASE_URL);

// Export the Drizzle client and the schema
export const db = drizzle(sql, { schema });
export * from './schema';

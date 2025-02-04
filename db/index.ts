import pkg from 'pg';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "./schema";

const { Pool: PgPool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const isProduction = process.env.NODE_ENV === 'production';

let pool;
let db;

if (isProduction) {
  // Production: Use Neon with WebSocket
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: process.env.DATABASE_URL });
  db = drizzleNeon({ client: pool, schema });
} else {
  // Development: Use local PostgreSQL
  pool = new PgPool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
}

export { pool, db };
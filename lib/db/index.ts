import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '../env';

/**
 * 🔒 SECURITY ARCHITECTURE NOTICE & DEFENSE-IN-DEPTH (§8.1 & §9.4):
 *
 * This Drizzle ORM client connects directly to the database using the high-privilege
 * pooled connection string (`DATABASE_URL`). Since it connects with superuser / service-role
 * administrator credentials, standard PostgreSQL Row-Level Security (RLS) policies are
 * bypassed for all Drizzle queries.
 *
 * ⚠️ CRITICAL MITIGATION AGAINST IDOR VULNERABILITIES:
 * - Application-level security is our primary line of defense.
 * - Every database query, update, or deletion executed via Drizzle MUST explicitly enforce
 *   user ownership checks in the SQL filter clauses (e.g., `.where(and(eq(table.id, id), eq(table.userId, userId)))`).
 * - Never trust raw user-supplied IDs without verifying ownership.
 */
const client = postgres(env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });

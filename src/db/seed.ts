import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  const permissionsList = [
    { action: 'org:view', description: 'View organization details' },
    { action: 'org:update', description: 'Edit organization settings' },
    { action: 'org:delete', description: 'Delete the organization' },
    { action: 'member:invite', description: 'Invite new members' },
    { action: 'member:remove', description: 'Remove existing members' },
    { action: 'role:manage', description: 'Create and manage custom roles' },
    { action: 'project:create', description: 'Create new projects' },
    { action: 'project:delete', description: 'Delete projects' },
    { action: 'task:create', description: 'Create tasks' },
    { action: 'task:delete', description: 'Delete tasks' },
  ];

  await db.insert(schema.permissions).values(permissionsList);

  console.log('Permissions seeded ✅');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
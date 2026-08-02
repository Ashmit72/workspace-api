import { pgTable, uuid, text, timestamp, pgEnum, boolean, primaryKey } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['owner', 'admin', 'member']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userOrgRoles = pgTable('user_org_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'restrict' }).notNull(),
});

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  action: text('action').notNull().unique(),
  description: text('description'),
});

export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  isSystem: boolean('is_system').notNull().default(false),
});

export const rolePermissions = pgTable('role_permissions', {
  roleId: uuid('role_id').references(() => roles.id, { onDelete: 'cascade' }).notNull(),
  permissionId: uuid('permission_id').references(() => permissions.id, { onDelete: 'cascade' }).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.roleId, t.permissionId] }),
}));

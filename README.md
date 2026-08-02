# Workspace API

A multi-tenant team workspace backend built with **NestJS**, **Drizzle ORM**, and **PostgreSQL**, featuring a fully dynamic, database-driven **Role-Based Access Control (RBAC)** system.

Unlike a typical hardcoded-role setup (`admin` / `user` enums baked into code), this project treats **roles and permissions as data**. Organizations get their own set of roles, each with a customizable list of permissions — the same architecture used by tools like Notion, Linear, and Slack for workspace-level access control.

---

## Features

- **JWT Authentication** — signup/login with hashed passwords (bcrypt) via Passport
- **Multi-tenant organizations** — a user can belong to multiple orgs, with a different role in each
- **Dynamic RBAC** — roles and permissions live in the database, not in code
  - `permissions` — the master catalog of every action the app supports (`org:delete`, `member:invite`, etc.)
  - `roles` — org-scoped roles (e.g. Owner, Admin, Member), each just a name
  - `role_permissions` — join table stapling permissions to a role
  - `user_org_roles` — links a user to an org via a specific role
- **Auto-provisioned default roles** — every new organization automatically gets Owner / Admin / Member roles with sensible default permissions
- **Permission-gated routes** — a single reusable `PermissionsGuard` + `@RequirePermission()` decorator checks DB-backed permissions on any route
- **Member invite flow** — org owners/admins can add existing users to their org with a specific role
- **DTO validation** — all incoming request bodies validated via `class-validator` (whitelisting, type checks, length constraints)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [NestJS](https://nestjs.com/) |
| ORM | [Drizzle ORM](https://orm.drizzle.team/) |
| Database | PostgreSQL ([Neon](https://neon.tech/)) |
| Auth | Passport + `passport-jwt` + `@nestjs/jwt` |
| Validation | `class-validator` / `class-transformer` |
| Password hashing | `bcrypt` |

---

## Architecture: How Permissions Work

```
users ──────┐
            │
            ▼
   user_org_roles ────► organizations
            │
            ▼
          roles ◄──── organizationId (roles are scoped per org)
            │
            ▼
   role_permissions
            │
            ▼
       permissions
```

When a request hits a permission-gated route:

1. `JwtAuthGuard` verifies the token and populates `request.user`
2. `PermissionsGuard` looks up the user's `roleId` for the specific org in the request (via `user_org_roles`)
3. It fetches that role's permission list (via `role_permissions` → `permissions`)
4. It checks whether the route's required permission (set via `@RequirePermission('org:delete')`) is in that list
5. Allows or throws a `403 Forbidden`

No role names or permissions are ever hardcoded in guard logic — everything is a relational lookup.

---

## Project Structure

```
src/
  auth/               # signup, login, JWT strategy & guard
  users/              # user lookup/creation
  organizations/       # org CRUD, invite flow
  common/
    decorators/        # @RequirePermission()
    guards/             # PermissionsGuard
  db/
    schema.ts          # Drizzle schema (all tables)
    drizzle.module.ts  # DB client provider
    seed.ts            # seeds the permission catalog
```

---

## Database Schema Overview

| Table | Purpose |
|---|---|
| `users` | Registered accounts |
| `organizations` | Tenant/workspace records |
| `roles` | Named roles, scoped to one organization (`organizationId`) |
| `permissions` | Master catalog of app-wide actions (e.g. `member:invite`) |
| `role_permissions` | Many-to-many: which permissions belong to which role |
| `user_org_roles` | Which role a user holds in a specific organization |

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

```
DATABASE_URL=postgresql://user:password@host/dbname
JWT_SECRET=your_jwt_secret_here
PORT=3000
```

### 3. Run migrations

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 4. Seed the permission catalog

```bash
npm run seed
```

### 5. Start the dev server

```bash
npm run start:dev
```

---

## API Reference

### Auth

| Method | Route | Body | Description |
|---|---|---|---|
| POST | `/auth/signup` | `{ email, password }` | Register a new user, returns JWT |
| POST | `/auth/login` | `{ email, password }` | Log in, returns JWT |
| GET | `/auth/me` | — | Returns the authenticated user (requires `Authorization: Bearer <token>`) |

### Organizations

All routes below require `Authorization: Bearer <token>`.

| Method | Route | Body | Required Permission | Description |
|---|---|---|---|---|
| POST | `/organizations` | `{ name }` | — (any authed user) | Creates an org; creator becomes Owner |
| GET | `/organizations` | — | — (any authed user) | Lists orgs the current user belongs to, with their role |
| DELETE | `/organizations/:orgId` | — | `org:delete` | Deletes an organization |
| POST | `/organizations/:orgId/members` | `{ email, roleName }` | `member:invite` | Adds an existing user to the org with the given role (`Admin` or `Member`) |

---

## Default Permission Catalog

| Permission | Description |
|---|---|
| `org:view` | View organization details |
| `org:update` | Edit organization settings |
| `org:delete` | Delete the organization |
| `member:invite` | Invite new members |
| `member:remove` | Remove existing members |
| `role:manage` | Create and manage custom roles |
| `project:create` | Create new projects |
| `project:delete` | Delete projects |
| `task:create` | Create tasks |
| `task:delete` | Delete tasks |

## Default Role Permissions

| Role | Permissions |
|---|---|
| **Owner** | All permissions |
| **Admin** | All except `org:delete` |
| **Member** | `org:view`, `project:create`, `task:create`, `task:delete` |

---

## Roadmap

- [ ] Ownership-based rules with CASL (e.g. "can delete only tasks you created")
- [ ] `projects` and `tasks` modules with real feature routes
- [ ] Custom role creation API (org admins define their own roles/permissions)
- [ ] Redis caching for permission lookups
- [ ] Audit log for role/permission changes
- [ ] Rate limiting on sensitive endpoints (invites, role management)

---

## License

MIT
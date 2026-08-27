import { Injectable, Inject, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { DRIZZLE } from '../db/drizzle.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class OrganizationsService {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
    private usersService: UsersService
  ) { }


  async inviteMember(orgId: string, email: string, roleName: string) {
    // 1. find the user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('No user found with that email');
    }

    // 2. find the role, scoped to THIS org
    const [role] = await this.db
      .select()
      .from(schema.roles)
      .where(
        and(
          eq(schema.roles.organizationId, orgId),
          eq(schema.roles.name, roleName),
        ),
      );
    if (!role) {
      throw new NotFoundException(`Role "${roleName}" not found for this organization`);
    }

    if (role.isSystem && role.name === 'Owner') {
      throw new ForbiddenException('Cannot invite someone directly as Owner');
    }

    // 3. check they're not already a member
    const [existing] = await this.db
      .select()
      .from(schema.userOrgRoles)
      .where(
        and(
          eq(schema.userOrgRoles.userId, user.id),
          eq(schema.userOrgRoles.organizationId, orgId),
        ),
      );
    if (existing) {
      throw new ConflictException('User is already a member of this organization');
    }

    // 4. create the membership
    await this.db.insert(schema.userOrgRoles).values({
      userId: user.id,
      organizationId: orgId,
      roleId: role.id,
    });

    return { message: `${email} added as ${roleName}` };
  }

  async create(name: string, ownerId: string) {
    // 1. create the org
    const [org] = await this.db
      .insert(schema.organizations)
      .values({ name })
      .returning();

    // 2. fetch the full permission catalog once
    const allPermissions = await this.db.select().from(schema.permissions);
    const findPerm = (action: string) =>
      allPermissions.find((p) => p.action === action)!.id;

    // 3. define which permissions each default role gets
    const roleDefinitions = [
      {
        name: 'Owner',
        permissions: allPermissions.map((p) => p.id), // literally all of them
      },
      {
        name: 'Admin',
        permissions: allPermissions
          .filter((p) => p.action !== 'org:delete')
          .map((p) => p.id),
      },
      {
        name: 'Member',
        permissions: [
          findPerm('org:view'),
          findPerm('project:create'),
          findPerm('task:create'),
          findPerm('task:delete'),
        ],
      },
    ];

    // 4. create each role row + staple its permissions
    let ownerRoleId: string | null = null;

    for (const def of roleDefinitions) {
      const [role] = await this.db
        .insert(schema.roles)
        .values({
          name: def.name,
          organizationId: org.id,
          isSystem: true,
        })
        .returning();

      if (def.name === 'Owner') ownerRoleId = role.id;

      await this.db.insert(schema.rolePermissions).values(
        def.permissions.map((permissionId) => ({
          roleId: role.id,
          permissionId,
        })),
      );
    }

    // 5. link the creator to the org using the Owner role
    await this.db.insert(schema.userOrgRoles).values({
      userId: ownerId,
      organizationId: org.id,
      roleId: ownerRoleId!,
    });

    return org;
  }

  async findUserOrgs(userId: string) {
    return this.db
      .select({
        orgId: schema.organizations.id,
        orgName: schema.organizations.name,
        roleName: schema.roles.name,
      })
      .from(schema.userOrgRoles)
      .innerJoin(
        schema.organizations,
        eq(schema.organizations.id, schema.userOrgRoles.organizationId),
      )
      .innerJoin(
        schema.roles,
        eq(schema.roles.id, schema.userOrgRoles.roleId),
      )
      .where(eq(schema.userOrgRoles.userId, userId));
  }

  async remove(orgId: string) {
    // delete children first
    await this.db.delete(schema.userOrgRoles).where(eq(schema.userOrgRoles.organizationId, orgId));
    // then the parent
    await this.db.delete(schema.organizations).where(eq(schema.organizations.id, orgId));
    return { message: 'Organization deleted' };
  }

  async createCustomRole(orgId: string, name: string, permissionIds: string[]) {
    // 1. prevent duplicate role names within the same org
    const [existing] = await this.db
      .select()
      .from(schema.roles)
      .where(and(eq(schema.roles.organizationId, orgId), eq(schema.roles.name, name)));
    if (existing) {
      throw new ConflictException(`Role "${name}" already exists in this organization`);
    }

    // 2. validate the permission IDs actually exist in the catalog
    const validPermissions = await this.db
      .select()
      .from(schema.permissions)
      .where(inArray(schema.permissions.id, permissionIds));

    if (validPermissions.length !== permissionIds.length) {
      throw new NotFoundException('One or more permission IDs are invalid');
    }

    // 3. create the role
    const [role] = await this.db
      .insert(schema.roles)
      .values({ name, organizationId: orgId, isSystem: false })
      .returning();

    // 4. staple the permissions
    await this.db.insert(schema.rolePermissions).values(
      permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
    );

    return role;
  }

  async getRolesForOrg(orgId: string) {
    return this.db
      .select()
      .from(schema.roles)
      .where(eq(schema.roles.organizationId, orgId));
  }
}
import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/require-permission.decorator';
import { DRIZZLE } from '../../db/drizzle.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) return true; // no @RequirePermission() = allow any authed user

    const req = context.switchToHttp().getRequest();
    const userId = req.user.userId;
    const orgId = req.params.orgId;

    if (!orgId) {
      throw new ForbiddenException('Organization ID missing from request');
    }

    // find this user's role in this org
    const [membership] = await this.db
      .select({ roleId: schema.userOrgRoles.roleId })
      .from(schema.userOrgRoles)
      .where(
        and(
          eq(schema.userOrgRoles.userId, userId),
          eq(schema.userOrgRoles.organizationId, orgId),
        ),
      );

    if (!membership) {
      throw new ForbiddenException('You are not a member of this organization');
    }

    // fetch that role's stapled permissions
    const grantedPermissions = await this.db
      .select({ action: schema.permissions.action })
      .from(schema.rolePermissions)
      .innerJoin(schema.permissions, eq(schema.permissions.id, schema.rolePermissions.permissionId))
      .where(eq(schema.rolePermissions.roleId, membership.roleId));

    const grantedActions = grantedPermissions.map((p) => p.action);

    const hasAllRequired = requiredPermissions.every((perm) =>
      grantedActions.includes(perm),
    );

    if (!hasAllRequired) {
      throw new ForbiddenException(
        `Missing required permission(s): ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
import { Body, Controller, Delete, Get, Post, Req, UseGuards, Param } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth/jwt-auth.guard';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { InviteMemberDto } from './dto/invite-member.dto';
import { CreateRoleDto } from './dto/create-role.dto';


@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
    constructor(private orgsService: OrganizationsService) { }
    @Post()
    create(@Body() createOrganizationDto: CreateOrganizationDto, @Req() req) {
        return this.orgsService.create(createOrganizationDto.name, req.user.userId)
    }

    @Get()
    findMine(@Req() req) {
        return this.orgsService.findUserOrgs(req.user.userId)
    }

    @Post(":orgId/roles")
    @UseGuards(PermissionsGuard)
    @RequirePermission('role:manage')
    createRole(@Param('orgId') orgId: string, @Body() dto: CreateRoleDto) {
        return this.orgsService.createCustomRole(orgId, dto.name, dto.permissionIds)
    }

    @Get(':orgId/roles')
    @UseGuards(PermissionsGuard)
    @RequirePermission('role:manage')
    listRoles(@Param('orgId') orgId: string) {
        return this.orgsService.getRolesForOrg(orgId);
    }

    @Delete(':orgId')
    @UseGuards(PermissionsGuard)
    @RequirePermission('org:delete')
    remove(@Param('orgId') orgId: string) {
        return this.orgsService.remove(orgId);
    }

    @Post(':orgId/members')
    @UseGuards(PermissionsGuard)
    @RequirePermission('member:invite')
    inviteMember(@Param('orgId') orgId: string, @Body() dto: InviteMemberDto) {
        return this.orgsService.inviteMember(orgId, dto.email, dto.roleName);
    }
}

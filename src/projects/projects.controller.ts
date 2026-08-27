import { Controller, Post, Get, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project-dto';

@Controller('organizations/:orgId/projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @RequirePermission('project:create')
  create(@Param('orgId') orgId: string, @Body() dto: CreateProjectDto, @Req() req) {
    return this.projectsService.create(orgId, dto.name, req.user.userId);
  }

  @Get()
  findAll(@Param('orgId') orgId: string) {
    return this.projectsService.findAllForOrg(orgId);
  }

  @Delete(':projectId')
  @UseGuards(PermissionsGuard)
  @RequirePermission('project:delete')
  remove(@Param('orgId') orgId: string, @Param('projectId') projectId: string) {
    return this.projectsService.remove(orgId, projectId);
  }
}
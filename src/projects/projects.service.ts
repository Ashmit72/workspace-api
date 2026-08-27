import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../db/drizzle.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class ProjectsService {
  constructor(@Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>) {}

  async create(orgId: string, name: string, userId: string) {
    const [project] = await this.db
      .insert(schema.projects)
      .values({ name, organizationId: orgId, createdBy: userId })
      .returning();
    return project;
  }

  async findAllForOrg(orgId: string) {
    return this.db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.organizationId, orgId));
  }

  async findOne(orgId: string, projectId: string) {
    const [project] = await this.db
      .select()
      .from(schema.projects)
      .where(and(eq(schema.projects.id, projectId), eq(schema.projects.organizationId, orgId)));
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async remove(orgId: string, projectId: string) {
    await this.findOne(orgId, projectId); // throws 404 if it doesn't belong to this org
    await this.db.delete(schema.projects).where(eq(schema.projects.id, projectId));
    return { message: 'Project deleted' };
  }
}
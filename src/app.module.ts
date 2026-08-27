import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './db/drizzle.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PermissionsController } from './permissions/permissions.controller';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [DrizzleModule, AuthModule, UsersModule, OrganizationsModule, ProjectsModule, TasksModule],
  controllers: [AppController, PermissionsController],
  providers: [AppService],
})
export class AppModule {}

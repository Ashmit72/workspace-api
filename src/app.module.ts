import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DrizzleModule } from './db/drizzle.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { PermissionsController } from './permissions/permissions.controller';

@Module({
  imports: [DrizzleModule, AuthModule, UsersModule, OrganizationsModule],
  controllers: [AppController, PermissionsController],
  providers: [AppService],
})
export class AppModule {}

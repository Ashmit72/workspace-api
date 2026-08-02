import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports:[UsersModule],
  providers: [OrganizationsService],
  controllers: [OrganizationsController]
})
export class OrganizationsModule {}

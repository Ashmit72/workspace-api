import { Controller, Get, Inject } from '@nestjs/common';
import { DRIZZLE } from './db/drizzle.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './db/schema';

@Controller()
export class AppController {
  constructor(
    @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>,
  ) {}

  @Get('test-db')
  async testDb() {
    return this.db.select().from(schema.users);
  }
}
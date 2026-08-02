import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/db/drizzle.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from "../db/schema"
import { eq } from 'drizzle-orm';


@Injectable()
export class UsersService {

    constructor(
        @Inject(DRIZZLE) private db: NodePgDatabase<typeof schema>
    ) { }

    async findByEmail(email: string) {
        const [user] = await this.db
            .select()
            .from(schema.users)
            .where(eq(schema.users.email, email));
        return user;
    }

    async create(email: string, hashedPassword: string) {
        const [user] = await this.db
            .insert(schema.users)
            .values({ email, password: hashedPassword })
            .returning();
        return user;
    }

}

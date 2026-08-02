ALTER TABLE "user_org_roles" ADD COLUMN "role_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "user_org_roles" ADD CONSTRAINT "user_org_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_org_roles" DROP COLUMN "role";
CREATE TABLE "permissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" text NOT NULL,
	"description" text,
	CONSTRAINT "permissions_action_unique" UNIQUE("action")
);

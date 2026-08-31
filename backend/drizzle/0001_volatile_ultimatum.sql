CREATE TYPE "public"."habit_frequency" AS ENUM('daily', 'weekly', 'custom');--> statement-breakpoint
CREATE TABLE "habits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"frequency" "habit_frequency" DEFAULT 'daily' NOT NULL,
	"color" varchar(20) DEFAULT '#26519e' NOT NULL,
	"icon" varchar(4) DEFAULT '✅' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
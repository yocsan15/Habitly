ALTER TABLE "habits" ADD COLUMN "monthly_goal" integer;--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "volume_goal" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "volume_unit" varchar(20);--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "reminder_time" varchar(5);--> statement-breakpoint
ALTER TABLE "habits" ADD COLUMN "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "habit_logs" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "habit_logs" ADD COLUMN "quantity" numeric(12, 2);
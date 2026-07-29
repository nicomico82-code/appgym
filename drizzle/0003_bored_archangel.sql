CREATE TABLE `workout_timers` (
	`owner_key` text PRIMARY KEY NOT NULL,
	`started_at` text,
	`accumulated_seconds` integer DEFAULT 0 NOT NULL,
	`running` integer DEFAULT false NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `workout_sessions` ADD `duration_seconds` integer;
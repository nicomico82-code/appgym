CREATE TABLE `workout_drafts` (
	`owner_key` text PRIMARY KEY NOT NULL,
	`template_id` text DEFAULT 'A' NOT NULL,
	`session_id` text,
	`exercises_json` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

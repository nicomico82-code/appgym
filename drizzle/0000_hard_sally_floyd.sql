CREATE TABLE `analysis_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`window_start` text NOT NULL,
	`window_end` text NOT NULL,
	`rule_set_id` text NOT NULL,
	`input_hash` text NOT NULL,
	`input_snapshot_json` text NOT NULL,
	`generated_by` text DEFAULT 'rules' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`rule_set_id`) REFERENCES `rule_sets`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `analysis_runs_user_kind_idx` ON `analysis_runs` (`user_id`,`kind`,`created_at`);--> statement-breakpoint
CREATE TABLE `athlete_measurements` (
	`id` text PRIMARY KEY NOT NULL,
	`athlete_profile_id` text NOT NULL,
	`measured_on` text NOT NULL,
	`body_weight_grams` integer,
	`source` text DEFAULT 'manual' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`athlete_profile_id`) REFERENCES `athlete_profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `measurements_profile_date_idx` ON `athlete_measurements` (`athlete_profile_id`,`measured_on`);--> statement-breakpoint
CREATE TABLE `athlete_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`experience_level` text DEFAULT 'beginner' NOT NULL,
	`primary_goal` text DEFAULT 'hypertrophy' NOT NULL,
	`birth_date` text,
	`height_mm` integer,
	`onboarding_status` text DEFAULT 'started' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `athlete_profiles_user_uq` ON `athlete_profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `athlete_profiles_goal_idx` ON `athlete_profiles` (`primary_goal`);--> statement-breakpoint
CREATE TABLE `exercise_aliases` (
	`id` text PRIMARY KEY NOT NULL,
	`exercise_id` text NOT NULL,
	`alias` text NOT NULL,
	`normalized_alias` text NOT NULL,
	`normalization_version` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercise_aliases_normalized_uq` ON `exercise_aliases` (`normalized_alias`);--> statement-breakpoint
CREATE INDEX `exercise_aliases_exercise_idx` ON `exercise_aliases` (`exercise_id`);--> statement-breakpoint
CREATE TABLE `exercise_alternatives` (
	`id` text PRIMARY KEY NOT NULL,
	`source_exercise_id` text NOT NULL,
	`target_exercise_id` text NOT NULL,
	`rank` integer DEFAULT 1 NOT NULL,
	`reason` text DEFAULT 'Patrón de movimiento similar' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`source_exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`target_exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercise_alternatives_pair_uq` ON `exercise_alternatives` (`source_exercise_id`,`target_exercise_id`);--> statement-breakpoint
CREATE INDEX `exercise_alternatives_source_idx` ON `exercise_alternatives` (`source_exercise_id`,`active`,`rank`);--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`canonical_name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`primary_muscle` text NOT NULL,
	`movement_pattern` text NOT NULL,
	`equipment` text,
	`tracking_mode` text DEFAULT 'load_reps' NOT NULL,
	`load_region` text DEFAULT 'other' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exercises_normalized_name_uq` ON `exercises` (`normalized_name`);--> statement-breakpoint
CREATE INDEX `exercises_primary_muscle_idx` ON `exercises` (`primary_muscle`);--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` text PRIMARY KEY NOT NULL,
	`analysis_run_id` text NOT NULL,
	`type` text NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`decision_code` text NOT NULL,
	`exercise_id` text,
	`summary` text NOT NULL,
	`rationale` text NOT NULL,
	`action_json` text NOT NULL,
	`evidence_json` text NOT NULL,
	`expires_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`analysis_run_id`) REFERENCES `analysis_runs`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `recommendations_exercise_date_idx` ON `recommendations` (`exercise_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `rule_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`version` text NOT NULL,
	`engine_version` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`effective_from` text,
	`config_json` text NOT NULL,
	`content_hash` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`published_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rule_sets_version_uq` ON `rule_sets` (`version`);--> statement-breakpoint
CREATE TABLE `session_exercises` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`exercise_id` text,
	`exercise_name_snapshot` text NOT NULL,
	`primary_muscle_snapshot` text,
	`tracking_mode_snapshot` text DEFAULT 'load_reps' NOT NULL,
	`order_index` integer NOT NULL,
	`reported_rpe_x10` integer,
	`data_granularity` text DEFAULT 'per_set' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `workout_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_exercises_order_uq` ON `session_exercises` (`session_id`,`order_index`);--> statement-breakpoint
CREATE INDEX `session_exercises_exercise_idx` ON `session_exercises` (`exercise_id`,`session_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_key` text NOT NULL,
	`email` text,
	`display_name` text DEFAULT 'Socio' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_owner_key_uq` ON `users` (`owner_key`);--> statement-breakpoint
CREATE TABLE `workout_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text DEFAULT 'Entrenamiento' NOT NULL,
	`performed_on` text NOT NULL,
	`timezone` text DEFAULT 'America/Santiago' NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`client_idempotency_key` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workout_sessions_user_date_idx` ON `workout_sessions` (`user_id`,`performed_on`,`status`);--> statement-breakpoint
CREATE TABLE `workout_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`session_exercise_id` text NOT NULL,
	`set_number` integer NOT NULL,
	`set_type` text DEFAULT 'working' NOT NULL,
	`load_grams` integer,
	`reps` integer,
	`duration_seconds` integer,
	`distance_meters` integer,
	`rpe_x10` integer,
	`completed` integer DEFAULT false NOT NULL,
	`reached_failure` integer DEFAULT false NOT NULL,
	`is_inferred` integer DEFAULT false NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`session_exercise_id`) REFERENCES `session_exercises`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workout_sets_number_uq` ON `workout_sets` (`session_exercise_id`,`set_number`);
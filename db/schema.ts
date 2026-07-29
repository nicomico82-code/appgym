import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    ownerKey: text("owner_key").notNull(),
    email: text("email"),
    displayName: text("display_name").notNull().default("Socio"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("users_owner_key_uq").on(table.ownerKey)],
);

export const athleteProfiles = sqliteTable(
  "athlete_profiles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    experienceLevel: text("experience_level").notNull().default("beginner"),
    primaryGoal: text("primary_goal").notNull().default("hypertrophy"),
    sex: text("sex").notNull().default("not_specified"),
    birthDate: text("birth_date"),
    heightMm: integer("height_mm"),
    onboardingStatus: text("onboarding_status").notNull().default("started"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("athlete_profiles_user_uq").on(table.userId),
    index("athlete_profiles_goal_idx").on(table.primaryGoal),
  ],
);

export const athleteMeasurements = sqliteTable(
  "athlete_measurements",
  {
    id: text("id").primaryKey(),
    athleteProfileId: text("athlete_profile_id")
      .notNull()
      .references(() => athleteProfiles.id, { onDelete: "cascade" }),
    measuredOn: text("measured_on").notNull(),
    bodyWeightGrams: integer("body_weight_grams"),
    source: text("source").notNull().default("manual"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("measurements_profile_date_idx").on(
      table.athleteProfileId,
      table.measuredOn,
    ),
  ],
);

export const exercises = sqliteTable(
  "exercises",
  {
    id: text("id").primaryKey(),
    canonicalName: text("canonical_name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    primaryMuscle: text("primary_muscle").notNull(),
    movementPattern: text("movement_pattern").notNull(),
    equipment: text("equipment"),
    trackingMode: text("tracking_mode").notNull().default("load_reps"),
    loadRegion: text("load_region").notNull().default("other"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("exercises_normalized_name_uq").on(table.normalizedName),
    index("exercises_primary_muscle_idx").on(table.primaryMuscle),
  ],
);

export const exerciseAliases = sqliteTable(
  "exercise_aliases",
  {
    id: text("id").primaryKey(),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    alias: text("alias").notNull(),
    normalizedAlias: text("normalized_alias").notNull(),
    normalizationVersion: integer("normalization_version").notNull().default(1),
  },
  (table) => [
    uniqueIndex("exercise_aliases_normalized_uq").on(table.normalizedAlias),
    index("exercise_aliases_exercise_idx").on(table.exerciseId),
  ],
);

export const exerciseAlternatives = sqliteTable(
  "exercise_alternatives",
  {
    id: text("id").primaryKey(),
    sourceExerciseId: text("source_exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    targetExerciseId: text("target_exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull().default(1),
    reason: text("reason").notNull().default("Patrón de movimiento similar"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
  },
  (table) => [
    uniqueIndex("exercise_alternatives_pair_uq").on(
      table.sourceExerciseId,
      table.targetExerciseId,
    ),
    index("exercise_alternatives_source_idx").on(
      table.sourceExerciseId,
      table.active,
      table.rank,
    ),
  ],
);

export const workoutSessions = sqliteTable(
  "workout_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("Entrenamiento"),
    performedOn: text("performed_on").notNull(),
    timezone: text("timezone").notNull().default("America/Santiago"),
    status: text("status").notNull().default("completed"),
    source: text("source").notNull().default("manual"),
    notes: text("notes").notNull().default(""),
    clientIdempotencyKey: text("client_idempotency_key"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("workout_sessions_user_date_idx").on(
      table.userId,
      table.performedOn,
      table.status,
    ),
  ],
);

export const sessionExercises = sqliteTable(
  "session_exercises",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id")
      .notNull()
      .references(() => workoutSessions.id, { onDelete: "cascade" }),
    exerciseId: text("exercise_id").references(() => exercises.id, {
      onDelete: "set null",
    }),
    exerciseNameSnapshot: text("exercise_name_snapshot").notNull(),
    primaryMuscleSnapshot: text("primary_muscle_snapshot"),
    trackingModeSnapshot: text("tracking_mode_snapshot")
      .notNull()
      .default("load_reps"),
    orderIndex: integer("order_index").notNull(),
    reportedRpeX10: integer("reported_rpe_x10"),
    dataGranularity: text("data_granularity").notNull().default("per_set"),
    notes: text("notes").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("session_exercises_order_uq").on(
      table.sessionId,
      table.orderIndex,
    ),
    index("session_exercises_exercise_idx").on(
      table.exerciseId,
      table.sessionId,
    ),
  ],
);

export const workoutSets = sqliteTable(
  "workout_sets",
  {
    id: text("id").primaryKey(),
    sessionExerciseId: text("session_exercise_id")
      .notNull()
      .references(() => sessionExercises.id, { onDelete: "cascade" }),
    setNumber: integer("set_number").notNull(),
    setType: text("set_type").notNull().default("working"),
    loadGrams: integer("load_grams"),
    reps: integer("reps"),
    durationSeconds: integer("duration_seconds"),
    distanceMeters: integer("distance_meters"),
    rpeX10: integer("rpe_x10"),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    reachedFailure: integer("reached_failure", { mode: "boolean" })
      .notNull()
      .default(false),
    isInferred: integer("is_inferred", { mode: "boolean" })
      .notNull()
      .default(false),
    notes: text("notes").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("workout_sets_number_uq").on(
      table.sessionExerciseId,
      table.setNumber,
    ),
  ],
);

export const ruleSets = sqliteTable(
  "rule_sets",
  {
    id: text("id").primaryKey(),
    version: text("version").notNull(),
    engineVersion: text("engine_version").notNull(),
    status: text("status").notNull().default("draft"),
    effectiveFrom: text("effective_from"),
    configJson: text("config_json").notNull(),
    contentHash: text("content_hash").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    publishedAt: text("published_at"),
  },
  (table) => [uniqueIndex("rule_sets_version_uq").on(table.version)],
);

export const analysisRuns = sqliteTable(
  "analysis_runs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    windowStart: text("window_start").notNull(),
    windowEnd: text("window_end").notNull(),
    ruleSetId: text("rule_set_id")
      .notNull()
      .references(() => ruleSets.id),
    inputHash: text("input_hash").notNull(),
    inputSnapshotJson: text("input_snapshot_json").notNull(),
    generatedBy: text("generated_by").notNull().default("rules"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("analysis_runs_user_kind_idx").on(
      table.userId,
      table.kind,
      table.createdAt,
    ),
  ],
);

export const recommendations = sqliteTable(
  "recommendations",
  {
    id: text("id").primaryKey(),
    analysisRunId: text("analysis_run_id")
      .notNull()
      .references(() => analysisRuns.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    priority: text("priority").notNull().default("normal"),
    decisionCode: text("decision_code").notNull(),
    exerciseId: text("exercise_id").references(() => exercises.id, {
      onDelete: "set null",
    }),
    summary: text("summary").notNull(),
    rationale: text("rationale").notNull(),
    actionJson: text("action_json").notNull(),
    evidenceJson: text("evidence_json").notNull(),
    expiresAt: text("expires_at"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("recommendations_exercise_date_idx").on(
      table.exerciseId,
      table.createdAt,
    ),
  ],
);

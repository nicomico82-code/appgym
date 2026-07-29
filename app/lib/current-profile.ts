import { cache } from "react";
import { getChatGPTUser } from "../chatgpt-auth";
import { getD1 } from "../../db";

export type CurrentProfile = {
  displayName: string;
  email: string;
  birthDate: string;
  sex: "not_specified" | "female" | "male" | "other";
  heightCm: number | null;
  bodyWeightKg: number | null;
  experienceLevel: "beginner" | "intermediate" | "advanced";
  primaryGoal:
    | "hypertrophy"
    | "strength"
    | "fat_loss"
    | "conditioning"
    | "other";
  onboardingStatus: string;
};

export const getCurrentProfile = cache(async (): Promise<CurrentProfile> => {
  const authenticatedUser = await getChatGPTUser();
  const ownerKey =
    authenticatedUser?.email.trim().toLowerCase() ??
    "pilot-user@entrena.local";
  const fallbackName = authenticatedUser?.fullName ?? "Pedro R.";

  try {
    const db = getD1();
    const row = await db
      .prepare(
        `SELECT
           u.display_name AS displayName,
           COALESCE(u.email, ?) AS email,
           COALESCE(ap.birth_date, '') AS birthDate,
           COALESCE(ap.sex, 'not_specified') AS sex,
           ap.height_mm AS heightMm,
           COALESCE(ap.experience_level, 'beginner') AS experienceLevel,
           COALESCE(ap.primary_goal, 'hypertrophy') AS primaryGoal,
           COALESCE(ap.onboarding_status, 'started') AS onboardingStatus,
           (
             SELECT am.body_weight_grams
             FROM athlete_measurements am
             WHERE am.athlete_profile_id = ap.id
             ORDER BY am.measured_on DESC, am.created_at DESC
             LIMIT 1
           ) AS bodyWeightGrams
         FROM users u
         LEFT JOIN athlete_profiles ap ON ap.user_id = u.id
         WHERE u.owner_key = ?
         LIMIT 1`,
      )
      .bind(authenticatedUser?.email ?? ownerKey, ownerKey)
      .first<{
        displayName: string;
        email: string;
        birthDate: string;
        sex: CurrentProfile["sex"];
        heightMm: number | null;
        bodyWeightGrams: number | null;
        experienceLevel: CurrentProfile["experienceLevel"];
        primaryGoal: CurrentProfile["primaryGoal"];
        onboardingStatus: string;
      }>();

    if (row) {
      return {
        displayName: row.displayName,
        email: row.email,
        birthDate: row.birthDate,
        sex: row.sex,
        heightCm: row.heightMm === null ? null : row.heightMm / 10,
        bodyWeightKg:
          row.bodyWeightGrams === null ? null : row.bodyWeightGrams / 1000,
        experienceLevel: row.experienceLevel,
        primaryGoal: row.primaryGoal,
        onboardingStatus: row.onboardingStatus,
      };
    }
  } catch {
    // Local browser-only previews do not have D1. The deployed site does.
  }

  return {
    displayName: fallbackName,
    email: authenticatedUser?.email ?? "pilot-user@entrena.local",
    birthDate: "",
    sex: "not_specified",
    heightCm: null,
    bodyWeightKg: null,
    experienceLevel: "beginner",
    primaryGoal: "hypertrophy",
    onboardingStatus: "started",
  };
});

export function profileInitials(displayName: string) {
  const parts = displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase()).join("") || "SO";
}

export function experienceLabel(level: CurrentProfile["experienceLevel"]) {
  return {
    beginner: "Principiante",
    intermediate: "Intermedio",
    advanced: "Avanzado",
  }[level];
}

import {
  accessIdentityFromRequest,
  type AccessIdentity,
} from "../../access-session";
import { getD1 } from "../../../db";

type ProfilePayload = {
  displayName?: string;
  birthDate?: string;
  sex?: string;
  heightCm?: number | null;
  bodyWeightKg?: number | null;
  experienceLevel?: string;
  primaryGoal?: string;
};

const allowedSex = new Set(["not_specified", "female", "male", "other"]);
const allowedExperience = new Set(["beginner", "intermediate", "advanced"]);
const allowedGoals = new Set([
  "hypertrophy",
  "strength",
  "fat_loss",
  "conditioning",
  "other",
]);

function validate(payload: ProfilePayload) {
  const displayName = payload.displayName?.trim() ?? "";
  if (displayName.length < 2 || displayName.length > 60) {
    return "El nombre debe tener entre 2 y 60 caracteres.";
  }

  if (payload.birthDate) {
    const birthDate = new Date(`${payload.birthDate}T00:00:00Z`);
    const now = new Date();
    const oldest = new Date();
    oldest.setUTCFullYear(now.getUTCFullYear() - 120);
    if (
      Number.isNaN(birthDate.getTime()) ||
      birthDate > now ||
      birthDate < oldest
    ) {
      return "La fecha de nacimiento no es válida.";
    }
  }

  if (
    payload.heightCm !== null &&
    payload.heightCm !== undefined &&
    (!Number.isFinite(payload.heightCm) ||
      payload.heightCm < 80 ||
      payload.heightCm > 260)
  ) {
    return "La estatura debe estar entre 80 y 260 cm.";
  }

  if (
    payload.bodyWeightKg !== null &&
    payload.bodyWeightKg !== undefined &&
    (!Number.isFinite(payload.bodyWeightKg) ||
      payload.bodyWeightKg < 20 ||
      payload.bodyWeightKg > 500)
  ) {
    return "El peso debe estar entre 20 y 500 kg.";
  }

  if (!payload.sex || !allowedSex.has(payload.sex)) {
    return "La opción de sexo no es válida.";
  }
  if (
    !payload.experienceLevel ||
    !allowedExperience.has(payload.experienceLevel)
  ) {
    return "El nivel de experiencia no es válido.";
  }
  if (!payload.primaryGoal || !allowedGoals.has(payload.primaryGoal)) {
    return "El objetivo seleccionado no es válido.";
  }
}

async function ensureProfile(identity: AccessIdentity) {
  const db = getD1();
  const provisionalUserId = crypto.randomUUID();

  await db
    .prepare(
      `INSERT OR IGNORE INTO users
       (id, owner_key, email, display_name)
       VALUES (?, ?, ?, ?)`,
    )
    .bind(
      provisionalUserId,
      identity.ownerKey,
      null,
      identity.label,
    )
    .run();

  const user = await db
    .prepare("SELECT id FROM users WHERE owner_key = ? LIMIT 1")
    .bind(identity.ownerKey)
    .first<{ id: string }>();
  if (!user) throw new Error("No fue posible identificar al usuario.");

  await db
    .prepare(
      `INSERT OR IGNORE INTO athlete_profiles
       (id, user_id, experience_level, primary_goal, sex, onboarding_status)
       VALUES (?, ?, 'beginner', 'hypertrophy', 'not_specified', 'started')`,
    )
    .bind(crypto.randomUUID(), user.id)
    .run();

  const profile = await db
    .prepare(
      `SELECT id FROM athlete_profiles WHERE user_id = ? LIMIT 1`,
    )
    .bind(user.id)
    .first<{ id: string }>();
  if (!profile) throw new Error("No fue posible crear el perfil.");

  return { db, identity, userId: user.id, profileId: profile.id };
}

export async function GET(request: Request) {
  try {
    const identity = await accessIdentityFromRequest(request);
    if (!identity) {
      return Response.json({ error: "Acceso requerido." }, { status: 401 });
    }
    const { db, userId } = await ensureProfile(identity);
    const row = await db
      .prepare(
        `SELECT
           u.display_name AS displayName,
           COALESCE(ap.birth_date, '') AS birthDate,
           ap.sex,
           ap.height_mm AS heightMm,
           ap.experience_level AS experienceLevel,
           ap.primary_goal AS primaryGoal,
           ap.onboarding_status AS onboardingStatus,
           (
             SELECT am.body_weight_grams
             FROM athlete_measurements am
             WHERE am.athlete_profile_id = ap.id
             ORDER BY am.measured_on DESC, am.created_at DESC
             LIMIT 1
           ) AS bodyWeightGrams
         FROM users u
         JOIN athlete_profiles ap ON ap.user_id = u.id
         WHERE u.id = ?
         LIMIT 1`,
      )
      .bind(userId)
      .first<{
        displayName: string;
        birthDate: string;
        sex: string;
        heightMm: number | null;
        bodyWeightGrams: number | null;
        experienceLevel: string;
        primaryGoal: string;
        onboardingStatus: string;
      }>();

    return Response.json({
      profile: row
        ? {
            displayName: row.displayName,
            accessLabel: identity.label,
            birthDate: row.birthDate,
            sex: row.sex,
            heightCm: row.heightMm === null ? null : row.heightMm / 10,
            bodyWeightKg:
              row.bodyWeightGrams === null
                ? null
                : row.bodyWeightGrams / 1000,
            experienceLevel: row.experienceLevel,
            primaryGoal: row.primaryGoal,
            onboardingStatus: row.onboardingStatus,
          }
        : null,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo consultar el perfil.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const identity = await accessIdentityFromRequest(request);
    if (!identity) {
      return Response.json({ error: "Acceso requerido." }, { status: 401 });
    }
    const payload = (await request.json()) as ProfilePayload;
    const validationError = validate(payload);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const { db, userId, profileId } = await ensureProfile(identity);
    const displayName = payload.displayName!.trim();
    const heightMm =
      payload.heightCm === null || payload.heightCm === undefined
        ? null
        : Math.round(payload.heightCm * 10);

    await db.batch([
      db
        .prepare(
          `UPDATE users
           SET display_name = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
        )
        .bind(displayName, userId),
      db
        .prepare(
          `UPDATE athlete_profiles
           SET birth_date = ?, sex = ?, height_mm = ?,
               experience_level = ?, primary_goal = ?,
               onboarding_status = 'completed',
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
        )
        .bind(
          payload.birthDate || null,
          payload.sex!,
          heightMm,
          payload.experienceLevel!,
          payload.primaryGoal!,
          profileId,
        ),
    ]);

    if (
      payload.bodyWeightKg !== null &&
      payload.bodyWeightKg !== undefined
    ) {
      const latest = await db
        .prepare(
          `SELECT body_weight_grams AS bodyWeightGrams
           FROM athlete_measurements
           WHERE athlete_profile_id = ?
           ORDER BY measured_on DESC, created_at DESC
           LIMIT 1`,
        )
        .bind(profileId)
        .first<{ bodyWeightGrams: number | null }>();
      const bodyWeightGrams = Math.round(payload.bodyWeightKg * 1000);

      if (latest?.bodyWeightGrams !== bodyWeightGrams) {
        await db
          .prepare(
            `INSERT INTO athlete_measurements
             (id, athlete_profile_id, measured_on, body_weight_grams, source)
             VALUES (?, ?, ?, ?, 'profile')`,
          )
          .bind(
            crypto.randomUUID(),
            profileId,
            new Date().toISOString().slice(0, 10),
            bodyWeightGrams,
          )
          .run();
      }
    }

    return Response.json({
      profile: {
        displayName,
        accessLabel: identity.label,
        birthDate: payload.birthDate ?? "",
        sex: payload.sex,
        heightCm: payload.heightCm ?? null,
        bodyWeightKg: payload.bodyWeightKg ?? null,
        experienceLevel: payload.experienceLevel,
        primaryGoal: payload.primaryGoal,
        onboardingStatus: "completed",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar el perfil.",
      },
      { status: 500 },
    );
  }
}

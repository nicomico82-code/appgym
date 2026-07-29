import { getD1 } from "../../../db";
import { accessIdentityFromRequest } from "../../access-session";
import { canonicalExerciseName } from "../../data/exercises";

type DraftExercise = {
  name?: string;
  sets?: Array<{
    weightKg?: string;
    reps?: string;
    rpe?: string;
    completed?: boolean;
  }>;
};

type DraftPayload = {
  templateId?: string;
  sessionId?: string | null;
  exercises?: DraftExercise[];
};

type DraftRow = {
  templateId: string;
  sessionId: string | null;
  exercisesJson: string;
  updatedAt: string;
};

function validateDraft(payload: DraftPayload) {
  if (!payload.templateId || !["A", "B", "C", "D"].includes(payload.templateId)) {
    return "La plantilla del borrador no es válida.";
  }
  if (!Array.isArray(payload.exercises) || payload.exercises.length < 1 || payload.exercises.length > 40) {
    return "El borrador debe contener entre 1 y 40 ejercicios.";
  }

  for (const exercise of payload.exercises) {
    if (!exercise.name || !canonicalExerciseName(exercise.name)) {
      return "El borrador contiene un ejercicio fuera del catálogo.";
    }
    if (!Array.isArray(exercise.sets) || exercise.sets.length < 1 || exercise.sets.length > 30) {
      return "Cada ejercicio debe contener entre 1 y 30 series.";
    }
    for (const set of exercise.sets) {
      if (
        typeof set.weightKg !== "string" ||
        typeof set.reps !== "string" ||
        typeof set.rpe !== "string" ||
        typeof set.completed !== "boolean"
      ) {
        return "El borrador contiene una serie no válida.";
      }
    }
  }

  const serialized = JSON.stringify(payload.exercises);
  if (serialized.length > 100_000) {
    return "El borrador supera el tamaño permitido.";
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const identity = await accessIdentityFromRequest(request);
    if (!identity) {
      return Response.json({ error: "Acceso requerido." }, { status: 401 });
    }

    const row = await getD1()
      .prepare(
        `SELECT
           template_id AS templateId,
           session_id AS sessionId,
           exercises_json AS exercisesJson,
           updated_at AS updatedAt
         FROM workout_drafts
         WHERE owner_key = ?
         LIMIT 1`,
      )
      .bind(identity.ownerKey)
      .first<DraftRow>();

    if (!row) {
      return Response.json(
        { draft: null },
        { headers: { "cache-control": "no-store" } },
      );
    }

    return Response.json(
      {
        draft: {
          templateId: row.templateId,
          sessionId: row.sessionId,
          exercises: JSON.parse(row.exercisesJson),
          updatedAt: row.updatedAt,
        },
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "No se pudo recuperar el borrador." },
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

    const payload = (await request.json()) as DraftPayload;
    const validationError = validateDraft(payload);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    await getD1()
      .prepare(
        `INSERT INTO workout_drafts
         (owner_key, template_id, session_id, exercises_json, updated_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(owner_key) DO UPDATE SET
           template_id = excluded.template_id,
           session_id = excluded.session_id,
           exercises_json = excluded.exercises_json,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        identity.ownerKey,
        payload.templateId,
        payload.sessionId ?? null,
        JSON.stringify(payload.exercises),
      )
      .run();

    return Response.json({ saved: true });
  } catch {
    return Response.json(
      { error: "No se pudo guardar el borrador." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const identity = await accessIdentityFromRequest(request);
    if (!identity) {
      return Response.json({ error: "Acceso requerido." }, { status: 401 });
    }

    await getD1()
      .prepare("DELETE FROM workout_drafts WHERE owner_key = ?")
      .bind(identity.ownerKey)
      .run();
    return Response.json({ deleted: true });
  } catch {
    return Response.json(
      { error: "No se pudo eliminar el borrador." },
      { status: 500 },
    );
  }
}

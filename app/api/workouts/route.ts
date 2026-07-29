import { getD1 } from "../../../db";
import { accessIdentityFromRequest } from "../../access-session";
import { canonicalExerciseName } from "../../data/exercises";

type IncomingSet = {
  setNumber?: number;
  weightKg?: number;
  reps?: number;
  rpe?: number | null;
  completed?: boolean;
};

type IncomingExercise = {
  name?: string;
  position?: number;
  notes?: string;
  sets?: IncomingSet[];
};

type IncomingWorkout = {
  sessionId?: string;
  name?: string;
  sessionDate?: string;
  exercises?: IncomingExercise[];
};

type DetailedSetRow = {
  sessionId: string;
  sessionName: string;
  performedOn: string;
  exerciseId: string;
  exerciseName: string;
  exercisePosition: number;
  notes: string;
  setNumber: number;
  loadGrams: number;
  reps: number;
  rpeX10: number | null;
  completed: number;
};

function validate(payload: IncomingWorkout) {
  if (!payload.name?.trim()) return "Falta el nombre de la sesión.";
  if (!payload.sessionDate || Number.isNaN(Date.parse(payload.sessionDate))) {
    return "La fecha de la sesión no es válida.";
  }
  if (!payload.exercises?.length || payload.exercises.length > 40) {
    return "La sesión debe contener entre 1 y 40 ejercicios.";
  }

  for (const exercise of payload.exercises) {
    if (!exercise.name?.trim()) return "Cada ejercicio necesita un nombre.";
    if (!canonicalExerciseName(exercise.name.trim())) {
      return "Selecciona únicamente ejercicios disponibles en el catálogo.";
    }
    if ((exercise.notes?.length ?? 0) > 500) {
      return "La nota del ejercicio no puede superar 500 caracteres.";
    }
    if (!exercise.sets?.length || exercise.sets.length > 30) {
      return "Cada ejercicio debe contener entre 1 y 30 series.";
    }
    for (const set of exercise.sets) {
      if (
        set.weightKg === undefined ||
        !Number.isFinite(set.weightKg) ||
        set.weightKg < 0 ||
        set.weightKg > 2000
      ) {
        return "Una carga registrada no es válida.";
      }
      if (
        set.reps === undefined ||
        !Number.isInteger(set.reps) ||
        set.reps < 0 ||
        set.reps > 1000
      ) {
        return "Una cantidad de repeticiones no es válida.";
      }
      if (
        set.rpe !== null &&
        set.rpe !== undefined &&
        (!Number.isFinite(set.rpe) || set.rpe < 1 || set.rpe > 10)
      ) {
        return "El RPE debe estar entre 1 y 10.";
      }
    }
  }
}

export async function GET(request: Request) {
  try {
    const identity = await accessIdentityFromRequest(request);
    if (!identity) {
      return Response.json({ error: "Acceso requerido." }, { status: 401 });
    }
    const db = getD1();
    const ownerKey = identity.ownerKey;
    const latestRequested = new URL(request.url).searchParams.has("latest");

    if (latestRequested) {
      const detailRows = await db
        .prepare(
          `SELECT
             ws.id AS sessionId,
             ws.name AS sessionName,
             ws.performed_on AS performedOn,
             se.id AS exerciseId,
             se.exercise_name_snapshot AS exerciseName,
             se.order_index AS exercisePosition,
             se.notes,
             wset.set_number AS setNumber,
             wset.load_grams AS loadGrams,
             wset.reps,
             wset.rpe_x10 AS rpeX10,
             wset.completed
           FROM workout_sessions ws
           JOIN users u ON u.id = ws.user_id
           JOIN session_exercises se ON se.session_id = ws.id
           JOIN workout_sets wset ON wset.session_exercise_id = se.id
           WHERE u.owner_key = ?
             AND ws.id = (
               SELECT latest.id
               FROM workout_sessions latest
               JOIN users latest_user ON latest_user.id = latest.user_id
               WHERE latest_user.owner_key = ?
               ORDER BY latest.performed_on DESC, latest.created_at DESC
               LIMIT 1
             )
           ORDER BY se.order_index, wset.set_number`,
        )
        .bind(ownerKey, ownerKey)
        .all<DetailedSetRow>();

      if (detailRows.results.length === 0) {
        return Response.json({ workout: null });
      }

      const first = detailRows.results[0];
      const grouped = new Map<
        string,
        {
          id: string;
          name: string;
          position: number;
          notes: string;
          sets: Array<{
            setNumber: number;
            weightKg: number;
            reps: number;
            rpe: number | null;
            completed: boolean;
          }>;
        }
      >();

      for (const row of detailRows.results) {
        const exercise = grouped.get(row.exerciseId) ?? {
          id: row.exerciseId,
          name: row.exerciseName,
          position: row.exercisePosition,
          notes: row.notes,
          sets: [],
        };
        exercise.sets.push({
          setNumber: row.setNumber,
          weightKg: row.loadGrams / 1000,
          reps: row.reps,
          rpe: row.rpeX10 === null ? null : row.rpeX10 / 10,
          completed: Boolean(row.completed),
        });
        grouped.set(row.exerciseId, exercise);
      }

      return Response.json({
        workout: {
          id: first.sessionId,
          name: first.sessionName,
          sessionDate: first.performedOn,
          exercises: Array.from(grouped.values()),
        },
      });
    }

    const rows = await db
      .prepare(
        `SELECT ws.id, ws.name, ws.performed_on AS performedOn, ws.status,
                COUNT(DISTINCT se.id) AS exerciseCount,
                COUNT(wset.id) AS setCount
         FROM workout_sessions ws
         JOIN users u ON u.id = ws.user_id
         LEFT JOIN session_exercises se ON se.session_id = ws.id
         LEFT JOIN workout_sets wset ON wset.session_exercise_id = se.id
         WHERE u.owner_key = ?
         GROUP BY ws.id
         ORDER BY ws.performed_on DESC
         LIMIT 20`,
      )
      .bind(ownerKey)
      .all();

    return Response.json({ workouts: rows.results });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo consultar el historial.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const identity = await accessIdentityFromRequest(request);
    if (!identity) {
      return Response.json({ error: "Acceso requerido." }, { status: 401 });
    }
    const payload = (await request.json()) as IncomingWorkout;
    const validationError = validate(payload);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const db = getD1();
    const ownerKey = identity.ownerKey;
    const provisionalUserId = crypto.randomUUID();
    await db
      .prepare(
        `INSERT OR IGNORE INTO users
         (id, owner_key, email, display_name)
         VALUES (?, ?, ?, ?)`,
      )
      .bind(provisionalUserId, ownerKey, null, identity.label)
      .run();

    const user = await db
      .prepare("SELECT id FROM users WHERE owner_key = ? LIMIT 1")
      .bind(ownerKey)
      .first<{ id: string }>();

    if (!user) {
      return Response.json(
        { error: "No fue posible identificar al usuario." },
        { status: 500 },
      );
    }

    const requestedSessionId = payload.sessionId?.trim();
    const existingSession = requestedSessionId
      ? await db
          .prepare(
            `SELECT ws.id
             FROM workout_sessions ws
             JOIN users u ON u.id = ws.user_id
             WHERE ws.id = ? AND u.owner_key = ?
             LIMIT 1`,
          )
          .bind(requestedSessionId, ownerKey)
          .first<{ id: string }>()
      : null;
    const sessionId = existingSession?.id ?? crypto.randomUUID();
    const statements = existingSession
      ? [
          db
            .prepare(
              `UPDATE workout_sessions
               SET name = ?, performed_on = ?, updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
            )
            .bind(payload.name!.trim(), payload.sessionDate!, sessionId),
          db
            .prepare("DELETE FROM session_exercises WHERE session_id = ?")
            .bind(sessionId),
        ]
      : [
          db
            .prepare(
              `INSERT INTO workout_sessions
               (id, user_id, name, performed_on, timezone, status, source)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
            )
            .bind(
              sessionId,
              user.id,
              payload.name!.trim(),
              payload.sessionDate!,
              "America/Santiago",
              "completed",
              "manual",
            ),
        ];

    for (const [exerciseIndex, exercise] of payload.exercises!.entries()) {
      const sessionExerciseId = crypto.randomUUID();
      statements.push(
        db
          .prepare(
          `INSERT INTO session_exercises
             (id, session_id, exercise_name_snapshot, order_index, data_granularity, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            sessionExerciseId,
            sessionId,
            canonicalExerciseName(exercise.name!.trim())!,
            exercise.position ?? exerciseIndex + 1,
            "per_set",
            exercise.notes?.trim() ?? "",
          ),
      );

      for (const [setIndex, set] of exercise.sets!.entries()) {
        statements.push(
          db
            .prepare(
              `INSERT INTO workout_sets
               (id, session_exercise_id, set_number, load_grams, reps, rpe_x10, completed)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
            )
            .bind(
              crypto.randomUUID(),
              sessionExerciseId,
              set.setNumber ?? setIndex + 1,
              Math.round(set.weightKg! * 1000),
              set.reps!,
              set.rpe === null || set.rpe === undefined
                ? null
                : Math.round(set.rpe * 10),
              set.completed ? 1 : 0,
            ),
        );
      }
    }

    await db.batch(statements);
    return Response.json(
      { id: sessionId, updated: Boolean(existingSession) },
      { status: existingSession ? 200 : 201 },
    );
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la sesión.",
      },
      { status: 500 },
    );
  }
}

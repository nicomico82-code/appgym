import { getD1 } from "../../../db";
import { accessIdentityFromRequest } from "../../access-session";

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
  sets?: IncomingSet[];
};

type IncomingWorkout = {
  name?: string;
  sessionDate?: string;
  exercises?: IncomingExercise[];
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

    const sessionId = crypto.randomUUID();
    const statements = [
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
             (id, session_id, exercise_name_snapshot, order_index, data_granularity)
             VALUES (?, ?, ?, ?, ?)`,
          )
          .bind(
            sessionExerciseId,
            sessionId,
            exercise.name!.trim(),
            exercise.position ?? exerciseIndex + 1,
            "per_set",
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
    return Response.json({ id: sessionId }, { status: 201 });
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

import type { Metadata } from "next";
import { requireAccess } from "../access-session";
import { AppShell } from "../components/AppShell";
import { getD1 } from "../../db";
import { DeleteSessionButton } from "./DeleteSessionButton";

export const metadata: Metadata = {
  title: "Historial",
  description: "Consulta tus sesiones guardadas.",
};

export const dynamic = "force-dynamic";

type HistoryRow = {
  sessionId: string;
  sessionName: string;
  performedOn: string;
  durationSeconds: number | null;
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

function formatDuration(seconds: number | null) {
  if (!seconds) return "Sin duración registrada";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Santiago",
    hour12: false,
  }).format(new Date(value));
}

export default async function HistoryPage() {
  const identity = await requireAccess();
  const rows = await getD1()
    .prepare(
      `SELECT
         ws.id AS sessionId,
         ws.name AS sessionName,
         ws.performed_on AS performedOn,
         ws.duration_seconds AS durationSeconds,
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
       ORDER BY ws.performed_on DESC, ws.created_at DESC,
                se.order_index, wset.set_number
       LIMIT 2000`,
    )
    .bind(identity.ownerKey)
    .all<HistoryRow>();

  const sessions = new Map<
    string,
    {
      id: string;
      name: string;
      performedOn: string;
      durationSeconds: number | null;
      exercises: Map<string, {
        id: string;
        name: string;
        position: number;
        notes: string;
        sets: HistoryRow[];
      }>;
    }
  >();

  for (const row of rows.results) {
    const session = sessions.get(row.sessionId) ?? {
      id: row.sessionId,
      name: row.sessionName,
      performedOn: row.performedOn,
      durationSeconds: row.durationSeconds,
      exercises: new Map(),
    };
    const exercise = session.exercises.get(row.exerciseId) ?? {
      id: row.exerciseId,
      name: row.exerciseName,
      position: row.exercisePosition,
      notes: row.notes,
      sets: [],
    };
    exercise.sets.push(row);
    session.exercises.set(row.exerciseId, exercise);
    sessions.set(row.sessionId, session);
  }

  const history = Array.from(sessions.values()).slice(0, 50);

  return (
    <AppShell current="historial">
      <header className="section-header">
        <div>
          <p className="eyebrow">SESIONES GUARDADAS</p>
          <h1>Tu historial de entrenamiento.</h1>
          <p>
            Estos registros son de solo lectura. Puedes consultarlos o
            eliminarlos definitivamente.
          </p>
        </div>
      </header>

      {history.length === 0 ? (
        <section className="progress-empty surface-card">
          <span>01</span>
          <h2>Todavía no tienes sesiones guardadas.</h2>
          <p>Cuando guardes un entrenamiento aparecerá en este historial.</p>
        </section>
      ) : (
        <div className="history-list">
          {history.map((session) => (
            <article className="history-session surface-card" key={session.id}>
              <header>
                <div>
                  <p className="eyebrow">{formatDate(session.performedOn)}</p>
                  <h2>{session.name}</h2>
                  <span>{formatDuration(session.durationSeconds)}</span>
                </div>
                <DeleteSessionButton
                  sessionId={session.id}
                  sessionName={session.name}
                />
              </header>

              <div className="history-exercises">
                {Array.from(session.exercises.values()).map((exercise) => (
                  <section key={exercise.id}>
                    <h3>
                      {String(exercise.position).padStart(2, "0")} ·{" "}
                      {exercise.name}
                    </h3>
                    {exercise.notes && <p>{exercise.notes}</p>}
                    <div className="history-sets">
                      {exercise.sets.map((set) => (
                        <div key={set.setNumber}>
                          <strong>Serie {set.setNumber}</strong>
                          <span>{set.loadGrams / 1000} kg</span>
                          <span>{set.reps} reps</span>
                          <span>
                            {set.rpeX10 === null
                              ? "RPE —"
                              : `RPE ${set.rpeX10 / 10}`}
                          </span>
                          <b>{set.completed ? "Finalizada" : "Pendiente"}</b>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </AppShell>
  );
}

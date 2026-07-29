import Link from "next/link";
import { getD1 } from "../db";
import { requireAccess } from "./access-session";
import { AppShell } from "./components/AppShell";
import { MetricCard } from "./components/MetricCard";
import {
  experienceLabel,
  getCurrentProfile,
  profileInitials,
} from "./lib/current-profile";
import {
  estimateOneRepMax,
  recommendLoad,
  type Performance,
} from "./lib/training";

type DashboardRow = {
  sessionId: string;
  sessionName: string;
  performedOn: string;
  durationSeconds: number | null;
  exerciseName: string;
  setNumber: number;
  loadGrams: number;
  reps: number;
  rpeX10: number | null;
  completed: number;
};

function formatKg(value: number) {
  return new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: 1,
  }).format(value);
}

function sessionPerformances(rows: DashboardRow[]) {
  const byExercise = new Map<string, Map<string, DashboardRow[]>>();

  for (const row of rows.filter((candidate) => candidate.completed)) {
    const exerciseSessions =
      byExercise.get(row.exerciseName) ?? new Map<string, DashboardRow[]>();
    const sessionRows = exerciseSessions.get(row.sessionId) ?? [];
    sessionRows.push(row);
    exerciseSessions.set(row.sessionId, sessionRows);
    byExercise.set(row.exerciseName, exerciseSessions);
  }

  return Array.from(byExercise, ([name, sessions]) => {
    const performances = Array.from(sessions.values())
      .map((sets): Performance & { date: string } => {
        const best = sets.reduce((current, candidate) =>
          estimateOneRepMax(candidate.loadGrams / 1000, candidate.reps) >
          estimateOneRepMax(current.loadGrams / 1000, current.reps)
            ? candidate
            : current,
        );
        return {
          date: best.performedOn,
          weightKg: best.loadGrams / 1000,
          completedReps: best.reps,
          targetReps: 8,
          rpe: best.rpeX10 === null ? undefined : best.rpeX10 / 10,
        };
      })
      .sort((left, right) => Date.parse(left.date) - Date.parse(right.date));
    return {
      name,
      performances,
      recommendation: recommendLoad(performances, 2.5),
    };
  }).sort(
    (left, right) =>
      Date.parse(right.performances.at(-1)!.date) -
      Date.parse(left.performances.at(-1)!.date),
  );
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const [profile, identity] = await Promise.all([
    getCurrentProfile(),
    requireAccess(),
  ]);
  const result = await getD1()
    .prepare(
      `SELECT
         ws.id AS sessionId,
         ws.name AS sessionName,
         ws.performed_on AS performedOn,
         ws.duration_seconds AS durationSeconds,
         se.exercise_name_snapshot AS exerciseName,
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
       ORDER BY ws.performed_on DESC, se.order_index, wset.set_number`,
    )
    .bind(identity.ownerKey)
    .all<DashboardRow>();

  const rows = result.results;
  const completedRows = rows.filter((row) => row.completed);
  const sessionIds = new Set(rows.map((row) => row.sessionId));
  const nowDate = new Date();
  const now = nowDate.getTime();
  const day = 24 * 60 * 60 * 1000;
  const sessionsThisWeek = new Set(
    rows
      .filter((row) => now - Date.parse(row.performedOn) < 7 * day)
      .map((row) => row.sessionId),
  ).size;
  const volumeInWindow = (minimumDays: number, maximumDays: number) =>
    completedRows
      .filter((row) => {
        const age = (now - Date.parse(row.performedOn)) / day;
        return age >= minimumDays && age < maximumDays;
      })
      .reduce((sum, row) => sum + (row.loadGrams / 1000) * row.reps, 0);
  const currentVolume = volumeInWindow(0, 28);
  const previousVolume = volumeInWindow(28, 56);
  const volumeTrend =
    previousVolume > 0
      ? Math.round(((currentVolume - previousVolume) / previousVolume) * 100)
      : null;
  const recommendations = sessionPerformances(rows);
  const bestSet = completedRows.reduce<DashboardRow | null>(
    (best, candidate) =>
      !best ||
      estimateOneRepMax(candidate.loadGrams / 1000, candidate.reps) >
        estimateOneRepMax(best.loadGrams / 1000, best.reps)
        ? candidate
        : best,
    null,
  );
  const bestOneRm = bestSet
    ? estimateOneRepMax(bestSet.loadGrams / 1000, bestSet.reps)
    : null;
  const firstName = profile.displayName.trim().split(/\s+/)[0] || "Socio";
  const currentDate = new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Santiago",
  })
    .format(nowDate)
    .toLocaleUpperCase("es-CL");

  const weeklyVolumes = Array.from({ length: 7 }, (_, index) => {
    const oldestWeek = 6 - index;
    return volumeInWindow(oldestWeek * 7, oldestWeek * 7 + 7);
  });
  const maxWeeklyVolume = Math.max(...weeklyVolumes, 1);
  const latestSessionId = rows[0]?.sessionId;
  const latestRows = latestSessionId
    ? rows.filter((row) => row.sessionId === latestSessionId)
    : [];
  const latestExerciseCount = new Set(
    latestRows.map((row) => row.exerciseName),
  ).size;
  const latestDuration = latestRows[0]?.durationSeconds;
  const estimatedMinutes =
    latestDuration && latestDuration > 0
      ? Math.max(1, Math.round(latestDuration / 60))
      : Math.max(
          10,
          Math.ceil((latestRows.length * 2.25 + latestExerciseCount * 2) / 5) *
            5,
        );

  return (
    <AppShell current="inicio">
      <div className="page-heading">
        <div>
          <p className="brand-promise">
            MAX LEVEL · PARA ALCANZAR TU MÁXIMO NIVEL
          </p>
          <p className="eyebrow">{currentDate}</p>
          <h1>Buen día, {firstName}.</h1>
          <p className="page-subtitle">
            {sessionIds.size === 0
              ? "Registra tu primera sesión para comenzar a construir tu progreso."
              : "Tus indicadores se calculan desde tus sesiones guardadas."}
          </p>
        </div>
        <Link
          className="profile-chip"
          href="/perfil"
          aria-label={`Editar perfil de ${profile.displayName}`}
        >
          <span className="avatar">{profileInitials(profile.displayName)}</span>
          <span>
            <strong>{profile.displayName}</strong>
            <small>
              Plan {experienceLabel(profile.experienceLevel).toLowerCase()}
            </small>
          </span>
        </Link>
      </div>

      {sessionIds.size === 0 ? (
        <section className="home-empty surface-card">
          <span className="status-pill">
            <i />
            SIN DATOS INVENTADOS
          </span>
          <h2>Tu progreso comienza con el primer entrenamiento.</h2>
          <p>
            Todavía no tienes sesiones guardadas. Cuando completes una, aquí
            aparecerán únicamente tu volumen, marcas y recomendaciones reales.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/entrenar">
              Registrar primera sesión <span aria-hidden="true">→</span>
            </Link>
            <Link className="button button-quiet" href="/historial">
              Ver historial
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="hero-session">
            <div className="hero-copy">
              <span className="status-pill">
                <i />
                ÚLTIMA SESIÓN GUARDADA
              </span>
              <p className="hero-kicker">{latestRows[0]?.sessionName}</p>
              <h2>Convierte tus registros en progreso.</h2>
              <p>
                {recommendations.length} ejercicio
                {recommendations.length === 1 ? "" : "s"} con evidencia
                disponible para orientar tu próxima sesión.
              </p>
              <div className="hero-actions">
                <Link className="button button-primary" href="/entrenar">
                  Iniciar entrenamiento <span aria-hidden="true">→</span>
                </Link>
                <Link className="button button-quiet" href="/progreso">
                  Ver recomendación
                </Link>
              </div>
            </div>
            <div className="hero-progress" aria-label="Resumen de la sesión">
              <div className="progress-orbit">
                <div>
                  <strong>{estimatedMinutes}</strong>
                  <span>min</span>
                </div>
              </div>
              <dl className="session-facts">
                <div>
                  <dt>Ejercicios</dt>
                  <dd>{latestExerciseCount}</dd>
                </div>
                <div>
                  <dt>Series</dt>
                  <dd>{latestRows.length}</dd>
                </div>
                <div>
                  <dt>Finalizadas</dt>
                  <dd>{latestRows.filter((row) => row.completed).length}</dd>
                </div>
              </dl>
            </div>
          </section>

          <section className="metrics-grid" aria-label="Métricas de progreso">
            <MetricCard
              label="Volumen · 4 semanas"
              value={`${formatKg(currentVolume)} kg`}
              detail={
                volumeTrend === null
                  ? "Primer período registrado"
                  : `${volumeTrend >= 0 ? "+" : ""}${volumeTrend}% vs. período anterior`
              }
              tone={volumeTrend !== null && volumeTrend > 0 ? "positive" : undefined}
            />
            <MetricCard
              label="Sesiones completadas"
              value={String(sessionIds.size)}
              detail={`${sessionsThisWeek} esta semana`}
            />
            <MetricCard
              label={
                bestSet
                  ? `1RM estimado · ${bestSet.exerciseName}`
                  : "1RM estimado"
              }
              value={bestOneRm === null ? "—" : `${formatKg(bestOneRm)} kg`}
              detail="Mejor serie registrada"
            />
          </section>

          <div className="dashboard-grid">
            <section className="panel plan-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">PRÓXIMA SESIÓN</p>
                  <h2>Cargas sugeridas</h2>
                </div>
                <Link className="text-link" href="/progreso">
                  Ver evidencia <span aria-hidden="true">↗</span>
                </Link>
              </div>

              <div className="exercise-list">
                {recommendations.slice(0, 3).map((exercise, index) => {
                  const latest = exercise.performances.at(-1)!;
                  const suggested =
                    exercise.recommendation.suggestedWeightKg ??
                    latest.weightKg;
                  const tag = {
                    increase: "Subir 2,5 kg",
                    hold: "Mantener",
                    recover: "Recuperar",
                    insufficient: "Reunir evidencia",
                  }[exercise.recommendation.action];
                  return (
                    <article className="exercise-row" key={exercise.name}>
                      <span className="exercise-index">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="exercise-name">
                        <strong>{exercise.name}</strong>
                        <span>
                          {exercise.performances.length} sesión
                          {exercise.performances.length === 1 ? "" : "es"}
                        </span>
                      </div>
                      <strong className="exercise-load">
                        {formatKg(suggested)} kg
                      </strong>
                      <span
                        className={`load-tag ${
                          exercise.recommendation.action === "increase"
                            ? "raise"
                            : "hold"
                        }`}
                      >
                        {tag}
                      </span>
                    </article>
                  );
                })}
              </div>
              <div className="explanation-note">
                <span className="note-mark">i</span>
                <p>
                  Las cargas utilizan exclusivamente sesiones guardadas, series
                  finalizadas, repeticiones y RPE disponible.
                </p>
              </div>
            </section>

            <section className="panel trend-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">CONSISTENCIA</p>
                  <h2>Últimas 7 semanas</h2>
                </div>
              </div>
              <div className="bar-chart" aria-label="Volumen semanal real">
                {weeklyVolumes.map((volume, index) => (
                  <div className="bar-column" key={index}>
                    <span
                      className="bar"
                      style={{
                        height: `${Math.max((volume / maxWeeklyVolume) * 100, volume > 0 ? 5 : 0)}%`,
                      }}
                    />
                    <small>S{index + 1}</small>
                  </div>
                ))}
              </div>
              <div className="trend-footer">
                <span>Volumen · 7 semanas</span>
                <strong>
                  {formatKg(weeklyVolumes.reduce((sum, value) => sum + value, 0))}{" "}
                  kg
                </strong>
              </div>
            </section>
          </div>

          {recommendations[0] && (
            <section className="insight-strip">
              <div className="insight-symbol" aria-hidden="true">
                ↗
              </div>
              <div>
                <p className="eyebrow">RECOMENDACIÓN PRINCIPAL</p>
                <h2>{recommendations[0].name}</h2>
                <p>{recommendations[0].recommendation.reason}</p>
              </div>
              <Link className="button button-dark" href="/progreso">
                Ver por qué
              </Link>
            </section>
          )}
        </>
      )}
    </AppShell>
  );
}

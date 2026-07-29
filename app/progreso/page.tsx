import type { Metadata } from "next";
import Link from "next/link";
import { requireAccess } from "../access-session";
import { AppShell } from "../components/AppShell";
import { estimateOneRepMax, recommendLoad } from "../lib/training";
import { getD1 } from "../../db";
import { ExerciseProgressSelector } from "./ExerciseProgressSelector";

export const metadata: Metadata = {
  title: "Progreso",
  description: "Revisa tendencias y recomendaciones explicables.",
};

export const dynamic = "force-dynamic";

type SetRow = {
  sessionId: string;
  performedOn: string;
  exerciseName: string;
  loadGrams: number;
  reps: number;
  rpeX10: number | null;
};

type SearchParams = Promise<{
  weeks?: string;
  exercise?: string;
}>;

function validWeeks(value: string | undefined) {
  const parsed = Number(value);
  return parsed === 8 || parsed === 12 ? parsed : 4;
}

function formatKg(value: number) {
  return new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
  })
    .format(new Date(value))
    .replace(".", "");
}

function periodHref(weeks: number, exercise?: string) {
  const params = new URLSearchParams({ weeks: String(weeks) });
  if (exercise) params.set("exercise", exercise);
  return `/progreso?${params.toString()}`;
}

export default async function ProgressPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const identity = await requireAccess();
  const params = await searchParams;
  const weeks = validWeeks(params.weeks);
  const cutoffModifier = `-${weeks * 7} days`;

  const result = await getD1()
    .prepare(
      `SELECT
         ws.id AS sessionId,
         ws.performed_on AS performedOn,
         se.exercise_name_snapshot AS exerciseName,
         wset.load_grams AS loadGrams,
         wset.reps,
         wset.rpe_x10 AS rpeX10
       FROM workout_sessions ws
       JOIN users u ON u.id = ws.user_id
       JOIN session_exercises se ON se.session_id = ws.id
       JOIN workout_sets wset ON wset.session_exercise_id = se.id
       WHERE u.owner_key = ?
         AND julianday(ws.performed_on) >= julianday('now', ?)
         AND wset.completed = 1
       ORDER BY ws.performed_on DESC, se.order_index, wset.set_number`,
    )
    .bind(identity.ownerKey, cutoffModifier)
    .all<SetRow>();

  const rows = result.results;
  const exerciseNames = Array.from(
    new Set(rows.map((row) => row.exerciseName)),
  );
  const selectedExercise =
    params.exercise && exerciseNames.includes(params.exercise)
      ? params.exercise
      : exerciseNames[0];

  if (!selectedExercise) {
    return (
      <AppShell current="progreso">
        <header className="section-header">
          <div>
            <p className="eyebrow">ÚLTIMAS {weeks} SEMANAS</p>
            <h1>Tu progreso comienza con una serie.</h1>
            <p>
              Aquí aparecerán tus cargas, esfuerzo y recomendaciones cuando
              guardes tu primer entrenamiento.
            </p>
          </div>
          <div className="period-switch" aria-label="Período del informe">
            {[4, 8, 12].map((period) => (
              <Link
                className={period === weeks ? "active" : ""}
                href={periodHref(period)}
                key={period}
              >
                {period} sem
              </Link>
            ))}
          </div>
        </header>
        <section className="progress-empty surface-card">
          <span>01</span>
          <h2>Todavía no hay series completadas en este período.</h2>
          <p>
            Registra una sesión, marca sus series como listas y guárdala. El
            informe se calculará automáticamente para este perfil.
          </p>
          <Link className="button button-primary" href="/entrenar">
            Registrar entrenamiento
          </Link>
        </section>
      </AppShell>
    );
  }

  const selectedRows = rows.filter(
    (row) => row.exerciseName === selectedExercise,
  );
  const sessions = new Map<string, SetRow[]>();
  for (const row of selectedRows) {
    const current = sessions.get(row.sessionId) ?? [];
    current.push(row);
    sessions.set(row.sessionId, current);
  }

  const performances = Array.from(sessions.values())
    .map((sessionRows) => {
      const best = sessionRows.reduce((currentBest, row) => {
        const currentOneRm = estimateOneRepMax(
          currentBest.loadGrams / 1000,
          currentBest.reps,
        );
        const candidateOneRm = estimateOneRepMax(
          row.loadGrams / 1000,
          row.reps,
        );
        return candidateOneRm > currentOneRm ? row : currentBest;
      });
      return {
        date: best.performedOn,
        weightKg: best.loadGrams / 1000,
        completedReps: best.reps,
        targetReps: 8,
        rpe: best.rpeX10 === null ? undefined : best.rpeX10 / 10,
      };
    })
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  const recommendation = recommendLoad(performances, 2.5);
  const latest = performances.at(-1)!;
  const suggestedWeight =
    recommendation.suggestedWeightKg ?? latest.weightKg;
  const recentWithRpe = performances
    .filter((entry) => entry.rpe !== undefined)
    .slice(-3);
  const averageRpe =
    recentWithRpe.length > 0
      ? recentWithRpe.reduce((sum, entry) => sum + entry.rpe!, 0) /
        recentWithRpe.length
      : null;
  const estimatedOneRm = estimateOneRepMax(
    latest.weightKg,
    latest.completedReps,
  );
  const history = performances.slice(-8);
  const chartMax = Math.max(...history.map((entry) => entry.weightKg), 1);
  const status = {
    increase: "LISTO PARA PROGRESAR",
    hold: "CONSOLIDAR LA CARGA",
    recover: "PRIORIZAR RECUPERACIÓN",
    insufficient: "REUNIENDO EVIDENCIA",
  }[recommendation.action];

  const volumeByExercise = new Map<string, number>();
  for (const row of rows) {
    volumeByExercise.set(
      row.exerciseName,
      (volumeByExercise.get(row.exerciseName) ?? 0) + 1,
    );
  }
  const volumeRows = Array.from(volumeByExercise, ([name, count]) => ({
    name,
    count,
  }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const maxVolume = Math.max(...volumeRows.map((row) => row.count), 1);

  return (
    <AppShell current="progreso">
      <header className="section-header">
        <div>
          <p className="eyebrow">ÚLTIMAS {weeks} SEMANAS</p>
          <h1>Tu progreso, con evidencia.</h1>
          <p>
            Todas las cifras de esta pantalla provienen de las series guardadas
            en tu perfil.
          </p>
        </div>
        <div className="period-switch" aria-label="Período del informe">
          {[4, 8, 12].map((period) => (
            <Link
              className={period === weeks ? "active" : ""}
              href={periodHref(period, selectedExercise)}
              key={period}
            >
              {period} sem
            </Link>
          ))}
        </div>
      </header>

      <section className="progress-hero">
        <div>
          <span className="status-pill">
            <i />
            {status}
          </span>
          <h2>{selectedExercise}</h2>
          <p className="load-proposal">
            {formatKg(suggestedWeight)} <small>kg</small>
          </p>
          <p className="prescription">
            Referencia para la próxima sesión · rango objetivo 8–10 reps
          </p>
        </div>
        <div className="reason-card">
          <p className="eyebrow">POR QUÉ</p>
          <p>{recommendation.reason}</p>
          <dl>
            <div>
              <dt>Última carga</dt>
              <dd>{formatKg(latest.weightKg)} kg</dd>
            </div>
            <div>
              <dt>RPE promedio</dt>
              <dd>
                {averageRpe === null ? "Sin datos" : formatKg(averageRpe)}
              </dd>
            </div>
            <div>
              <dt>1RM estimado</dt>
              <dd>{formatKg(estimatedOneRm)} kg</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="secondary-grid progress-grid">
        <section className="surface-card chart-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">MEJOR SERIE POR SESIÓN</p>
              <h2>Evolución de carga</h2>
            </div>
            <ExerciseProgressSelector
              exercises={exerciseNames}
              selected={selectedExercise}
              weeks={weeks}
            />
          </div>
          <div
            className="load-chart"
            aria-label={`Carga de ${selectedExercise} por fecha`}
          >
            {history.map((entry) => (
              <div className="load-column" key={`${entry.date}-${entry.weightKg}`}>
                <div className="load-label">
                  <strong>{formatKg(entry.weightKg)}</strong>
                  <small>kg</small>
                </div>
                <span
                  style={{
                    height: `${Math.max((entry.weightKg / chartMax) * 100, 5)}%`,
                  }}
                />
                <p>{formatDate(entry.date)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card rpe-card">
          <p className="eyebrow">ESFUERZO PERCIBIDO</p>
          <h2>RPE reciente</h2>
          <div className="rpe-number">
            {averageRpe === null ? "—" : formatKg(averageRpe)}
          </div>
          <p>
            {averageRpe === null
              ? "Agrega el RPE a tus series para interpretar el esfuerzo."
              : `Promedio de las últimas ${recentWithRpe.length} sesiones con RPE.`}
          </p>
          <div className="rpe-scale">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <span
                className={
                  averageRpe !== null && value === Math.round(averageRpe)
                    ? "active"
                    : ""
                }
                key={value}
              >
                {value}
              </span>
            ))}
          </div>
        </section>
      </div>

      <section className="volume-section surface-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">TRABAJO REGISTRADO</p>
            <h2>Series completadas por ejercicio</h2>
          </div>
          <span className="neutral-tag">{weeks} semanas</span>
        </div>
        <div className="volume-rows">
          {volumeRows.map((row) => (
            <div className="volume-row" key={row.name}>
              <strong>{row.name}</strong>
              <div className="volume-track">
                <span style={{ width: `${(row.count / maxVolume) * 100}%` }} />
              </div>
              <b>{row.count}</b>
              <small>series</small>
            </div>
          ))}
        </div>
        <p className="method-note">
          Solo se contabilizan las series marcadas como listas en sesiones
          guardadas. El informe pertenece exclusivamente a este enlace personal.
        </p>
      </section>
    </AppShell>
  );
}

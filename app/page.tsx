import Link from "next/link";
import { AppShell } from "./components/AppShell";
import { MetricCard } from "./components/MetricCard";
import { estimateOneRepMax } from "./lib/training";

const weeklyBars = [38, 52, 46, 64, 58, 78, 86];

const nextExercises = [
  {
    name: "Press banca",
    prescription: "3 × 8–10",
    load: "32,5 kg",
    tag: "Subir 2,5 kg",
    tone: "raise",
  },
  {
    name: "Remo con barra",
    prescription: "3 × 10–12",
    load: "27,5 kg",
    tag: "Mantener",
    tone: "hold",
  },
  {
    name: "Press militar",
    prescription: "3 × 8–10",
    load: "17,5 kg",
    tag: "Subir 2,5 kg",
    tone: "raise",
  },
];

export default function Home() {
  const estimatedOneRepMax = estimateOneRepMax(30, 10);

  return (
    <AppShell current="inicio">
      <div className="page-heading">
        <div>
          <p className="eyebrow">MIÉRCOLES, 29 DE JULIO</p>
          <h1>Buen día, Pedro.</h1>
          <p className="page-subtitle">
            Tu próxima sesión está lista. Hoy toca avanzar con control.
          </p>
        </div>
        <div className="profile-chip" aria-label="Perfil de Pedro">
          <span className="avatar">PR</span>
          <span>
            <strong>Pedro R.</strong>
            <small>Plan principiante</small>
          </span>
        </div>
      </div>

      <section className="hero-session">
        <div className="hero-copy">
          <span className="status-pill">
            <i />
            SESIÓN RECOMENDADA
          </span>
          <p className="hero-kicker">DÍA A · EMPUJE</p>
          <h2>Convierte el progreso en una rutina.</h2>
          <p>
            Tres ajustes de carga preparados según tus últimas sesiones y tu
            esfuerzo percibido.
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
              <strong>42</strong>
              <span>min</span>
            </div>
          </div>
          <dl className="session-facts">
            <div>
              <dt>Ejercicios</dt>
              <dd>4</dd>
            </div>
            <div>
              <dt>Series</dt>
              <dd>12</dd>
            </div>
            <div>
              <dt>RPE meta</dt>
              <dd>7–8</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="metrics-grid" aria-label="Métricas de progreso">
        <MetricCard
          label="Volumen · 4 semanas"
          value="+7,8%"
          detail="Tendencia positiva"
          tone="positive"
        />
        <MetricCard
          label="Sesiones completadas"
          value="7"
          detail="2 esta semana"
        />
        <MetricCard
          label="1RM estimado · banca"
          value={`${estimatedOneRepMax} kg`}
          detail="Mejor marca actual"
        />
      </section>

      <div className="dashboard-grid">
        <section className="panel plan-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">PRÓXIMA SESIÓN</p>
              <h2>Cargas sugeridas</h2>
            </div>
            <Link className="text-link" href="/entrenar">
              Ver rutina <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="exercise-list">
            {nextExercises.map((exercise, index) => (
              <article className="exercise-row" key={exercise.name}>
                <span className="exercise-index">0{index + 1}</span>
                <div className="exercise-name">
                  <strong>{exercise.name}</strong>
                  <span>{exercise.prescription}</span>
                </div>
                <strong className="exercise-load">{exercise.load}</strong>
                <span className={`load-tag ${exercise.tone}`}>
                  {exercise.tag}
                </span>
              </article>
            ))}
          </div>
          <div className="explanation-note">
            <span className="note-mark">i</span>
            <p>
              Las cargas se calculan con sesiones completadas, repeticiones y
              RPE. Si hoy cambia tu técnica o aparece dolor, no aumentes.
            </p>
          </div>
        </section>

        <section className="panel trend-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">CONSISTENCIA</p>
              <h2>Últimas 7 semanas</h2>
            </div>
            <span className="trend-value">+18%</span>
          </div>
          <div className="bar-chart" aria-label="Volumen semanal ascendente">
            {weeklyBars.map((height, index) => (
              <div className="bar-column" key={index}>
                <span className="bar" style={{ height: `${height}%` }} />
                <small>S{index + 1}</small>
              </div>
            ))}
          </div>
          <div className="trend-footer">
            <span>Volumen acumulado</span>
            <strong>8.420 kg</strong>
          </div>
        </section>
      </div>

      <section className="insight-strip">
        <div className="insight-symbol" aria-hidden="true">
          ↗
        </div>
        <div>
          <p className="eyebrow">SEÑAL DE PROGRESO</p>
          <h2>Press banca ya se siente más fácil.</h2>
          <p>
            Completaste tres sesiones en 30 kg y tu RPE bajó de 6 a 5. La
            próxima carga sugerida es 32,5 kg, manteniendo 8–10 repeticiones.
          </p>
        </div>
        <Link className="button button-dark" href="/progreso">
          Ver por qué
        </Link>
      </section>
    </AppShell>
  );
}

import type { Metadata } from "next";
import { AppShell } from "../components/AppShell";
import { estimateOneRepMax, recommendLoad } from "../lib/training";

export const metadata: Metadata = {
  title: "Progreso",
  description: "Revisa tendencias y recomendaciones explicables.",
};

const performances = [
  { weightKg: 30, completedReps: 10, targetReps: 10, rpe: 6 },
  { weightKg: 30, completedReps: 10, targetReps: 10, rpe: 5 },
  { weightKg: 30, completedReps: 10, targetReps: 10, rpe: 5 },
];

export default function ProgressPage() {
  const recommendation = recommendLoad(performances, 2.5);
  const history = [
    { date: "05 jul", weight: 25, rpe: 7 },
    { date: "12 jul", weight: 27.5, rpe: 6 },
    { date: "19 jul", weight: 30, rpe: 6 },
    { date: "26 jul", weight: 30, rpe: 5 },
  ];

  return (
    <AppShell current="progreso">
      <header className="section-header">
        <div>
          <p className="eyebrow">ÚLTIMAS 4 SEMANAS</p>
          <h1>Tu progreso, con evidencia.</h1>
          <p>
            Las recomendaciones muestran los datos y la regla utilizada. Nunca
            cambian una carga sin explicarte el motivo.
          </p>
        </div>
        <div className="period-switch" aria-label="Período del informe">
          <button className="active" type="button">
            4 sem
          </button>
          <button type="button">8 sem</button>
          <button type="button">12 sem</button>
        </div>
      </header>

      <section className="progress-hero">
        <div>
          <span className="status-pill">
            <i />
            LISTO PARA PROGRESAR
          </span>
          <h2>Press banca</h2>
          <p className="load-proposal">
            32,5 <small>kg</small>
          </p>
          <p className="prescription">3 series · 8–10 repeticiones · RPE 7–8</p>
        </div>
        <div className="reason-card">
          <p className="eyebrow">POR QUÉ</p>
          <p>{recommendation.reason}</p>
          <dl>
            <div>
              <dt>Última carga</dt>
              <dd>30 kg</dd>
            </div>
            <div>
              <dt>RPE promedio</dt>
              <dd>5,3</dd>
            </div>
            <div>
              <dt>1RM estimado</dt>
              <dd>{estimateOneRepMax(30, 10)} kg</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="secondary-grid progress-grid">
        <section className="surface-card chart-card">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">MEJOR SERIE</p>
              <h2>Evolución de carga</h2>
            </div>
            <select aria-label="Seleccionar ejercicio" defaultValue="press">
              <option value="press">Press banca</option>
              <option value="remo">Remo con barra</option>
              <option value="militar">Press militar</option>
            </select>
          </div>
          <div className="load-chart" aria-label="Carga de press banca por fecha">
            {history.map((entry) => (
              <div className="load-column" key={entry.date}>
                <div className="load-label">
                  <strong>{entry.weight}</strong>
                  <small>kg</small>
                </div>
                <span style={{ height: `${(entry.weight / 32.5) * 100}%` }} />
                <p>{entry.date}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card rpe-card">
          <p className="eyebrow">ESFUERZO PERCIBIDO</p>
          <h2>RPE en descenso</h2>
          <div className="rpe-number">5,3</div>
          <p>
            Promedio de las últimas tres sesiones. La carga se siente más
            controlada.
          </p>
          <div className="rpe-scale">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
              <span className={value === 5 ? "active" : ""} key={value}>
                {value}
              </span>
            ))}
          </div>
        </section>
      </div>

      <section className="volume-section surface-card">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">VOLUMEN DIRECTO</p>
            <h2>Series por grupo muscular</h2>
          </div>
          <span className="neutral-tag">Semana actual</span>
        </div>
        <div className="volume-rows">
          {[
            { group: "Pecho", current: 9, goal: "10–12", width: 75 },
            { group: "Espalda", current: 12, goal: "10–12", width: 100 },
            { group: "Hombros", current: 7, goal: "10–12", width: 58 },
            { group: "Piernas", current: 10, goal: "10–12", width: 83 },
          ].map((row) => (
            <div className="volume-row" key={row.group}>
              <strong>{row.group}</strong>
              <div className="volume-track">
                <span style={{ width: `${row.width}%` }} />
              </div>
              <b>{row.current}</b>
              <small>meta {row.goal}</small>
            </div>
          ))}
        </div>
        <p className="method-note">
          En esta primera versión se contabiliza el músculo principal de cada
          ejercicio. Las series indirectas no se suman.
        </p>
      </section>
    </AppShell>
  );
}

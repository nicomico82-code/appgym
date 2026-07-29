import type { Metadata } from "next";
import { AppShell } from "../components/AppShell";
import { WorkoutSessionBuilder } from "./WorkoutSessionBuilder";

export const metadata: Metadata = {
  title: "Entrenar",
  description: "Registra cada serie de tu entrenamiento con rapidez.",
};

export default function TrainPage() {
  return (
    <AppShell current="entrenar">
      <header className="section-header">
        <div>
          <p className="eyebrow">SESIÓN DE HOY</p>
          <h1>Registra. Ajusta. Continúa.</h1>
          <p>
            Precargamos tu objetivo para que solo confirmes cada serie. El RPE
            es opcional y puedes cambiar cualquier valor.
          </p>
        </div>
      </header>
      <WorkoutSessionBuilder />
    </AppShell>
  );
}

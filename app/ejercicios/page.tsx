import type { Metadata } from "next";
import { AppShell } from "../components/AppShell";
import { ExerciseCatalog } from "./ExerciseCatalog";

export const metadata: Metadata = {
  title: "Ejercicios",
  description: "Busca ejercicios y alternativas disponibles.",
};

export default function ExercisesPage() {
  return (
    <AppShell current="ejercicios">
      <header className="section-header">
        <div>
          <p className="eyebrow">CATÁLOGO DEL GIMNASIO</p>
          <h1>Encuentra tu siguiente movimiento.</h1>
          <p>
            Busca por nombre, sinónimo, grupo muscular o equipamiento. Las
            alternativas conservan el patrón de movimiento.
          </p>
        </div>
      </header>
      <ExerciseCatalog />
    </AppShell>
  );
}

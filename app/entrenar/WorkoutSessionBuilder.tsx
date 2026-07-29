"use client";

import { useMemo, useState } from "react";
import { exerciseOptions } from "../data/exercises";

type WorkoutSet = {
  id: string;
  weightKg: string;
  reps: string;
  rpe: string;
  completed: boolean;
};

type ExerciseDraft = {
  id: string;
  name: string;
  lastPerformance: string;
  target: string;
  sets: WorkoutSet[];
};

const initialExercises: ExerciseDraft[] = [
  {
    id: "press-banca",
    name: "Press banca con barra",
    lastPerformance: "Última vez: 30 kg × 10 · RPE 5",
    target: "Objetivo: 32,5 kg × 8–10",
    sets: [1, 2, 3].map((index) => ({
      id: `press-${index}`,
      weightKg: "32.5",
      reps: index === 1 ? "9" : index === 2 ? "8" : "",
      rpe: index === 1 ? "7" : index === 2 ? "8" : "",
      completed: index < 3,
    })),
  },
  {
    id: "press-militar",
    name: "Press militar con barra",
    lastPerformance: "Última vez: 15 kg × 10 · RPE 4",
    target: "Objetivo: 17,5 kg × 8–10",
    sets: [1, 2, 3].map((index) => ({
      id: `militar-${index}`,
      weightKg: "17.5",
      reps: "",
      rpe: "",
      completed: false,
    })),
  },
];

function newSet(exerciseId: string, position: number): WorkoutSet {
  return {
    id: `${exerciseId}-${position}-${Date.now()}`,
    weightKg: "",
    reps: "",
    rpe: "",
    completed: false,
  };
}

export function WorkoutSessionBuilder() {
  const [exercises, setExercises] = useState(initialExercises);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const totals = useMemo(() => {
    const allSets = exercises.flatMap((exercise) => exercise.sets);
    return {
      completed: allSets.filter((set) => set.completed).length,
      total: allSets.length,
    };
  }, [exercises]);

  const availableExerciseOptions = useMemo(
    () =>
      exerciseOptions.filter(
        (name) => !exercises.some((exercise) => exercise.name === name),
      ),
    [exercises],
  );

  function updateSet(
    exerciseId: string,
    setId: string,
    field: keyof Omit<WorkoutSet, "id">,
    value: string | boolean,
  ) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id !== exerciseId
          ? exercise
          : {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? { ...set, [field]: value } : set,
              ),
            },
      ),
    );
    setSaveState("idle");
  }

  function addSet(exerciseId: string) {
    setExercises((current) =>
      current.map((exercise) =>
        exercise.id !== exerciseId
          ? exercise
          : {
              ...exercise,
              sets: [
                ...exercise.sets,
                newSet(exercise.id, exercise.sets.length + 1),
              ],
            },
      ),
    );
  }

  function addExercise() {
    const name = newExerciseName.trim();
    if (name.length < 2 || name.length > 80) return;

    if (!exerciseOptions.includes(name)) return;

    const id = `catalog-${crypto.randomUUID()}`;
    setExercises((current) => [
      ...current,
      {
        id,
        name,
        lastPerformance: "Sin registros previos",
        target: "Define una carga conservadora",
        sets: [1, 2, 3].map((position) => newSet(id, position)),
      },
    ]);
    setNewExerciseName("");
    setShowAddExercise(false);
    setSaveState("idle");
  }

  async function saveWorkout() {
    setSaveState("saving");
    try {
      const response = await fetch("/api/workouts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Día A · Empuje",
          sessionDate: new Date().toISOString(),
          exercises: exercises.map((exercise, exerciseIndex) => ({
            name: exercise.name,
            position: exerciseIndex + 1,
            sets: exercise.sets.map((set, setIndex) => ({
              setNumber: setIndex + 1,
              weightKg: Number(set.weightKg),
              reps: Number(set.reps),
              rpe: set.rpe ? Number(set.rpe) : null,
              completed: set.completed,
            })),
          })),
        }),
      });

      if (!response.ok) throw new Error("No se pudo guardar");
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  return (
    <div className="workout-layout">
      <div className="workout-stack">
        {exercises.map((exercise, exerciseIndex) => (
          <section className="exercise-editor surface-card" key={exercise.id}>
            <header className="exercise-editor-header">
              <span className="exercise-order">0{exerciseIndex + 1}</span>
              <div>
                <h2>{exercise.name}</h2>
                <p>{exercise.lastPerformance}</p>
              </div>
              <span className="target-badge">{exercise.target}</span>
            </header>

            <div className="sets-table" role="table" aria-label={`Series de ${exercise.name}`}>
              <div className="set-row set-header" role="row">
                <span>Serie</span>
                <span>kg</span>
                <span>reps</span>
                <span>RPE</span>
                <span>Lista</span>
              </div>
              {exercise.sets.map((set, setIndex) => (
                <div
                  className={`set-row ${set.completed ? "completed" : ""}`}
                  role="row"
                  key={set.id}
                >
                  <strong>{setIndex + 1}</strong>
                  <input
                    aria-label={`Peso serie ${setIndex + 1}`}
                    inputMode="decimal"
                    min="0"
                    step="0.5"
                    type="number"
                    value={set.weightKg}
                    onChange={(event) =>
                      updateSet(exercise.id, set.id, "weightKg", event.target.value)
                    }
                  />
                  <input
                    aria-label={`Repeticiones serie ${setIndex + 1}`}
                    inputMode="numeric"
                    min="0"
                    type="number"
                    value={set.reps}
                    onChange={(event) =>
                      updateSet(exercise.id, set.id, "reps", event.target.value)
                    }
                  />
                  <input
                    aria-label={`RPE serie ${setIndex + 1}, opcional`}
                    inputMode="decimal"
                    max="10"
                    min="1"
                    placeholder="—"
                    step="0.5"
                    type="number"
                    value={set.rpe}
                    onChange={(event) =>
                      updateSet(exercise.id, set.id, "rpe", event.target.value)
                    }
                  />
                  <button
                    aria-label={
                      set.completed
                        ? `Marcar serie ${setIndex + 1} como pendiente`
                        : `Completar serie ${setIndex + 1}`
                    }
                    className="complete-set"
                    type="button"
                    onClick={() =>
                      updateSet(
                        exercise.id,
                        set.id,
                        "completed",
                        !set.completed,
                      )
                    }
                  >
                    {set.completed ? "✓" : ""}
                  </button>
                </div>
              ))}
            </div>

            <footer className="exercise-editor-footer">
              <button
                className="inline-action"
                type="button"
                onClick={() => addSet(exercise.id)}
              >
                + Agregar serie
              </button>
              <button className="inline-action" type="button">
                Equipo ocupado
              </button>
              <button className="inline-action" type="button">
                Agregar nota
              </button>
            </footer>
          </section>
        ))}

        {showAddExercise ? (
          <section className="add-exercise-form surface-card">
            <div>
              <p className="eyebrow">NUEVO EJERCICIO</p>
              <h2>¿Qué movimiento vas a realizar?</h2>
            </div>
            <label className="field">
              <span>Ejercicio del catálogo</span>
              <select
                autoFocus
                value={newExerciseName}
                onChange={(event) => setNewExerciseName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addExercise();
                  }
                  if (event.key === "Escape") {
                    setShowAddExercise(false);
                    setNewExerciseName("");
                  }
                }}
              >
                <option value="">Selecciona un ejercicio</option>
                {availableExerciseOptions.map((exerciseName) => (
                  <option value={exerciseName} key={exerciseName}>
                    {exerciseName}
                  </option>
                ))}
              </select>
            </label>
            <div className="add-exercise-actions">
              <button
                className="button button-quiet"
                type="button"
                onClick={() => {
                  setShowAddExercise(false);
                  setNewExerciseName("");
                }}
              >
                Cancelar
              </button>
              <button
                className="button button-primary"
                disabled={!exerciseOptions.includes(newExerciseName)}
                type="button"
                onClick={addExercise}
              >
                Agregar a la sesión
              </button>
            </div>
          </section>
        ) : (
          <button
            className="add-exercise-card"
            type="button"
            onClick={() => setShowAddExercise(true)}
          >
            <span>+</span>
            Agregar ejercicio
          </button>
        )}
      </div>

      <aside className="session-summary surface-card">
        <p className="eyebrow">SESIÓN EN CURSO</p>
        <h2>Día A · Empuje</h2>
        <div className="session-completion">
          <strong>
            {totals.completed}/{totals.total}
          </strong>
          <span>series completadas</span>
        </div>
        <div className="completion-track">
          <span
            style={{
              width: `${totals.total ? (totals.completed / totals.total) * 100 : 0}%`,
            }}
          />
        </div>
        <dl className="summary-list">
          <div>
            <dt>Ejercicios</dt>
            <dd>{exercises.length}</dd>
          </div>
          <div>
            <dt>RPE objetivo</dt>
            <dd>7–8</dd>
          </div>
          <div>
            <dt>Descanso</dt>
            <dd>90 s</dd>
          </div>
        </dl>
        <button
          className="button button-primary finish-button"
          type="button"
          disabled={saveState === "saving"}
          onClick={saveWorkout}
        >
          {saveState === "saving" ? "Guardando…" : "Guardar sesión"}
        </button>
        <p className={`save-message ${saveState}`}>
          {saveState === "saved" && "Sesión guardada correctamente."}
          {saveState === "error" &&
            "La vista previa está sin base de datos. Tu sesión sigue visible aquí."}
        </p>
        <p className="safety-copy">
          El esfuerzo no debe sentirse como dolor. Detén el ejercicio si aparece
          una molestia aguda.
        </p>
      </aside>
    </div>
  );
}

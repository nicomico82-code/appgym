"use client";

import { useEffect, useMemo, useState } from "react";
import {
  exerciseAlternativesFor,
  exerciseInstructionUrl,
  exerciseOptions,
} from "../data/exercises";

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
  notes: string;
  showAlternatives: boolean;
  showNotes: boolean;
};

const initialExercises: ExerciseDraft[] = [
  {
    id: "press-banca",
    name: "Press banca con barra",
    lastPerformance: "Última vez: 30 kg × 10 · RPE 5",
    target: "Objetivo: 32,5 kg × 8–10",
    notes: "",
    showAlternatives: false,
    showNotes: false,
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
    notes: "",
    showAlternatives: false,
    showNotes: false,
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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingWorkout, setLoadingWorkout] = useState(true);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [saveState, setSaveState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [saveError, setSaveError] = useState("");

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

  useEffect(() => {
    const controller = new AbortController();

    void fetch("/api/workouts?latest=1", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as {
          workout: {
            id: string;
            exercises: Array<{
              id: string;
              name: string;
              notes: string;
              sets: Array<{
                setNumber: number;
                weightKg: number;
                reps: number;
                rpe: number | null;
                completed: boolean;
              }>;
            }>;
          } | null;
        };
      })
      .then((body) => {
        if (!body?.workout) return;

        setSessionId(body.workout.id);
        setExercises(
          body.workout.exercises.map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            lastPerformance: "Última sesión guardada",
            target: "Continúa desde tus valores guardados",
            notes: exercise.notes,
            showAlternatives: false,
            showNotes: false,
            sets: exercise.sets.map((set) => ({
              id: `${exercise.id}-${set.setNumber}`,
              weightKg: String(set.weightKg),
              reps: String(set.reps),
              rpe: set.rpe === null ? "" : String(set.rpe),
              completed: set.completed,
            })),
          })),
        );
        setSaveState("saved");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      })
      .finally(() => setLoadingWorkout(false));

    return () => controller.abort();
  }, []);

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

  function replaceExercise(exerciseId: string, replacementName: string) {
    if (!exerciseOptions.includes(replacementName)) return;

    setExercises((current) =>
      current.map((exercise) =>
        exercise.id !== exerciseId
          ? exercise
          : {
              ...exercise,
              name: replacementName,
              lastPerformance: "Sin registros previos",
              target: "Define una carga conservadora",
              sets: exercise.sets.map((_, index) =>
                newSet(exercise.id, index + 1),
              ),
              showAlternatives: false,
            },
      ),
    );
    setSaveState("idle");
  }

  function removeExercise(exerciseId: string, exerciseName: string) {
    if (exercises.length === 1) return;
    if (
      !window.confirm(
        `¿Eliminar "${exerciseName}" de esta sesión? Las series y notas de este ejercicio se perderán.`,
      )
    ) {
      return;
    }

    setExercises((current) =>
      current.filter((exercise) => exercise.id !== exerciseId),
    );
    setSaveState("idle");
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
        notes: "",
        showAlternatives: false,
        showNotes: false,
        sets: [1, 2, 3].map((position) => newSet(id, position)),
      },
    ]);
    setNewExerciseName("");
    setShowAddExercise(false);
    setSaveState("idle");
  }

  async function saveWorkout() {
    setSaveState("saving");
    setSaveError("");
    try {
      const response = await fetch("/api/workouts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          name: "Día A · Empuje",
          sessionDate: new Date().toISOString(),
          exercises: exercises.map((exercise, exerciseIndex) => ({
            name: exercise.name,
            position: exerciseIndex + 1,
            notes: exercise.notes,
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

      const body = (await response.json().catch(() => null)) as {
        error?: string;
        id?: string;
      } | null;
      if (!response.ok) {
        throw new Error(body?.error || "No se pudo guardar la sesión.");
      }
      if (body?.id) setSessionId(body.id);
      setSaveState("saved");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la sesión.",
      );
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
              <button
                className="inline-action"
                type="button"
                aria-expanded={exercise.showAlternatives}
                onClick={() =>
                  setExercises((current) =>
                    current.map((item) =>
                      item.id === exercise.id
                        ? {
                            ...item,
                            showAlternatives: !item.showAlternatives,
                          }
                        : item,
                    ),
                  )
                }
              >
                {exercise.showAlternatives ? "Cerrar alternativas" : "Equipo ocupado"}
              </button>
              <button
                className="inline-action"
                type="button"
                aria-expanded={exercise.showNotes}
                onClick={() =>
                  setExercises((current) =>
                    current.map((item) =>
                      item.id === exercise.id
                        ? { ...item, showNotes: !item.showNotes }
                        : item,
                    ),
                  )
                }
              >
                {exercise.showNotes ? "Cerrar nota" : "Agregar nota"}
              </button>
              <a
                className="inline-action"
                href={exerciseInstructionUrl(exercise.name)}
                target="_blank"
                rel="noreferrer"
              >
                Ver instrucciones ↗
              </a>
              <button
                className="inline-action danger"
                disabled={exercises.length === 1}
                title={
                  exercises.length === 1
                    ? "La sesión debe conservar al menos un ejercicio"
                    : `Eliminar ${exercise.name}`
                }
                type="button"
                onClick={() => removeExercise(exercise.id, exercise.name)}
              >
                Eliminar ejercicio
              </button>
            </footer>
            {exercise.showAlternatives && (
              <div className="exercise-inline-panel">
                <label className="field">
                  <span>Alternativa disponible</span>
                  <select
                    defaultValue=""
                    onChange={(event) =>
                      replaceExercise(exercise.id, event.target.value)
                    }
                  >
                    <option value="">Selecciona un reemplazo</option>
                    {exerciseAlternativesFor(exercise.name)
                      .filter(
                        (name) =>
                          !exercises.some((item) => item.name === name),
                      )
                      .map((name) => (
                        <option value={name} key={name}>
                          {name}
                        </option>
                      ))}
                  </select>
                </label>
                <small>
                  Al cambiarlo, las cargas y repeticiones se reinician por
                  seguridad.
                </small>
              </div>
            )}
            {exercise.showNotes && (
              <div className="exercise-inline-panel">
                <label className="field">
                  <span>Nota del ejercicio</span>
                  <textarea
                    maxLength={500}
                    placeholder="Ej.: molestia leve, ajustar banco o usar agarre neutro"
                    value={exercise.notes}
                    onChange={(event) => {
                      const notes = event.target.value;
                      setExercises((current) =>
                        current.map((item) =>
                          item.id === exercise.id ? { ...item, notes } : item,
                        ),
                      );
                      setSaveState("idle");
                    }}
                  />
                </label>
                <small>{exercise.notes.length}/500 caracteres</small>
              </div>
            )}
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
          disabled={loadingWorkout || saveState === "saving"}
          onClick={saveWorkout}
        >
          {loadingWorkout
            ? "Cargando sesión…"
            : saveState === "saving"
              ? "Guardando…"
              : "Guardar sesión"}
        </button>
        <p className={`save-message ${saveState}`}>
          {saveState === "saved" && "Sesión guardada correctamente."}
          {saveState === "error" &&
            `${saveError} Tu sesión sigue visible aquí para que puedas intentarlo nuevamente.`}
        </p>
        <p className="safety-copy">
          El esfuerzo no debe sentirse como dolor. Detén el ejercicio si aparece
          una molestia aguda.
        </p>
      </aside>
    </div>
  );
}

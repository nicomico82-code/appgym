"use client";

import { useState } from "react";

export function ExerciseProgressSelector({
  exercises,
  selected,
  weeks,
}: {
  exercises: string[];
  selected: string;
  weeks: number;
}) {
  const [value, setValue] = useState(selected);
  const [changing, setChanging] = useState(false);

  return (
    <div className="progress-exercise-picker" aria-live="polite">
      <select
        aria-label="Seleccionar ejercicio"
        aria-busy={changing}
        disabled={changing}
        value={value}
        onChange={(event) => {
          const exercise = event.target.value;
          const params = new URLSearchParams({
            weeks: String(weeks),
            exercise,
          });
          setValue(exercise);
          setChanging(true);
          window.location.assign(`/progreso?${params.toString()}`);
        }}
      >
        {exercises.map((exercise) => (
          <option value={exercise} key={exercise}>
            {exercise}
          </option>
        ))}
      </select>
      {changing && <small>Actualizando…</small>}
    </div>
  );
}

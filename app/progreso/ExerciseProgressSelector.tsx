"use client";

import { useRouter } from "next/navigation";

export function ExerciseProgressSelector({
  exercises,
  selected,
  weeks,
}: {
  exercises: string[];
  selected: string;
  weeks: number;
}) {
  const router = useRouter();

  return (
    <select
      aria-label="Seleccionar ejercicio"
      value={selected}
      onChange={(event) => {
        const params = new URLSearchParams({
          weeks: String(weeks),
          exercise: event.target.value,
        });
        router.push(`/progreso?${params.toString()}`);
      }}
    >
      {exercises.map((exercise) => (
        <option value={exercise} key={exercise}>
          {exercise}
        </option>
      ))}
    </select>
  );
}

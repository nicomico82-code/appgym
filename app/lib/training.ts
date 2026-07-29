export type Performance = {
  weightKg: number;
  completedReps: number;
  targetReps: number;
  rpe?: number;
};

export type LoadRecommendation = {
  action: "increase" | "hold" | "recover" | "insufficient";
  suggestedWeightKg?: number;
  reason: string;
};

export function estimateOneRepMax(weightKg: number, repetitions: number) {
  if (weightKg <= 0 || repetitions <= 0) return 0;
  return Math.round(weightKg * (1 + repetitions / 30) * 10) / 10;
}

export function recommendLoad(
  performances: Performance[],
  incrementKg: number,
): LoadRecommendation {
  const recent = performances.slice(-3);

  if (recent.length < 3) {
    return {
      action: "insufficient",
      reason: "Se necesitan tres sesiones comparables antes de ajustar la carga.",
    };
  }

  if (recent.some((entry) => entry.rpe !== undefined && entry.rpe >= 9)) {
    return {
      action: "recover",
      reason: "Al menos una sesión llegó a RPE 9 o más; conviene revisar recuperación y técnica.",
    };
  }

  const completedTargets = recent.every(
    (entry) => entry.completedReps >= entry.targetReps,
  );
  const reportedRpe = recent.filter(
    (entry): entry is Performance & { rpe: number } => entry.rpe !== undefined,
  );
  const averageRpe =
    reportedRpe.length > 0
      ? reportedRpe.reduce((sum, entry) => sum + entry.rpe, 0) /
        reportedRpe.length
      : undefined;

  if (completedTargets && averageRpe !== undefined && averageRpe <= 6) {
    return {
      action: "increase",
      suggestedWeightKg: recent.at(-1)!.weightKg + incrementKg,
      reason:
        "Completaste el objetivo en tres sesiones y el esfuerzo promedio fue RPE 6 o menor.",
    };
  }

  if (!completedTargets) {
    return {
      action: "hold",
      suggestedWeightKg: recent.at(-1)!.weightKg,
      reason:
        "Primero completa el rango objetivo con técnica estable antes de aumentar la carga.",
    };
  }

  return {
    action: "hold",
    suggestedWeightKg: recent.at(-1)!.weightKg,
    reason:
      "Mantén la carga y busca progresar en repeticiones con un RPE controlado.",
  };
}

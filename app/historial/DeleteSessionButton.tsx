"use client";

import { useState } from "react";

export function DeleteSessionButton({
  sessionId,
  sessionName,
}: {
  sessionId: string;
  sessionName: string;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    if (
      !window.confirm(
        `¿Eliminar definitivamente "${sessionName}"? Se borrarán sus ejercicios, series y notas. Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    setDeleting(true);
    setError("");
    try {
      const response = await fetch(
        `/api/workouts?id=${encodeURIComponent(sessionId)}`,
        { method: "DELETE" },
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error || "No se pudo eliminar la sesión.");
      }
      window.location.reload();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "No se pudo eliminar la sesión.",
      );
      setDeleting(false);
    }
  }

  return (
    <div className="history-delete">
      <button disabled={deleting} type="button" onClick={remove}>
        {deleting ? "Eliminando…" : "Eliminar sesión"}
      </button>
      {error && <small role="alert">{error}</small>}
    </div>
  );
}

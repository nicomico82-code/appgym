"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type AccessState = "checking" | "missing" | "error";

export function AccessGateway() {
  const router = useRouter();
  const [state, setState] = useState<AccessState>("checking");
  const [message, setMessage] = useState("Comprobando tu enlace personal…");

  useEffect(() => {
    const token = window.location.hash.replace(/^#(?:token=)?/, "").trim();
    window.history.replaceState(null, "", window.location.pathname);

    if (!token) {
      window.setTimeout(() => {
        setState("missing");
        setMessage("Abre el enlace personal que te entregó el administrador.");
      }, 0);
      return;
    }

    void fetch("/api/access", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (response) => {
        const body = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(body.error || "No fue posible abrir tu perfil.");
        }
        router.replace("/");
        router.refresh();
      })
      .catch((error: unknown) => {
        setState("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "No fue posible abrir tu perfil.",
        );
      });
  }, [router]);

  return (
    <main className="access-page">
      <section className="access-card">
        <Image
          alt="Max Level Fitness"
          className="access-logo"
          height={230}
          priority
          src="/max-level-logo.png"
          unoptimized
          width={240}
        />
        <p className="eyebrow">MAX LEVEL · BETA PRIVADA</p>
        <h1>
          {state === "checking" ? "Preparando tu espacio." : "Necesitas tu enlace personal."}
        </h1>
        <p className="access-tagline">Para alcanzar tu máximo nivel.</p>
        <p className={`access-message ${state}`}>{message}</p>
        {state !== "checking" && (
          <div className="access-help">
            <strong>¿Qué debes hacer?</strong>
            <p>
              Busca el enlace que recibiste para esta beta y ábrelo completo.
              No necesitas correo, contraseña ni una cuenta de ChatGPT.
            </p>
          </div>
        )}
        <small>
          Tu enlace es privado. No lo publiques ni lo reenvíes a otras personas.
        </small>
      </section>
    </main>
  );
}

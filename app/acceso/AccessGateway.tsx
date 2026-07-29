"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export function AccessGateway() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = window.location.hash.replace(/^#(?:token=)?/, "").trim();
    window.history.replaceState(null, "", window.location.pathname);

    if (!token) {
      window.setTimeout(() => {
        setChecking(false);
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
      .catch(() => {
        setChecking(false);
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
        {!checking && (
          <p className="access-instruction">
            Busca el enlace que recibiste para esta beta y ábrelo completo. No
            necesitas correos ni crear contraseñas.
          </p>
        )}
      </section>
    </main>
  );
}

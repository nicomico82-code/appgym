"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CurrentProfile } from "../lib/current-profile";

const experienceOptions: Array<{
  value: CurrentProfile["experienceLevel"];
  label: string;
  detail: string;
}> = [
  {
    value: "beginner",
    label: "Principiante",
    detail: "Menos de 1 año o retomando",
  },
  {
    value: "intermediate",
    label: "Intermedio",
    detail: "1–3 años con constancia",
  },
  {
    value: "advanced",
    label: "Avanzado",
    detail: "Más de 3 años estructurados",
  },
];

const goalLabels: Record<CurrentProfile["primaryGoal"], string> = {
  hypertrophy: "Ganancia muscular",
  strength: "Aumento de fuerza",
  fat_loss: "Pérdida de grasa",
  conditioning: "Acondicionamiento general",
  other: "Otro objetivo",
};

function completion(profile: CurrentProfile) {
  const values = [
    profile.displayName,
    profile.birthDate,
    profile.sex !== "not_specified",
    profile.heightCm,
    profile.bodyWeightKg,
    profile.experienceLevel,
    profile.primaryGoal,
  ];
  return Math.round(
    (values.filter((value) => Boolean(value)).length / values.length) * 100,
  );
}

export function ProfileForm({
  initialProfile,
}: {
  initialProfile: CurrentProfile;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [status, setStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const completionValue = useMemo(() => completion(profile), [profile]);
  const initials =
    profile.displayName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SO";

  function update<Key extends keyof CurrentProfile>(
    key: Key,
    value: CurrentProfile[Key],
  ) {
    setProfile((current) => ({ ...current, [key]: value }));
    setStatus("idle");
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(profile),
      });
      const body = (await response.json()) as {
        error?: string;
        profile?: Partial<CurrentProfile>;
      };

      if (!response.ok) {
        throw new Error(body.error || "No se pudo guardar el perfil.");
      }

      if (body.profile) {
        setProfile((current) => ({ ...current, ...body.profile }));
      }
      setStatus("saved");
      setMessage("Perfil actualizado. Tus próximas recomendaciones usarán estos datos.");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el perfil.",
      );
    }
  }

  return (
    <form className="profile-layout" onSubmit={submit}>
      <aside className="profile-summary surface-card">
        <div className="profile-avatar-large">{initials}</div>
        <h2>{profile.displayName || "Tu nombre"}</h2>
        <p>{profile.email}</p>
        <div className="profile-completion">
          <div>
            <span>Perfil completado</span>
            <strong>{completionValue}%</strong>
          </div>
          <div className="completion-track">
            <span style={{ width: `${completionValue}%` }} />
          </div>
        </div>
        <div className="profile-use-note">
          <span aria-hidden="true">i</span>
          <p>
            Tu edad, nivel, peso y objetivo ayudan a mantener recomendaciones
            conservadoras y relevantes.
          </p>
        </div>
      </aside>

      <div className="profile-form-stack">
        <section className="profile-section surface-card">
          <div className="profile-section-heading">
            <span>01</span>
            <div>
              <h2>Datos personales</h2>
              <p>Información básica para identificar y ajustar tu perfil.</p>
            </div>
          </div>
          <div className="form-grid">
            <label className="field field-wide">
              <span>Nombre para mostrar</span>
              <input
                autoComplete="name"
                maxLength={60}
                required
                value={profile.displayName}
                onChange={(event) => update("displayName", event.target.value)}
              />
            </label>
            <label className="field field-wide">
              <span>Cuenta de acceso</span>
              <input
                className="read-only"
                readOnly
                value={profile.email}
                aria-describedby="account-help"
              />
              <small id="account-help">
                Proviene de tu inicio de sesión y no se cambia aquí.
              </small>
            </label>
            <label className="field">
              <span>Fecha de nacimiento</span>
              <input
                type="date"
                value={profile.birthDate}
                onChange={(event) => update("birthDate", event.target.value)}
              />
            </label>
            <label className="field">
              <span>Sexo · opcional</span>
              <select
                value={profile.sex}
                onChange={(event) =>
                  update("sex", event.target.value as CurrentProfile["sex"])
                }
              >
                <option value="not_specified">Prefiero no indicar</option>
                <option value="female">Femenino</option>
                <option value="male">Masculino</option>
                <option value="other">Otro</option>
              </select>
            </label>
          </div>
        </section>

        <section className="profile-section surface-card">
          <div className="profile-section-heading">
            <span>02</span>
            <div>
              <h2>Experiencia y objetivo</h2>
              <p>Define el punto de partida de tus recomendaciones.</p>
            </div>
          </div>
          <fieldset className="experience-options">
            <legend>Nivel de experiencia</legend>
            {experienceOptions.map((option) => (
              <label
                className={
                  profile.experienceLevel === option.value ? "selected" : ""
                }
                key={option.value}
              >
                <input
                  type="radio"
                  name="experience"
                  value={option.value}
                  checked={profile.experienceLevel === option.value}
                  onChange={() => update("experienceLevel", option.value)}
                />
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.detail}</small>
                </span>
                <i aria-hidden="true">
                  {profile.experienceLevel === option.value ? "✓" : ""}
                </i>
              </label>
            ))}
          </fieldset>
          <label className="field goal-field">
            <span>Objetivo principal</span>
            <select
              value={profile.primaryGoal}
              onChange={(event) =>
                update(
                  "primaryGoal",
                  event.target.value as CurrentProfile["primaryGoal"],
                )
              }
            >
              {Object.entries(goalLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="profile-section surface-card">
          <div className="profile-section-heading">
            <span>03</span>
            <div>
              <h2>Medidas actuales</h2>
              <p>El peso conserva historial; la estatura reemplaza el valor anterior.</p>
            </div>
          </div>
          <div className="form-grid">
            <label className="field measure-field">
              <span>Peso corporal</span>
              <div>
                <input
                  type="number"
                  min="20"
                  max="500"
                  step="0.1"
                  inputMode="decimal"
                  value={profile.bodyWeightKg ?? ""}
                  onChange={(event) =>
                    update(
                      "bodyWeightKg",
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                    )
                  }
                />
                <b>kg</b>
              </div>
            </label>
            <label className="field measure-field">
              <span>Estatura</span>
              <div>
                <input
                  type="number"
                  min="80"
                  max="260"
                  step="0.1"
                  inputMode="decimal"
                  value={profile.heightCm ?? ""}
                  onChange={(event) =>
                    update(
                      "heightCm",
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                    )
                  }
                />
                <b>cm</b>
              </div>
            </label>
          </div>
        </section>

        <div className="profile-save-bar">
          <div className={`profile-status ${status}`} role="status">
            {message}
          </div>
          <button
            className="button button-primary"
            disabled={status === "saving"}
            type="submit"
          >
            {status === "saving" ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </form>
  );
}

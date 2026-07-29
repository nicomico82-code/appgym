"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { exercises } from "../data/exercises";

const filters = ["Todos", "Pecho", "Espalda", "Hombros", "Piernas"];

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function sessionHref(exerciseName: string) {
  return `/entrenar?exercise=${encodeURIComponent(exerciseName)}`;
}

export function ExerciseCatalog() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [expanded, setExpanded] = useState<string | null>("press-banca-barra");

  const matches = useMemo(() => {
    const term = normalized(query.trim());
    return exercises.filter((exercise) => {
      const matchesGroup =
        filter === "Todos" ||
        normalized(exercise.muscle).includes(normalized(filter));
      const searchable = [
        exercise.name,
        exercise.muscle,
        exercise.pattern,
        exercise.equipment,
        ...exercise.aliases,
      ]
        .map(normalized)
        .join(" ");
      return matchesGroup && (!term || searchable.includes(term));
    });
  }, [filter, query]);

  return (
    <>
      <div className="catalog-tools">
        <label className="search-field">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            value={query}
            placeholder="Busca press, remo, sentadilla…"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="filter-list" aria-label="Filtrar por grupo muscular">
          {filters.map((item) => (
            <button
              className={filter === item ? "active" : ""}
              key={item}
              type="button"
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {matches.length > 0 ? (
        <div className="catalog-grid">
          {matches.map((exercise) => {
            const isExpanded = expanded === exercise.slug;
            return (
              <article
                className={`exercise-card surface-card ${isExpanded ? "expanded" : ""}`}
                key={exercise.slug}
              >
                <div className="exercise-card-top">
                  <span>{exercise.muscle}</span>
                  <small>{exercise.equipment}</small>
                </div>
                <h2>{exercise.name}</h2>
                <p>{exercise.pattern}</p>
                <Link
                  className="catalog-use-primary"
                  href={sessionHref(exercise.name)}
                >
                  Usar este ejercicio <span aria-hidden="true">→</span>
                </Link>
                <button
                  className="alternative-toggle"
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => setExpanded(isExpanded ? null : exercise.slug)}
                >
                  {isExpanded ? "Ocultar alternativas" : "Ver 3 alternativas"}
                  <span aria-hidden="true">{isExpanded ? "−" : "+"}</span>
                </button>
                {isExpanded && (
                  <div className="alternative-list">
                    <p>Opciones con un patrón similar</p>
                    {exercise.alternatives.map((alternative, index) => (
                      <div key={alternative}>
                        <span>0{index + 1}</span>
                        <strong>{alternative}</strong>
                        <Link href={sessionHref(alternative)}>
                          Usar en sesión
                        </Link>
                      </div>
                    ))}
                    <small>
                      Empieza con una carga conservadora y ajusta después de una
                      serie de prueba.
                    </small>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-search surface-card">
          <span>?</span>
          <h2>No encontramos “{query}”</h2>
          <p>
            Prueba con otro nombre o busca por grupo muscular. El catálogo
            reconoce sinónimos comunes.
          </p>
          <button type="button" onClick={() => setQuery("")}>
            Limpiar búsqueda
          </button>
        </div>
      )}
    </>
  );
}

export type Exercise = {
  name: string;
  slug: string;
  muscle: string;
  pattern: string;
  equipment: string;
  aliases: string[];
  alternatives: string[];
};

export const exercises: Exercise[] = [
  {
    name: "Press banca con barra",
    slug: "press-banca-barra",
    muscle: "Pecho",
    pattern: "Empuje horizontal",
    equipment: "Barra y banco",
    aliases: ["press banca", "banca con barra"],
    alternatives: [
      "Press banca con mancuernas",
      "Press inclinado con barra",
      "Fondos en paralelas",
    ],
  },
  {
    name: "Press militar con barra",
    slug: "press-militar-barra",
    muscle: "Hombros",
    pattern: "Empuje vertical",
    equipment: "Barra",
    aliases: ["press militar", "press de hombro"],
    alternatives: [
      "Press militar con mancuernas",
      "Press Arnold",
      "Elevaciones laterales",
    ],
  },
  {
    name: "Remo con barra",
    slug: "remo-barra",
    muscle: "Espalda",
    pattern: "Tirón horizontal",
    equipment: "Barra",
    aliases: ["remo inclinado", "barbell row"],
    alternatives: ["Remo con mancuerna", "Jalón al pecho", "Remo en máquina"],
  },
  {
    name: "Jalón al pecho",
    slug: "jalon-pecho",
    muscle: "Espalda",
    pattern: "Tirón vertical",
    equipment: "Polea",
    aliases: ["lat pulldown", "jalón en polea"],
    alternatives: ["Dominadas asistidas", "Remo con barra", "Pull-over"],
  },
  {
    name: "Sentadilla con barra",
    slug: "sentadilla-barra",
    muscle: "Piernas",
    pattern: "Dominante de rodilla",
    equipment: "Barra y rack",
    aliases: ["sentadilla", "back squat"],
    alternatives: ["Prensa de piernas", "Sentadilla búlgara", "Hack squat"],
  },
  {
    name: "Peso muerto rumano",
    slug: "peso-muerto-rumano",
    muscle: "Isquiotibiales",
    pattern: "Bisagra de cadera",
    equipment: "Barra",
    aliases: ["rumano", "rdl"],
    alternatives: [
      "Peso muerto convencional",
      "Hiperextensiones",
      "Curl femoral",
    ],
  },
  {
    name: "Curl con barra",
    slug: "curl-barra",
    muscle: "Bíceps",
    pattern: "Flexión de codo",
    equipment: "Barra",
    aliases: ["curl bíceps", "curl de pie"],
    alternatives: [
      "Curl con mancuerna",
      "Curl en banco Scott",
      "Curl en polea",
    ],
  },
  {
    name: "Extensiones en polea",
    slug: "extension-triceps-polea",
    muscle: "Tríceps",
    pattern: "Extensión de codo",
    equipment: "Polea",
    aliases: ["tríceps polea", "pushdown"],
    alternatives: ["Press francés con barra", "Fondos", "Press francés mancuerna"],
  },
];

export const exerciseOptions = Array.from(
  new Set(
    exercises.flatMap((exercise) => [
      exercise.name,
      ...exercise.alternatives,
    ]),
  ),
).sort((left, right) => left.localeCompare(right, "es"));

export function exerciseAlternativesFor(name: string) {
  const family = exercises.find(
    (exercise) =>
      exercise.name === name || exercise.alternatives.includes(name),
  );
  if (!family) return [];

  return [family.name, ...family.alternatives].filter(
    (candidate) => candidate !== name,
  );
}

const curatedInstructionUrls: Record<string, string> = {};

export function exerciseInstructionUrl(name: string) {
  const curated = curatedInstructionUrls[name];
  if (curated) return curated;

  const query = encodeURIComponent(
    `${name} técnica correcta cómo realizar ejercicio`,
  );
  return `https://www.youtube.com/results?search_query=${query}`;
}

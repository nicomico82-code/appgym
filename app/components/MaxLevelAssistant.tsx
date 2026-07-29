"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  exerciseInstructionUrl,
  exercises,
} from "../data/exercises";

type AssistantLink = {
  href: string;
  label: string;
};

type AssistantReply = {
  text: string;
  links?: AssistantLink[];
};

type ChatMessage = AssistantReply & {
  id: number;
  role: "assistant" | "user";
};

const MAP_URL = "https://maps.app.goo.gl/rHzQzLBR4Kwwd8S96";
const WHATSAPP_URL =
  "https://wa.me/56977695668?text=Hola%20Max%20Level%2C%20necesito%20ayuda.";
const BOXMAGIC_URL = "https://boxmagic.cl/student";

const schedules = {
  lunes: [
    "06:00–07:00 · Mixto",
    "07:00–08:00 · Mixto",
    "08:00–09:15 · Mixto",
    "09:15–10:30 · Solo mujeres",
    "10:30–11:45 · Solo mujeres",
    "16:15–17:30 · Solo mujeres",
    "17:30–18:45 · Mixto",
    "18:45–20:00 · Mixto",
    "20:00–21:15 · Mixto",
    "21:15–22:30 · Mixto",
  ],
  martes: [
    "06:00–07:00 · Mixto",
    "07:00–08:00 · Mixto",
    "08:00–09:15 · Mixto",
    "09:30–11:00 · Adulto Max Level",
    "16:15–17:30 · Solo mujeres",
    "17:30–18:45 · Mixto",
    "18:45–20:00 · Mixto",
    "20:00–21:15 · Mixto",
    "21:15–22:30 · Mixto",
  ],
  miércoles: [
    "06:00–07:00 · Mixto",
    "07:00–08:00 · Mixto",
    "08:00–09:15 · Mixto",
    "09:15–10:30 · Solo mujeres",
    "10:30–11:45 · Solo mujeres",
    "16:15–17:30 · Solo mujeres",
    "17:30–18:45 · Mixto",
    "18:45–20:00 · Mixto",
    "20:00–21:15 · Mixto",
    "21:15–22:30 · Mixto",
  ],
  jueves: [
    "06:00–07:00 · Mixto",
    "07:00–08:00 · Mixto",
    "08:00–09:15 · Mixto",
    "09:30–11:00 · Adulto Max Level",
    "16:15–17:30 · Solo mujeres",
    "17:30–18:45 · Mixto",
    "18:45–20:00 · Mixto",
    "20:00–21:15 · Mixto",
    "21:15–22:30 · Mixto",
  ],
  viernes: [
    "06:00–07:00 · Mixto",
    "07:00–08:00 · Mixto",
    "08:00–09:15 · Mixto",
    "09:15–10:30 · Solo mujeres",
    "10:30–11:45 · Solo mujeres",
    "16:15–17:30 · Solo mujeres",
    "17:30–18:45 · Mixto",
    "18:45–20:00 · Mixto",
    "20:00–21:15 · Mixto",
    "21:15–22:30 · Mixto",
  ],
  sábado: [
    "10:30–11:45 · Mixto",
    "11:45–13:00 · Mixto",
  ],
} as const;

type ScheduleDay = keyof typeof schedules;

const dayAliases: Array<[ScheduleDay, string[]]> = [
  ["lunes", ["lunes", "lun", " lu "]],
  ["martes", ["martes", "mar", " ma "]],
  ["miércoles", ["miercoles", "miércoles", "mie", "mié", " mi "]],
  ["jueves", ["jueves", "jue", " ju "]],
  ["viernes", ["viernes", "vie", " vi "]],
  ["sábado", ["sabado", "sábado", "sab"]],
];

const rules = [
  "Respeta la privacidad de los demás y evita grabar a terceros.",
  "Guarda las mancuernas y discos después de utilizarlos.",
  "No dejes caer las pesas.",
  "Deja las máquinas descargadas al terminar.",
  "El uso de toalla es obligatorio.",
  "Usa calzado deportivo; no entrenes descalzo.",
  "Reporta inmediatamente cualquier falla o conducta insegura.",
  "Mantén un ambiente positivo y respetuoso.",
  "Comparte las máquinas y respeta los tiempos de uso.",
  "Cuida el orden y la limpieza del gimnasio.",
];

const quickQuestions = [
  "Horarios de hoy",
  "¿Cómo reservo?",
  "Ejercicios disponibles",
  "Reglas del gimnasio",
];

function normalize(value: string) {
  return ` ${value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[¿?¡!.,;:()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

function includesAny(value: string, words: string[]) {
  return words.some((word) => value.includes(normalize(word).trim()));
}

function todayScheduleDay(): ScheduleDay | null {
  const day = new Date().getDay();
  return (
    {
      1: "lunes",
      2: "martes",
      3: "miércoles",
      4: "jueves",
      5: "viernes",
      6: "sábado",
    } as Partial<Record<number, ScheduleDay>>
  )[day] ?? null;
}

function requestedDay(value: string) {
  if (value.includes(" hoy ")) return todayScheduleDay();
  return dayAliases.find(([, aliases]) =>
    aliases.some((alias) => value.includes(normalize(alias))),
  )?.[0] ?? null;
}

function scheduleReply(day: ScheduleDay): AssistantReply {
  return {
    text: `${day[0].toUpperCase()}${day.slice(1)}:\n${schedules[day]
      .map((slot) => `• ${slot}`)
      .join("\n")}\n\nLas clases guiadas incluyen gimnasio libre.`,
    links: [{ href: BOXMAGIC_URL, label: "Reservar en BoxMagic Members" }],
  };
}

function exerciseReply(value: string): AssistantReply | null {
  const exercise = exercises.find((candidate) => {
    const names = [
      candidate.name,
      ...candidate.aliases,
      ...candidate.alternatives,
    ];
    return names.some((name) => value.includes(normalize(name).trim()));
  });

  if (!exercise) return null;

  return {
    text: `${exercise.name} trabaja principalmente ${exercise.muscle.toLowerCase()} con un patrón de ${exercise.pattern.toLowerCase()}. Usa ${exercise.equipment.toLowerCase()}.\n\nAlternativas del catálogo:\n${exercise.alternatives
      .map((alternative) => `• ${alternative}`)
      .join("\n")}\n\nEmpieza con una carga conservadora y prioriza una técnica controlada.`,
    links: [
      {
        href: exerciseInstructionUrl(exercise.name),
        label: "Ver instrucciones",
      },
    ],
  };
}

function answerQuestion(question: string): AssistantReply {
  const value = normalize(question);
  const day = requestedDay(value);

  if (day) return scheduleReply(day);

  if (
    value.includes(" domingo ") ||
    (value.includes(" hoy ") && todayScheduleDay() === null)
  ) {
    return {
      text: "No hay clases guiadas informadas para el domingo. Para confirmar una apertura especial, consulta directamente con Max Level.",
      links: [{ href: WHATSAPP_URL, label: "Confirmar por WhatsApp" }],
    };
  }

  if (includesAny(value, ["hola", "buenas", "buen dia"])) {
    return {
      text: "¡Hola! Puedo ayudarte con horarios, reservas, ubicación, reglas, ejercicios, alternativas, series y RPE. ¿Qué necesitas saber?",
    };
  }

  if (includesAny(value, ["reserva", "reservar", "agendar", "boxmagic", "cupo"])) {
    return {
      text: "Las clases requieren reserva mediante BoxMagic Members. Entra con tu cuenta, revisa el horario disponible y selecciona la clase que quieres reservar. Si tienes problemas con tu cuenta o el cupo, escríbenos por WhatsApp.",
      links: [
        { href: BOXMAGIC_URL, label: "Abrir BoxMagic Members" },
        { href: WHATSAPP_URL, label: "Pedir ayuda por WhatsApp" },
      ],
    };
  }

  if (includesAny(value, ["direccion", "ubicacion", "donde queda", "mapa", "como llego"])) {
    return {
      text: "Puedes abrir la ubicación de Max Level Premium Gym directamente en Google Maps.",
      links: [{ href: MAP_URL, label: "Abrir ubicación" }],
    };
  }

  if (includesAny(value, ["whatsapp", "wsp", "telefono", "contacto", "llamar"])) {
    return {
      text: "El WhatsApp de Max Level es +56 9 7769 5668.",
      links: [{ href: WHATSAPP_URL, label: "Escribir por WhatsApp" }],
    };
  }

  if (includesAny(value, ["mujer", "mujeres", "femenino"])) {
    return {
      text: "Horarios solo para mujeres:\n• Lunes, miércoles y viernes: 09:15–10:30, 10:30–11:45 y 16:15–17:30.\n• Martes y jueves: 16:15–17:30.\n\nLa reserva se realiza mediante BoxMagic Members.",
      links: [{ href: BOXMAGIC_URL, label: "Reservar en BoxMagic Members" }],
    };
  }

  if (includesAny(value, ["adulto", "adulto mayor"])) {
    return {
      text: "Adulto Max Level se realiza los martes y jueves de 09:30 a 11:00. La reserva se hace mediante BoxMagic Members.",
      links: [{ href: BOXMAGIC_URL, label: "Reservar en BoxMagic Members" }],
    };
  }

  if (includesAny(value, ["horario", "clase", "clases", "abren", "cierran"])) {
    return {
      text: "Hay clases guiadas de lunes a viernes en bloques de mañana y tarde, y los sábados de 10:30 a 13:00. Pregúntame por un día específico, por ejemplo: “horarios del martes”. Las clases guiadas incluyen gimnasio libre.",
      links: [{ href: BOXMAGIC_URL, label: "Reservar en BoxMagic Members" }],
    };
  }

  if (includesAny(value, ["regla", "reglas", "convivencia", "norma"])) {
    return {
      text: `Reglas de convivencia:\n${rules
        .map((rule, index) => `${index + 1}. ${rule}`)
        .join("\n")}\n\nRegla de oro: respeta a las personas, los equipos y el espacio.`,
    };
  }

  if (includesAny(value, ["toalla"])) {
    return { text: "Sí. El uso de toalla es obligatorio para mantener un ambiente limpio, cómodo e higiénico." };
  }

  if (includesAny(value, ["descalzo", "zapatilla", "calzado"])) {
    return { text: "Debes usar calzado deportivo dentro de las instalaciones. No está permitido entrenar descalzo." };
  }

  if (includesAny(value, ["mancuerna", "disco", "pesas", "descargar maquina"])) {
    return {
      text: "Al terminar, devuelve mancuernas y discos a su lugar, no dejes caer las pesas y deja las máquinas descargadas para la siguiente persona.",
    };
  }

  if (includesAny(value, ["falla", "roto", "dañado", "inseguro", "accidente"])) {
    return {
      text: "Detén el uso del equipo y reporta inmediatamente la falla o situación insegura al personal de Max Level.",
      links: [{ href: WHATSAPP_URL, label: "Contactar a Max Level" }],
    };
  }

  if (includesAny(value, ["dolor", "lesion", "mareo", "dolor de pecho", "medico"])) {
    return {
      text: "Detén el ejercicio si aparece dolor agudo, mareo, dolor de pecho o pérdida de control. Habla con el personal y consulta a un profesional de salud cuando corresponda.",
      links: [{ href: WHATSAPP_URL, label: "Contactar a Max Level" }],
    };
  }

  const exerciseAnswer = exerciseReply(value);
  if (exerciseAnswer) return exerciseAnswer;

  if (includesAny(value, ["ejercicio", "ejercicios", "equipo", "equipamiento", "maquinas disponibles"])) {
    const equipment = Array.from(
      new Set(exercises.map((exercise) => exercise.equipment)),
    ).join(", ");
    return {
      text: `El catálogo incluye ejercicios para pecho, espalda, hombros, piernas, isquiotibiales, bíceps y tríceps. Equipamiento asociado: ${equipment}.\n\nPuedes preguntarme por un ejercicio específico, como press banca, remo con barra o sentadilla.`,
    };
  }

  if (includesAny(value, ["rpe", "esfuerzo"])) {
    return {
      text: "RPE indica qué tan difícil se sintió una serie, de 1 a 10. RPE 6 es controlado; 7–8 es exigente pero manejable; 9 es muy difícil y 10 es esfuerzo máximo. En Max Level puedes dejarlo vacío.",
    };
  }

  if (includesAny(value, ["serie", "series", "repeticion", "repeticiones", "reps"])) {
    return {
      text: "Una repetición es una ejecución completa del movimiento. Una serie agrupa varias repeticiones antes de descansar. Registra lo que realmente hiciste y marca como lista solo la serie completada.",
    };
  }

  if (includesAny(value, ["descanso", "descansar"])) {
    return {
      text: "Como referencia inicial, la aplicación muestra 90 segundos. El descanso real puede variar según el ejercicio, la carga y cómo te sientes. Si pierdes técnica o control, descansa más y pide orientación al entrenador.",
    };
  }

  if (includesAny(value, ["guardar sesion", "guardar entrenamiento"])) {
    return {
      text: "En Entrenar, revisa los datos, marca como listas las series completadas y pulsa “Guardar sesión”. Espera el mensaje de confirmación antes de salir.",
    };
  }

  if (includesAny(value, ["historial", "sesiones guardadas"])) {
    return {
      text: "Historial muestra tus sesiones guardadas en modo de solo lectura. Puedes revisarlas o eliminar una sesión completa después de confirmar la advertencia.",
    };
  }

  if (includesAny(value, ["progreso", "recomendacion", "recomendaciones"])) {
    return {
      text: "Progreso usa tus series completadas y guardadas. Puedes revisar 4, 8 o 12 semanas y elegir un ejercicio. Se necesitan tres sesiones comparables antes de ajustar automáticamente una carga.",
    };
  }

  if (includesAny(value, ["perfil", "estatura", "peso corporal"])) {
    return {
      text: "En Perfil puedes guardar nombre, experiencia, objetivo, peso y estatura. La estatura se escribe en centímetros: 175 equivale a 1,75 m.",
    };
  }

  if (includesAny(value, ["cronometro", "tiempo transcurrido", "temporizador"])) {
    return {
      text: "El cronómetro se inicia, pausa o reinicia desde Entrenar. Se sincroniza con tu perfil y la duración queda guardada con la sesión.",
    };
  }

  return {
    text: "No tengo esa información confirmada. Puedo ayudarte con horarios, reservas, ubicación, reglas, ejercicios, alternativas, series y RPE. Para otra consulta, escríbenos directamente.",
    links: [{ href: WHATSAPP_URL, label: "Preguntar por WhatsApp" }],
  };
}

export function MaxLevelAssistant() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      text: "Hola, soy el asistente de Max Level. Puedo ayudarte con horarios, reservas, reglas y ejercicios. ¿Qué necesitas saber?",
    },
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  function ask(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;

    setMessages((current) => [
      ...current.slice(-18),
      {
        id: Date.now(),
        role: "user",
        text: trimmed,
      },
      {
        id: Date.now() + 1,
        role: "assistant",
        ...answerQuestion(trimmed),
      },
    ]);
    setQuestion("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(question);
  }

  return (
    <>
      <button
        aria-controls="max-level-assistant"
        aria-expanded={open}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente de Max Level"}
        className={`assistant-launcher ${open ? "active" : ""}`}
        type="button"
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">{open ? "×" : "?"}</span>
        <strong>{open ? "Cerrar" : "¿Necesitas ayuda?"}</strong>
      </button>

      {open && (
        <section
          aria-label="Asistente de Max Level"
          className="assistant-panel"
          id="max-level-assistant"
          role="dialog"
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
          }}
        >
          <header className="assistant-header">
            <div>
              <span>ML</span>
              <div>
                <strong>Asistente Max Level</strong>
                <small>Horarios, reservas y ejercicios</small>
              </div>
            </div>
            <button
              aria-label="Cerrar asistente"
              type="button"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </header>

          <div
            aria-live="polite"
            className="assistant-messages"
            ref={messagesRef}
          >
            {messages.map((message) => (
              <article
                className={`assistant-message ${message.role}`}
                key={message.id}
              >
                <p>{message.text}</p>
                {message.links && (
                  <div>
                    {message.links.map((link) => (
                      <a
                        href={link.href}
                        key={link.href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {link.label} ↗
                      </a>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>

          <div className="assistant-quick" aria-label="Preguntas rápidas">
            {quickQuestions.map((item) => (
              <button type="button" key={item} onClick={() => ask(item)}>
                {item}
              </button>
            ))}
          </div>

          <form className="assistant-form" onSubmit={submit}>
            <label>
              <span className="sr-only">Escribe tu consulta</span>
              <input
                maxLength={180}
                placeholder="Ej.: horarios del martes"
                ref={inputRef}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
              />
            </label>
            <button
              aria-label="Enviar consulta"
              disabled={!question.trim()}
              type="submit"
            >
              →
            </button>
          </form>
        </section>
      )}
    </>
  );
}

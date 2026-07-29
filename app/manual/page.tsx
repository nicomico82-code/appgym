import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "../components/AppShell";

export const metadata: Metadata = {
  title: "Manual de usuario",
  description:
    "Aprende a usar Max Level paso a paso, desde el acceso hasta las recomendaciones.",
};

const sections = [
  ["inicio-manual", "Primeros pasos"],
  ["perfil-manual", "Configurar el perfil"],
  ["sesion-manual", "Registrar una sesión"],
  ["herramientas-manual", "Herramientas del ejercicio"],
  ["guardado-manual", "Guardar e historial"],
  ["progreso-manual", "Progreso y recomendaciones"],
  ["datos-manual", "Datos y sincronización"],
  ["problemas-manual", "Problemas frecuentes"],
] as const;

export default function ManualPage() {
  return (
    <AppShell current="manual">
      <header className="section-header manual-header">
        <div>
          <p className="eyebrow">GUÍA PASO A PASO · MODO PRUEBA</p>
          <h1>Manual de usuario.</h1>
          <p>
            Todo lo necesario para usar Max Level, aunque nunca hayas utilizado
            una aplicación de entrenamiento.
          </p>
        </div>
        <Link className="button button-primary" href="/entrenar">
          Ir a entrenar <span aria-hidden="true">→</span>
        </Link>
      </header>

      <section className="manual-quick surface-card">
        <span className="manual-number">01</span>
        <div>
          <p className="eyebrow">VERSIÓN CORTA</p>
          <h2>Abre tu enlace, registra cada serie y guarda al terminar.</h2>
          <ol>
            <li>Entra con el enlace personal que te entregó el administrador.</li>
            <li>Elige una sesión A, B, C o D y activa el cronómetro si quieres.</li>
            <li>Escribe peso, repeticiones y, opcionalmente, RPE.</li>
            <li>Marca como lista cada serie realmente completada.</li>
            <li>Pulsa <strong>Guardar sesión</strong> antes de salir.</li>
          </ol>
        </div>
      </section>

      <div className="manual-layout">
        <aside className="manual-index surface-card">
          <p className="eyebrow">EN ESTA GUÍA</p>
          <nav aria-label="Contenido del manual">
            {sections.map(([id, label], index) => (
              <a href={`#${id}`} key={id}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {label}
              </a>
            ))}
          </nav>
          <p>
            Consejo: si ves una <strong>i</strong> junto a RPE, tócala para ver
            su explicación.
          </p>
        </aside>

        <div className="manual-content">
          <article className="manual-section surface-card" id="inicio-manual">
            <p className="eyebrow">01 · PRIMEROS PASOS</p>
            <h2>Entrar y moverte por la aplicación</h2>
            <h3>Tu enlace personal</h3>
            <p>
              No necesitas correo ni contraseña. El administrador te entrega
              un enlace único. Ábrelo completo; ese enlace identifica tu perfil
              y permite ver los mismos datos desde el teléfono y el computador.
            </p>
            <div className="manual-callout">
              <strong>Cuídalo como una contraseña.</strong>
              <span>
                Quien tenga el enlace puede acceder a tu perfil. No lo publiques
                ni lo reenvíes.
              </span>
            </div>
            <h3>Secciones principales</h3>
            <dl className="manual-definitions">
              <div><dt>Inicio</dt><dd>Resumen real de tus sesiones y marcas.</dd></div>
              <div><dt>Entrenar</dt><dd>Registro de la sesión que estás realizando.</dd></div>
              <div><dt>Historial</dt><dd>Sesiones guardadas en modo de solo lectura.</dd></div>
              <div><dt>Progreso</dt><dd>Gráficos, 1RM estimado y recomendaciones.</dd></div>
              <div><dt>Ejercicios</dt><dd>Catálogo, búsqueda y alternativas.</dd></div>
              <div><dt>Perfil</dt><dd>Nombre, experiencia, objetivo y medidas.</dd></div>
            </dl>
          </article>

          <article className="manual-section surface-card" id="perfil-manual">
            <p className="eyebrow">02 · PERFIL</p>
            <h2>Configura tus datos antes de entrenar</h2>
            <p>
              En <strong>Perfil</strong> puedes guardar tu nombre, fecha de
              nacimiento, sexo opcional, nivel de experiencia, objetivo, peso
              y estatura.
            </p>
            <ul>
              <li>La estatura se escribe en centímetros: <strong>175</strong> se guarda como 175 cm, equivalente a 1,75 m.</li>
              <li>El peso corporal se escribe en kilogramos y admite decimales.</li>
              <li>El porcentaje indica cuánto completaste; no evalúa tu estado físico.</li>
              <li>Después de editar, pulsa <strong>Guardar cambios</strong>.</li>
            </ul>
          </article>

          <article className="manual-section surface-card" id="sesion-manual">
            <p className="eyebrow">03 · ENTRENAR</p>
            <h2>Registra una sesión paso a paso</h2>
            <h3>1. Elige una plantilla</h3>
            <p>
              En el selector encontrarás A · Pecho, B · Espalda, C · Piernas y
              D · Full body. Cambiar la plantilla inicia una sesión nueva y
              solicita confirmación si tienes datos sin guardar.
            </p>
            <p>
              Cada plantilla mantiene su enfoque: A admite pecho, hombros y
              tríceps; B, espalda y bíceps; C, piernas. D es la opción mixta y
              permite movimientos de todo el cuerpo. Si intentas agregar un
              ejercicio de otra sección, la aplicación no lo añade y te indica
              qué plantilla debes usar.
            </p>
            <h3>2. Usa el cronómetro</h3>
            <p>
              Pulsa <strong>Iniciar</strong>, <strong>Pausar</strong> o
              <strong>Reiniciar</strong>. El tiempo se sincroniza con tu perfil
              y se guarda como duración de la sesión. El tiempo estimado cambia
              según la cantidad de ejercicios y series.
            </p>
            <h3>3. Completa cada serie</h3>
            <dl className="manual-definitions">
              <div><dt>kg</dt><dd>Peso realmente utilizado. Admite coma o punto decimal; por ejemplo, 12,5.</dd></div>
              <div><dt>reps</dt><dd>Repeticiones realmente completadas.</dd></div>
              <div><dt>RPE</dt><dd>Esfuerzo percibido del 1 al 10. Es opcional.</dd></div>
              <div><dt>Lista</dt><dd>Marca únicamente las series terminadas.</dd></div>
            </dl>
            <p>
              RPE 6 significa esfuerzo controlado; 7–8, exigente pero manejable;
              9, muy difícil; y 10, esfuerzo máximo. Si no lo sabes, déjalo
              vacío: la sesión se guardará igualmente.
            </p>
            <h3>4. Agrega o elimina series</h3>
            <p>
              <strong>+ Agregar serie</strong> crea una fila nueva. El botón ×
              elimina una serie y pide confirmación si ya contiene datos.
              Siempre debe quedar al menos una serie por ejercicio.
            </p>
          </article>

          <article className="manual-section surface-card" id="herramientas-manual">
            <p className="eyebrow">04 · HERRAMIENTAS DEL EJERCICIO</p>
            <h2>Ajusta la sesión a lo que ocurre en el gimnasio</h2>
            <ul>
              <li><strong>Equipo ocupado:</strong> abre alternativas del catálogo. Al reemplazar el ejercicio, sus series se reinician por seguridad.</li>
              <li><strong>Agregar nota:</strong> guarda hasta 500 caracteres sobre técnica, molestias o ajustes.</li>
              <li><strong>Ver instrucciones:</strong> abre una búsqueda de videos sobre la técnica del ejercicio en otra pestaña.</li>
              <li><strong>Eliminar ejercicio:</strong> lo quita después de una advertencia. La sesión debe conservar al menos uno.</li>
              <li><strong>Agregar ejercicio:</strong> permite elegir únicamente movimientos existentes en el catálogo.</li>
            </ul>
            <h3>Asistente Max Level</h3>
            <p>
              El botón <strong>¿Necesitas ayuda?</strong> abre un chat para
              consultar horarios, reservas, ubicación, reglas, ejercicios,
              alternativas, series y RPE. Incluye accesos directos a BoxMagic
              Members, Google Maps y WhatsApp. Si la respuesta no está
              confirmada, te deriva al gimnasio.
            </p>
            <h3>Usar un ejercicio desde el catálogo</h3>
            <p>
              En <strong>Ejercicios</strong>, pulsa
              <strong> Usar este ejercicio</strong> en el movimiento principal
              o <strong>Usar en sesión</strong> en una alternativa. La
              aplicación abre Entrenar y lo agrega con tres series. Si ya
              estaba en la sesión, evita duplicarlo y muestra una confirmación.
              Si no corresponde a la plantilla activa, muestra una advertencia
              y propone la sesión correcta o D · Full body.
            </p>
          </article>

          <article className="manual-section surface-card" id="guardado-manual">
            <p className="eyebrow">05 · GUARDADO E HISTORIAL</p>
            <h2>Guarda, revisa y protege tus registros</h2>
            <p>
              Pulsa <strong>Guardar sesión</strong> y espera la confirmación. La
              primera vez se crea el registro; si sigues en esa misma pantalla
              y vuelves a guardar, se actualiza esa sesión. Puedes corregirla
              mientras siga abierta.
            </p>
            <p>
              En <strong>Historial</strong> las sesiones quedan en modo de solo
              lectura. Allí verás fecha, duración, ejercicios, notas, peso,
              repeticiones, RPE y estado de cada serie.
            </p>
            <div className="manual-callout warning">
              <strong>Eliminar es definitivo.</strong>
              <span>
                El historial permite borrar una sesión completa, pero siempre
                muestra una advertencia antes de hacerlo.
              </span>
            </div>
          </article>

          <article className="manual-section surface-card" id="progreso-manual">
            <p className="eyebrow">06 · PROGRESO</p>
            <h2>Cómo se calculan las recomendaciones</h2>
            <p>
              Progreso utiliza únicamente series marcadas como completadas y
              sesiones guardadas. Puedes revisar períodos de 4, 8 o 12 semanas
              y elegir el ejercicio que deseas analizar.
            </p>
            <ul>
              <li>Se necesitan <strong>tres sesiones distintas y comparables</strong> para ajustar una carga.</li>
              <li>Si aparece RPE 9–10, recomienda revisar recuperación y técnica.</li>
              <li>Si completas el objetivo tres veces con RPE promedio ≤ 6, propone subir 2,5 kg.</li>
              <li>Si faltan repeticiones, recomienda mantener la carga.</li>
              <li>Sin RPE, guarda el entrenamiento, pero no aumenta automáticamente.</li>
            </ul>
            <p>
              La recomendación aparece en lenguaje directo, por ejemplo:
              “Para tu próxima sesión te recomendamos press banca con 32,5 kg”.
              También explica el motivo y muestra la carga reciente, RPE
              promedio y 1RM estimado.
            </p>
            <div className="manual-callout">
              <strong>El 1RM es solo una estimación.</strong>
              <span>No es una instrucción para intentar ese peso máximo.</span>
            </div>
          </article>

          <article className="manual-section surface-card" id="datos-manual">
            <p className="eyebrow">07 · DATOS Y SINCRONIZACIÓN</p>
            <h2>Tu información vive en la base de datos</h2>
            <ul>
              <li>El mismo enlace personal abre el mismo perfil en teléfono y computador.</li>
              <li>Perfil, sesiones, series, notas, historial y cronómetro se guardan en Cloudflare D1.</li>
              <li>Una nueva publicación de la aplicación no borra tus registros.</li>
              <li>Si otro dispositivo está abierto, recarga o vuelve a la sección para ver el último cambio guardado.</li>
              <li>El navegador recuerda el acceso durante 90 días, salvo que cierres el perfil o borres sus datos.</li>
            </ul>
          </article>

          <article className="manual-section surface-card" id="problemas-manual">
            <p className="eyebrow">08 · AYUDA</p>
            <h2>Problemas frecuentes</h2>
            <h3>No puedo entrar</h3>
            <p>
              Comprueba Internet y abre el enlace completo. Si fue desactivado,
              solicita uno nuevo al administrador.
            </p>
            <h3>Guardé, pero no veo el cambio en otro dispositivo</h3>
            <p>
              Confirma que usaste el mismo enlace y que apareció el mensaje de
              guardado. Después recarga la sección en el otro dispositivo.
            </p>
            <h3>Un ejercicio no aparece en Progreso</h3>
            <p>
              Comprueba que la sesión esté guardada, que las series estén
              marcadas como listas y que su fecha esté dentro del período
              seleccionado.
            </p>
            <h3>¿Qué hago si siento dolor?</h3>
            <p>
              Detén el ejercicio ante dolor agudo, mareo, dolor de pecho o
              pérdida de control. Max Level organiza registros y no reemplaza
              a un médico, kinesiólogo o entrenador cualificado.
            </p>
          </article>
        </div>
      </div>
    </AppShell>
  );
}

# Entrena

PWA móvil-first para registrar entrenamientos por serie, entender el progreso y
recibir recomendaciones explicables.

Este repositorio corresponde a `nicomico82-code/appgym`. La especificación del
GPT que dio origen al producto se conserva completa en `docs/legacy-gpt/`.

## Manual de usuario

La guía completa para comenzar desde cero está en
[docs/MANUAL-DE-USUARIO.md](docs/MANUAL-DE-USUARIO.md). Incluye inicio de
sesión, navegación, configuración del perfil, registro de series, escala RPE,
lectura del progreso, privacidad y solución de problemas.

## Producto actual

- Dashboard con próxima sesión y métricas.
- Registro de peso, repeticiones y RPE por serie.
- Historial visual de carga y volumen.
- Catálogo con sinónimos y alternativas.
- Perfil editable asociado a la cuenta autenticada.
- Motor determinista inicial de progresión.
- Persistencia relacional con D1 y migraciones Drizzle.
- Recomendaciones preparadas para conservar evidencia y versión de reglas.

Parte de las métricas del dashboard y Progreso todavía utiliza datos
demostrativos. Esta primera versión se publica como piloto privado.

## Desarrollo

Requiere Node.js `>=22.13.0`.

```bash
npm install
npm run dev
npm test
```

Comandos:

- `npm run dev`: servidor local.
- `npm run build`: compilación de producción.
- `npm run lint`: validación estática.
- `npm test`: compilación y pruebas del producto.
- `npm run db:generate`: genera migraciones tras cambiar el esquema.

## Datos

Las cargas se almacenan como gramos enteros y el RPE multiplicado por diez. Esto
evita errores de comparación con cargas decimales y conserva valores como RPE
6,5.

La estructura separa sesión, ejercicio realizado y cada serie. Las
recomendaciones futuras guardarán la evidencia utilizada, el resultado
determinista y la versión del conjunto de reglas.

## Siguiente etapa

El siguiente corte debe conectar todas las métricas al historial real, completar
las acciones del catálogo y permitir editar sesiones guardadas.

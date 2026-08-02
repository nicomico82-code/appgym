# Max Level

PWA móvil-first de Max Level Fitness para registrar entrenamientos por serie,
entender el progreso y alcanzar el máximo nivel.

Este repositorio corresponde a `nicomico82-code/appgym`. La documentación
funcional y técnica del producto se mantiene dentro de `docs/`.

## Manual de usuario

La guía completa para comenzar desde cero está en
[docs/MANUAL-DE-USUARIO.md](docs/MANUAL-DE-USUARIO.md). Incluye acceso mediante
enlace personal, navegación, configuración del perfil, registro de series, escala RPE,
lectura del progreso, privacidad y solución de problemas.

## Producto actual

- Dashboard con próxima sesión y métricas.
- Registro de peso, repeticiones y RPE por serie.
- Progreso real por períodos de 4, 8 y 12 semanas.
- Historial visual de carga, RPE y series por ejercicio.
- Catálogo con sinónimos y alternativas.
- Perfil editable y aislado mediante enlace personal.
- Creación de ejercicios adicionales dentro de una sesión.
- Motor determinista inicial de progresión.
- Persistencia relacional con D1 y migraciones Drizzle.
- Recomendaciones preparadas para conservar evidencia y versión de reglas.

Parte de las métricas del dashboard inicial todavía utiliza datos demostrativos.
La pantalla Progreso se calcula desde las sesiones reales de cada enlace.

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

El siguiente corte debe conectar las métricas restantes del Inicio al historial,
completar las acciones del catálogo y permitir editar sesiones guardadas.

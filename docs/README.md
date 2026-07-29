# Documentación de origen

`legacy-gpt/` conserva los diez archivos originales utilizados para definir el
Entrenador Virtual IA:

- instrucciones y documentación técnica;
- guía de personalización;
- simulaciones de conversaciones;
- starters;
- cuatro tablas CSV de conocimiento.

Estos archivos se mantienen como referencia funcional y trazabilidad. La
aplicación no usa la conversación como base de datos: las reglas deterministas
y el modelo relacional viven en `app/lib/`, `db/` y `drizzle/`.

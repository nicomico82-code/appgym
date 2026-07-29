# Contexto para descargar y desplegar

## Objetivo

Continuar trabajando sobre el proyecto existente. No crear otro hosting, otro
Worker ni otra base de datos.

## Repositorio

- GitHub: <https://github.com/nicomico82-code/appgym.git>
- Rama principal: `main`

Para descargarlo:

```bash
git clone https://github.com/nicomico82-code/appgym.git
cd appgym
npm install
```

## Hosting existente

- Plataforma: Cloudflare Workers
- Worker: `entrena-beta`
- Dirección pública:
  <https://entrena-beta.maxlevel-fitness.workers.dev>
- Configuración: `wrangler.jsonc`

El despliegue debe actualizar el Worker existente:

```bash
npm test
npx wrangler deploy --config wrangler.jsonc
```

No se debe crear un Worker con otro nombre ni desplegar en un servicio distinto.

## Base de datos existente

- Servicio: Cloudflare D1
- Nombre: `entrena-beta`
- Binding utilizado por la aplicación: `DB`
- Identificador y configuración: `wrangler.jsonc`
- Migraciones: carpeta `drizzle`

La base de datos no se descarga al clonar GitHub. Permanece alojada en la cuenta
de Cloudflare. Para consultarla, aplicar migraciones o desplegar, se necesita
una sesión autorizada en la misma cuenta de Cloudflare.

Antes de desplegar cambios que incluyan una migración nueva:

```bash
npx wrangler d1 migrations apply entrena-beta --remote --config wrangler.jsonc
npx wrangler deploy --config wrangler.jsonc
```

No se debe crear otra base D1 ni sustituir el identificador existente.

## Acceso necesario

La persona o agente que continúe el trabajo necesita:

1. Acceso al repositorio de GitHub.
2. Node.js compatible con el proyecto.
3. Una sesión de Wrangler autorizada en la cuenta de Cloudflare que contiene el
   Worker y la base D1.

Para comprobar la cuenta activa:

```bash
npx wrangler whoami
```

## Instrucción breve para otro proyecto

> Clona `https://github.com/nicomico82-code/appgym.git` y trabaja sobre la rama
> `main`. Conserva el Worker de Cloudflare `entrena-beta`, su URL actual, el
> archivo `wrangler.jsonc` y la base D1 `entrena-beta` enlazada como `DB`. No
> crees otro hosting ni otra base de datos. Ejecuta las pruebas antes de
> desplegar y aplica únicamente las migraciones pendientes.

## Seguridad

No incluir en documentación, commits ni mensajes:

- enlaces personales de acceso de los participantes;
- tokens o cookies;
- credenciales de GitHub;
- credenciales o API tokens de Cloudflare.

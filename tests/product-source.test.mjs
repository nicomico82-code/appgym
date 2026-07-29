import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("defines the finished product dashboard without starter artifacts", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("package.json", root), "utf8"),
  ]);

  assert.match(page, /Buen día, \{firstName\}/);
  assert.match(page, /Iniciar entrenamiento/);
  assert.match(page, /Cargas sugeridas/);
  assert.match(layout, /Entrena — progreso con criterio/);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview|Building your site/i);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});

test("defines the main MVP product routes", async () => {
  const [train, progress, exercises, profile, profileForm] = await Promise.all([
    readFile(new URL("app/entrenar/page.tsx", root), "utf8"),
    readFile(new URL("app/progreso/page.tsx", root), "utf8"),
    readFile(new URL("app/ejercicios/page.tsx", root), "utf8"),
    readFile(new URL("app/perfil/page.tsx", root), "utf8"),
    readFile(new URL("app/perfil/ProfileForm.tsx", root), "utf8"),
  ]);

  assert.match(train, /Registra\. Ajusta\. Continúa\./);
  assert.match(progress, /Tu progreso, con evidencia\./);
  assert.match(exercises, /Encuentra tu siguiente movimiento\./);
  assert.match(profile, /Un perfil que entrena contigo\./);
  assert.match(profileForm, /Guardar cambios/);
});

test("keeps persistence, auditability and PWA infrastructure", async () => {
  const [hosting, manifest, schema, api, profileApi, migration, profileMigration] =
    await Promise.all([
    readFile(new URL(".openai/hosting.json", root), "utf8"),
    readFile(new URL("app/manifest.ts", root), "utf8"),
    readFile(new URL("db/schema.ts", root), "utf8"),
    readFile(new URL("app/api/workouts/route.ts", root), "utf8"),
    readFile(new URL("app/api/profile/route.ts", root), "utf8"),
    access(new URL("drizzle/0000_hard_sally_floyd.sql", root)),
    access(new URL("drizzle/0001_good_makkari.sql", root)),
  ]);

  assert.match(hosting, /"d1": "DB"/);
  assert.match(manifest, /display:\s*"standalone"/);
  assert.match(schema, /export const workoutSets/);
  assert.match(schema, /export const recommendations/);
  assert.match(schema, /sex: text\("sex"\)/);
  assert.match(api, /Math\.round\(set\.weightKg! \* 1000\)/);
  assert.match(profileApi, /export async function PUT/);
  assert.equal(migration, undefined);
  assert.equal(profileMigration, undefined);
});

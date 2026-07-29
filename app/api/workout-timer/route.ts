import { getD1 } from "../../../db";
import { accessIdentityFromRequest } from "../../access-session";

type TimerRow = {
  startedAt: string | null;
  accumulatedSeconds: number;
  running: number;
};

type TimerAction = {
  action?: "start" | "pause" | "reset";
};

function elapsedSeconds(row: TimerRow | null, now: Date) {
  if (!row) return 0;
  const runningSeconds =
    row.running && row.startedAt
      ? Math.max(
          0,
          Math.floor((now.getTime() - Date.parse(row.startedAt)) / 1000),
        )
      : 0;
  return row.accumulatedSeconds + runningSeconds;
}

async function readTimer(ownerKey: string) {
  return getD1()
    .prepare(
      `SELECT
         started_at AS startedAt,
         accumulated_seconds AS accumulatedSeconds,
         running
       FROM workout_timers
       WHERE owner_key = ?
       LIMIT 1`,
    )
    .bind(ownerKey)
    .first<TimerRow>();
}

function timerResponse(row: TimerRow | null, now: Date) {
  return Response.json(
    {
      running: Boolean(row?.running),
      startedAt: row?.startedAt ?? null,
      accumulatedSeconds: row?.accumulatedSeconds ?? 0,
      elapsedSeconds: elapsedSeconds(row, now),
      serverNow: now.toISOString(),
    },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function GET(request: Request) {
  try {
    const identity = await accessIdentityFromRequest(request);
    if (!identity) {
      return Response.json({ error: "Acceso requerido." }, { status: 401 });
    }

    const now = new Date();
    return timerResponse(await readTimer(identity.ownerKey), now);
  } catch {
    return Response.json(
      { error: "No se pudo consultar el cronómetro." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const identity = await accessIdentityFromRequest(request);
    if (!identity) {
      return Response.json({ error: "Acceso requerido." }, { status: 401 });
    }

    const payload = (await request.json()) as TimerAction;
    if (!payload.action || !["start", "pause", "reset"].includes(payload.action)) {
      return Response.json(
        { error: "La acción del cronómetro no es válida." },
        { status: 400 },
      );
    }

    const db = getD1();
    const now = new Date();
    const current = await readTimer(identity.ownerKey);

    if (payload.action === "reset") {
      await db
        .prepare("DELETE FROM workout_timers WHERE owner_key = ?")
        .bind(identity.ownerKey)
        .run();
      return timerResponse(null, now);
    }

    if (payload.action === "start") {
      if (!current?.running) {
        await db
          .prepare(
            `INSERT INTO workout_timers
             (owner_key, started_at, accumulated_seconds, running, updated_at)
             VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
             ON CONFLICT(owner_key) DO UPDATE SET
               started_at = excluded.started_at,
               accumulated_seconds = excluded.accumulated_seconds,
               running = 1,
               updated_at = CURRENT_TIMESTAMP`,
          )
          .bind(
            identity.ownerKey,
            now.toISOString(),
            current?.accumulatedSeconds ?? 0,
          )
          .run();
      }
      return timerResponse(await readTimer(identity.ownerKey), now);
    }

    const accumulated = elapsedSeconds(current, now);
    await db
      .prepare(
        `INSERT INTO workout_timers
         (owner_key, started_at, accumulated_seconds, running, updated_at)
         VALUES (?, NULL, ?, 0, CURRENT_TIMESTAMP)
         ON CONFLICT(owner_key) DO UPDATE SET
           started_at = NULL,
           accumulated_seconds = excluded.accumulated_seconds,
           running = 0,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(identity.ownerKey, accumulated)
      .run();

    return timerResponse(await readTimer(identity.ownerKey), now);
  } catch {
    return Response.json(
      { error: "No se pudo actualizar el cronómetro." },
      { status: 500 },
    );
  }
}

import { accessCookie, activateAccessToken } from "../../access-session";

type AccessPayload = {
  token?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as AccessPayload;
    const token = payload.token?.trim() ?? "";
    const identity = await activateAccessToken(token);

    if (!identity) {
      return Response.json(
        { error: "El enlace personal no es válido o fue desactivado." },
        { status: 401 },
      );
    }

    const secure = new URL(request.url).protocol === "https:";
    return Response.json(
      { label: identity.label },
      {
        headers: {
          "set-cookie": accessCookie(token, secure),
          "cache-control": "no-store",
        },
      },
    );
  } catch {
    return Response.json(
      { error: "No fue posible comprobar el enlace personal." },
      { status: 500 },
    );
  }
}

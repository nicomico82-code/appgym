import { clearAccessCookie } from "../../../access-session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secure = url.protocol === "https:";
  return new Response(null, {
    status: 303,
    headers: {
      location: new URL("/acceso", url).toString(),
      "set-cookie": clearAccessCookie(secure),
      "cache-control": "no-store",
    },
  });
}

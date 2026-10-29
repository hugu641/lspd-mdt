import { NextResponse, type NextRequest } from "next/server";
import { getSessionSecret } from "./lib/sessionSecret";

// Routes callable without an MDT session: login flow, public recruitment form,
// and Discord setup (that route enforces admin-or-first-setup itself).
function isPublic(path: string, method: string) {
  if (path.startsWith("/api/auth/")) return true;
  if (path === "/api/recruitment/discord/login") return true;
  if (path === "/api/recruitment/fields" && method === "GET") return true;
  if (path === "/api/recruitment/candidates" && method === "POST") return true;
  if (path === "/api/discord/settings" || path === "/api/discord/test") return true;
  return false;
}

function base64url(bytes: ArrayBuffer) {
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(bytes))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Same format as createSessionToken in lib/discord.ts: base64url(json).base64url(hmac-sha256)
async function hasValidSession(token: string | undefined) {
  if (!token) return false;
  const [data, signature] = token.split(".");
  if (!data || !signature) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expected = base64url(await crypto.subtle.sign("HMAC", key, enc.encode(data)));
  if (expected !== signature) return false;

  try {
    const b64 = data.replace(/-/g, "+").replace(/_/g, "/");
    const json = new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
    const payload = JSON.parse(json);
    return !payload.expiresAt || Date.now() <= payload.expiresAt;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname, req.method)) return NextResponse.next();

  if (await hasValidSession(req.cookies.get("lspd_session")?.value)) {
    return NextResponse.next();
  }
  return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
}

export const config = {
  matcher: "/api/:path*",
};

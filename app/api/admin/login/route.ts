import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "crypto";
import {
  signAdminSession,
  adminSessionCookieHeader,
  ADMIN_SESSION_TTL_MS,
} from "@/lib/admin-session";

function safeEqualString(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function POST(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD ?? "";
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";

  if (!password || !secret) {
    return NextResponse.json({ error: "Admin auth is not configured on the server." }, { status: 503 });
  }

  let body: { password?: string; next?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const submitted = typeof body.password === "string" ? body.password : "";
  if (!safeEqualString(submitted, password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const token = await signAdminSession(secret, ADMIN_SESSION_TTL_MS);
  const maxAgeSec = Math.floor(ADMIN_SESSION_TTL_MS / 1000);
  const secure =
    request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  const res = NextResponse.json({ ok: true, next: typeof body.next === "string" ? body.next : "/admin" });
  res.headers.append("Set-Cookie", adminSessionCookieHeader(token, maxAgeSec, secure));
  return res;
}

import { NextResponse, type NextRequest } from "next/server";
import { adminSessionClearCookieHeader } from "@/lib/admin-session";

export async function POST(request: NextRequest) {
  const url = new URL("/", request.url);
  const res = NextResponse.redirect(url);
  const secure =
    request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
  res.headers.append("Set-Cookie", adminSessionClearCookieHeader(secure));
  return res;
}

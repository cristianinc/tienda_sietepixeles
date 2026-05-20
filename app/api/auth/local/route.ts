import { NextResponse } from "next/server";

const ADMIN_USER = process.env.ADMIN_USER ?? "admin";
const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE ?? "482916";
const ADMIN_SESSION_TOKEN = process.env.ADMIN_SESSION_TOKEN ?? "local-admin-session";

export async function POST(request: Request) {
  const body = (await request.json()) as { user?: string; code?: string };

  if (body.user !== ADMIN_USER || body.code !== ADMIN_ACCESS_CODE) {
    return NextResponse.json(
      { ok: false, message: "Usuario o codigo incorrecto." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("local-admin-token", ADMIN_SESSION_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}

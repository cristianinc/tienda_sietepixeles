import { cookies } from "next/headers";
import { z } from "zod";
import { getLoginClientAddress } from "@/lib/auth/client-address";
import {
  authCookieOptions,
  beginLogin,
  challengeMaxAgeSeconds,
  challengeCookieName,
  completeLogin,
  sessionCookieName,
  sessionMaxAgeSeconds,
} from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(1024),
});
const mfaSchema = z.object({ code: z.string().regex(/^\d{6}$/) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const cookieStore = await cookies();

  if (body && "code" in body) {
    const parsed = mfaSchema.safeParse(body);
    const challengeToken = cookieStore.get(challengeCookieName)?.value;
    if (!parsed.success || !challengeToken) {
      return Response.json({ ok: false, error: "Desafio MFA invalido." }, { status: 400 });
    }

    const session = await completeLogin(challengeToken, parsed.data.code);
    if (!session) {
      return Response.json({ ok: false, error: "Codigo incorrecto o expirado." }, { status: 401 });
    }

    cookieStore.delete(challengeCookieName);
    cookieStore.set(sessionCookieName, session.token, authCookieOptions(sessionMaxAgeSeconds));
    return Response.json({ ok: true });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Credenciales invalidas." }, { status: 400 });
  }

  const clientAddress = getLoginClientAddress(request.headers);
  const challenge = await beginLogin(parsed.data.email, parsed.data.password, clientAddress);
  if (!challenge) {
    return Response.json({ ok: false, error: "Correo o contrasena incorrectos." }, { status: 401 });
  }

  cookieStore.set(challengeCookieName, challenge.token, authCookieOptions(challengeMaxAgeSeconds));
  const issuer = encodeURIComponent(process.env.STORE_NAME?.trim() || "Tienda");
  const account = encodeURIComponent(challenge.email);
  return Response.json({
    ok: true,
    mfaRequired: true,
    setupSecret: challenge.setupSecret,
    otpAuthUri: challenge.setupSecret
      ? `otpauth://totp/${issuer}:${account}?secret=${challenge.setupSecret}&issuer=${issuer}`
      : undefined,
  });
}

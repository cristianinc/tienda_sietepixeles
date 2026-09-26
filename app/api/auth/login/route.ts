import { cookies } from "next/headers";
import { z } from "zod";
import { getLoginClientAddress } from "@/lib/auth/client-address";
import {
  authCookieOptions,
  login,
  sessionCookieName,
  sessionMaxAgeSeconds,
} from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(1024),
});
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: "Credenciales invalidas." }, { status: 400 });
  }

  const clientAddress = getLoginClientAddress(request.headers);
  const session = await login(parsed.data.email, parsed.data.password, clientAddress);
  if (!session) {
    return Response.json({ ok: false, error: "Correo o contrasena incorrectos." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, session.token, authCookieOptions(sessionMaxAgeSeconds));
  return Response.json({ ok: true });
}

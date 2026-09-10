import "server-only";

import { cookies } from "next/headers";
import { isAdminEmail } from "@/lib/auth/admin";
import { getSessionUser, sessionCookieName } from "@/lib/auth/session";

export async function authorizeAdminRequest() {
  const token = (await cookies()).get(sessionCookieName)?.value;
  const user = await getSessionUser(token);

  if (!user) {
    return { response: Response.json({ ok: false, error: "No autenticado" }, { status: 401 }) } as const;
  }
  if (!isAdminEmail(user.email)) {
    return { response: Response.json({ ok: false, error: "No autorizado" }, { status: 403 }) } as const;
  }

  return { user } as const;
}

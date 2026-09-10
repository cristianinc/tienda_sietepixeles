import { cookies } from "next/headers";
import { revokeSession, sessionCookieName } from "@/lib/auth/session";

export async function POST() {
  const cookieStore = await cookies();
  await revokeSession(cookieStore.get(sessionCookieName)?.value);
  cookieStore.delete(sessionCookieName);
  return Response.json({ ok: true });
}

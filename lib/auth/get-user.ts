import { cookies } from "next/headers";
import { getAdminSession, sessionCookieName } from "@/lib/auth/session";

export async function getUserRole() {
  const cookieStore = await cookies();
  const user = await getAdminSession(cookieStore.get(sessionCookieName)?.value);

  if (!user) {
    return null;
  }

  return { user, role: "admin" };
}

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "cristian.inc@gmail.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminEmails = getAdminEmails();
  const isAdmin = Boolean(user?.email && adminEmails.includes(user.email.toLowerCase()));

  if (!isAdmin) {
    return Response.json({ ok: false }, { status: 401 });
  }

  return Response.json({ ok: true });
}

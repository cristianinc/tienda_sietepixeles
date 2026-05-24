import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "cristian.inc@gmail.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmails = getAdminEmails();
  const hasAuth = Boolean(user?.email && adminEmails.includes(user.email.toLowerCase()));
  const isMfaSetupPage = request.nextUrl.pathname === "/admin/mfa/setup";

  if (!hasAuth) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", request.nextUrl.pathname);
    if (user) {
      url.searchParams.set("error", "unauthorized");
    }
    return NextResponse.redirect(url);
  }

  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const hasMfa = assurance?.currentLevel === "aal2";

  if (!hasMfa && !isMfaSetupPage) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "MFA requerido" }, { status: 403 });
    }

    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/agrupadores/:path*",
    "/api/categorias/:path*",
    "/api/colores/:path*",
    "/api/productos/:path*",
    "/api/tallas/:path*",
  ],
};

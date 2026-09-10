import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession, sessionCookieName } from "@/lib/auth/session";

export async function proxy(request: NextRequest) {
  const user = await getAdminSession(request.cookies.get(sessionCookieName)?.value);

  if (!user) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
    }

    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/agent/:path*",
    "/api/agrupadores/:path*",
    "/api/categorias/:path*",
    "/api/colores/:path*",
    "/api/productos/:path*",
    "/api/tallas/:path*",
  ],
};

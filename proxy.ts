import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const localToken = request.cookies.get("local-admin-token")?.value;
  const expectedLocalToken = process.env.ADMIN_SESSION_TOKEN ?? "local-admin-session";
  const hasLocalAuth = localToken === expectedLocalToken;
  const hasSupabaseAuth = request.cookies.has("sb-access-token") || request.cookies.has("sb:token");
  const hasAuth = hasLocalAuth || hasSupabaseAuth;

  if (!hasAuth) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

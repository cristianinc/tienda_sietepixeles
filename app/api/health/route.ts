import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if ((process.env.AUTH_SECRET?.length ?? 0) < 32 || !process.env.ADMIN_EMAILS?.trim()) {
      return Response.json({ status: "misconfigured" }, { status: 503 });
    }
    await getDb().query("select 1");
    return Response.json({ status: "ok" });
  } catch (error) {
    console.error("Healthcheck de PostgreSQL fallido", error);
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}

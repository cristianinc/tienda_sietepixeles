import { authorizeAdminRequest } from "@/lib/auth/api-authorization";

export async function GET() {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  return Response.json({ ok: true, email: authorization.user.email });
}

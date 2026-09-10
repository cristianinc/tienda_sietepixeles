import { authorizeAdminRequest } from "@/lib/auth/api-authorization";
import { getConversations } from "@/lib/commercial/repository";

export async function GET(request: Request) {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  const status = new URL(request.url).searchParams.get("status");
  if (status && !["open", "human", "closed"].includes(status)) {
    return Response.json({ ok: false, error: "Estado no válido" }, { status: 400 });
  }
  const conversations = await getConversations(status as "open" | "human" | "closed" | null ?? undefined);
  return Response.json({ ok: true, conversations });
}

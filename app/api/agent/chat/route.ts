import { AgentError } from "@/lib/agent/guardrails";
import { runAgentTool } from "@/lib/agent/runner";
import { agentChatRequestSchema } from "@/lib/agent/schemas";
import { agentTools } from "@/lib/agent/tools";
import { authorizeAdminRequest } from "@/lib/auth/api-authorization";

export const runtime = "nodejs";
export const maxDuration = 10;

export async function POST(request: Request) {
  const authorization = await authorizeAdminRequest();
  if ("response" in authorization) return authorization.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: { code: "INVALID_REQUEST", message: "El cuerpo debe ser JSON válido" } }, { status: 400 });
  }

  const parsed = agentChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: { code: "INVALID_REQUEST", message: "La solicitud no es válida" } },
      { status: 400 },
    );
  }

  try {
    const output = await runAgentTool(parsed.data.tool, parsed.data.input, agentTools);
    return Response.json({ ok: true, tool: parsed.data.tool, output });
  } catch (error) {
    const agentError = error instanceof AgentError ? error : new AgentError("EXECUTION_FAILED", "No se pudo completar la consulta");
    const status = agentError.code === "AGENT_DISABLED" ? 503 : agentError.code === "INVALID_REQUEST" ? 400 : 500;
    return Response.json({ ok: false, error: { code: agentError.code, message: agentError.message } }, { status });
  }
}

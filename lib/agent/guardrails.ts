import { agentToolNameSchema, type AgentToolName } from "./schemas.ts";
import { ZodError } from "zod";

export type AgentErrorCode = "AGENT_DISABLED" | "INVALID_REQUEST" | "TOOL_NOT_ALLOWED" | "EXECUTION_FAILED";

export class AgentError extends Error {
  public readonly code: AgentErrorCode;

  constructor(
    code: AgentErrorCode,
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

export function assertAgentEnabled() {
  if (process.env.AGENT_ENABLED !== "true") {
    throw new AgentError("AGENT_DISABLED", "El agente está deshabilitado");
  }
}

export function assertReadOnlyTool(tool: string): asserts tool is AgentToolName {
  if (!agentToolNameSchema.safeParse(tool).success) {
    throw new AgentError("TOOL_NOT_ALLOWED", "La herramienta solicitada no está permitida");
  }
}

export function toAgentError(error: unknown) {
  if (error instanceof AgentError) return error;
  if (error instanceof ZodError) {
    return new AgentError("INVALID_REQUEST", "Los parámetros de la herramienta no son válidos");
  }

  console.error("Error de ejecución del agente", error);
  return new AgentError("EXECUTION_FAILED", "No se pudo completar la consulta del catálogo");
}

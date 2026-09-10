import { getDb } from "@/lib/db";
import type { AgentToolName } from "./schemas";

type AuditStatus = "success" | "error";

const sensitiveKeys = /token|secret|password|authorization|cookie/i;

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, sensitiveKeys.test(key) ? "[REDACTED]" : redact(nestedValue)]),
    );
  }
  return value;
}

export async function recordAgentToolCall({
  tool,
  input,
  output,
  status,
  durationMs,
  errorCode,
}: {
  tool: AgentToolName;
  input: unknown;
  output?: unknown;
  status: AuditStatus;
  durationMs: number;
  errorCode?: string;
}) {
  try {
    await getDb().query(
      `
        insert into agent_tool_calls (tool_name, input, output, status, error_code, duration_ms)
        values ($1, $2::jsonb, $3::jsonb, $4, $5, $6)
      `,
      [
        tool,
        JSON.stringify(redact(input) ?? null),
        JSON.stringify(redact(output ?? null)),
        status,
        errorCode ?? null,
        durationMs,
      ],
    );
  } catch (error) {
    console.error("No se pudo registrar la auditoría del agente", error);
  }
}

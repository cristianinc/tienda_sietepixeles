import { recordAgentToolCall } from "./audit";
import { assertAgentEnabled, assertReadOnlyTool, toAgentError } from "./guardrails";
import type { AgentToolName } from "./schemas";

export type AgentTools = Record<AgentToolName, (input: unknown) => Promise<unknown>>;

export async function runAgentTool(tool: string, input: unknown, tools: AgentTools) {
  assertAgentEnabled();
  assertReadOnlyTool(tool);

  const startedAt = Date.now();
  try {
    const output = await tools[tool](input);
    await recordAgentToolCall({
      tool,
      input,
      output,
      status: "success",
      durationMs: Date.now() - startedAt,
    });
    return output;
  } catch (error) {
    const agentError = toAgentError(error);
    await recordAgentToolCall({
      tool,
      input,
      status: "error",
      errorCode: agentError.code,
      durationMs: Date.now() - startedAt,
    });
    throw agentError;
  }
}

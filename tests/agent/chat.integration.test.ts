import assert from "node:assert/strict";
import test from "node:test";
import {
  checkInventoryOutputSchema,
  getProductDetailsOutputSchema,
  searchProductsOutputSchema,
  storeInformationOutputSchema,
} from "../../lib/agent/schemas.ts";

const baseUrl = process.env.AGENT_INTEGRATION_URL;
const cookie = process.env.AGENT_INTEGRATION_COOKIE;

async function callAgent(tool: string, input: unknown, authenticated = true) {
  return fetch(`${baseUrl}/api/agent/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authenticated && cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify({ tool, input }),
  });
}

test("el endpoint del agente rechaza solicitudes sin sesión", { skip: !baseUrl }, async () => {
  const response = await callAgent("search_products", { query: "vestido" }, false);
  assert.equal(response.status, 401);
});

test("el endpoint autenticado preserva los contratos de las herramientas", { skip: !baseUrl || !cookie }, async () => {
  const cases = [
    { tool: "search_products", input: { query: "vestido", onlyAvailable: true }, schema: searchProductsOutputSchema },
    { tool: "get_product_details", input: { slug: "vestido-satin-noche" }, schema: getProductDetailsOutputSchema },
    { tool: "check_inventory", input: { productSlug: "vestido-satin-noche" }, schema: checkInventoryOutputSchema },
    { tool: "get_store_information", input: {}, schema: storeInformationOutputSchema },
  ] as const;

  for (const toolCase of cases) {
    const response = await callAgent(toolCase.tool, toolCase.input);
    assert.equal(response.status, 200, toolCase.tool);
    const body = await response.json() as { ok: boolean; tool: string; output: unknown };
    assert.equal(body.ok, true, toolCase.tool);
    assert.equal(body.tool, toolCase.tool);
    assert.equal(toolCase.schema.safeParse(body.output).success, true, toolCase.tool);
  }
});

test("el endpoint autenticado rechaza una herramienta no permitida", { skip: !baseUrl || !cookie }, async () => {
  const response = await callAgent("update_inventory", {});
  assert.equal(response.status, 400);
  const body = await response.json() as { ok: boolean; error: { code: string } };
  assert.equal(body.ok, false);
  assert.equal(body.error.code, "INVALID_REQUEST");
});

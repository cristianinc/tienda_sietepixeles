import assert from "node:assert/strict";
import test from "node:test";
import { AgentError, assertReadOnlyTool } from "../../lib/agent/guardrails.ts";
import {
  agentChatRequestSchema,
  checkInventoryInputSchema,
  checkInventoryOutputSchema,
  getProductDetailsOutputSchema,
  searchProductsInputSchema,
  searchProductsOutputSchema,
  storeInformationOutputSchema,
} from "../../lib/agent/schemas.ts";

test("acepta solicitudes de herramientas de lectura", () => {
  const request = agentChatRequestSchema.parse({
    tool: "search_products",
    input: { query: "vestido", onlyAvailable: true },
  });
  const input = searchProductsInputSchema.parse(request.input);

  assert.equal(request.tool, "search_products");
  assert.equal(input.onlyAvailable, true);
});

test("rechaza rangos de precio y selectores de inventario ambiguos", () => {
  assert.equal(searchProductsInputSchema.safeParse({ minPrice: 20_000, maxPrice: 10_000 }).success, false);
  assert.equal(checkInventoryInputSchema.safeParse({ sku: "SKU-001", productSlug: "producto" }).success, false);
});

test("bloquea herramientas fuera de la lista permitida", () => {
  assert.throws(
    () => assertReadOnlyTool("update_inventory"),
    (error) => error instanceof AgentError && error.code === "TOOL_NOT_ALLOWED",
  );
});

test("mantiene contratos de salida tipados para el catálogo", () => {
  const variant = { id: 1, size: "M", color: "Negro", sku: "VEST-M-NEG", stock: 7, isAvailable: true };
  const product = {
    id: 1,
    name: "Vestido Satin Noche",
    slug: "vestido-satin-noche",
    description: "Silueta suave con caída elegante.",
    category: "Vestidos",
    price: 39_990,
    originalPrice: 39_990,
    imageUrl: null,
    productUrl: "/producto/vestido-satin-noche",
    variants: [variant],
  };

  assert.equal(searchProductsOutputSchema.parse({ products: [product], total: 1 }).total, 1);
  assert.equal(getProductDetailsOutputSchema.parse({ product }).product?.slug, product.slug);
  assert.equal(
    checkInventoryOutputSchema.parse({ variants: [{ ...variant, productId: 1, productName: product.name, productSlug: product.slug }] }).variants[0].sku,
    variant.sku,
  );
  assert.equal(storeInformationOutputSchema.parse({ name: null, weekdayHours: null, saturdayHours: null, address: null, contactEmail: null, shippingPolicy: null, exchangePolicy: null }).name, null);
});

test("rechaza contratos que prometen stock negativo", () => {
  assert.equal(
    checkInventoryOutputSchema.safeParse({
      variants: [{ id: 1, size: "M", color: "Negro", sku: "VEST-M-NEG", stock: -1, isAvailable: false, productId: 1, productName: "Vestido", productSlug: "vestido" }],
    }).success,
    false,
  );
});

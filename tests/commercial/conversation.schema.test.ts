import assert from "node:assert/strict";
import test from "node:test";
import { conversationUpdateSchema, humanNoteSchema } from "../../lib/validations/conversation.schema.ts";

test("valida transiciones administrativas de conversación", () => {
  assert.deepEqual(conversationUpdateSchema.parse({ status: "human", bot_enabled: false }), { status: "human", bot_enabled: false });
  assert.equal(conversationUpdateSchema.safeParse({ status: "invalid" }).success, false);
  assert.equal(conversationUpdateSchema.safeParse({}).success, false);
});

test("acepta notas humanas no vacías y rechaza notas vacías", () => {
  assert.equal(humanNoteSchema.parse({ content: "Revisar talla disponible" }).content, "Revisar talla disponible");
  assert.equal(humanNoteSchema.safeParse({ content: "  " }).success, false);
});

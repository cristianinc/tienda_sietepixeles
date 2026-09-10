import assert from "node:assert/strict";
import test from "node:test";
import pg from "pg";

const databaseUrl = process.env.COMMERCIAL_INTEGRATION_DATABASE_URL;

test("la persistencia comercial conserva relaciones e idempotencia", { skip: !databaseUrl }, async (suite) => {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  await client.query("begin");
  suite.after(async () => {
    await client.query("rollback");
    await client.end();
  });

  const customer = await client.query(
    "insert into customers (channel, external_id, display_name) values ($1, $2, $3) returning id",
    ["manual", "test-customer", "Cliente de prueba"],
  );
  const conversation = await client.query(
    "insert into conversations (channel, customer_id, external_conversation_id) values ($1, $2, $3) returning id",
    ["manual", customer.rows[0].id, "test-conversation"],
  );

  await suite.test("crea mensajes y actualiza la conversación", async () => {
    const message = await client.query(
      "insert into conversation_messages (conversation_id, external_message_id, direction, sender_type, content) values ($1, $2, $3, $4, $5) returning id",
      [conversation.rows[0].id, "test-message", "incoming", "customer", "Hola"],
    );
    assert.ok(message.rows[0].id);
  });

  await suite.test("evita duplicar mensajes externos por conversación", async () => {
    await client.query("savepoint duplicate_message");
    await assert.rejects(
      client.query(
        "insert into conversation_messages (conversation_id, external_message_id, direction, sender_type) values ($1, $2, $3, $4)",
        [conversation.rows[0].id, "test-message", "incoming", "customer"],
      ),
    );
    await client.query("rollback to savepoint duplicate_message");
  });

  await suite.test("relaciona oportunidades con cliente y conversación", async () => {
    const lead = await client.query(
      "insert into sales_leads (source_channel, customer_id, conversation_id, product_context) values ($1, $2, $3, $4::jsonb) returning id",
      ["manual", customer.rows[0].id, conversation.rows[0].id, JSON.stringify([{ productId: 1 }])],
    );
    assert.ok(lead.rows[0].id);
  });
});

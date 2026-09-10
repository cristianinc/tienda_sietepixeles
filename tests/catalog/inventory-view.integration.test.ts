import assert from "node:assert/strict";
import test from "node:test";
import pg from "pg";

const databaseUrl = process.env.CATALOG_INTEGRATION_DATABASE_URL;

test("la vista de inventario entrega un catálogo vendible y sin duplicados", { skip: !databaseUrl }, async (suite) => {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  suite.after(async () => client.end());

  const { rows: variants } = await client.query(`
    select variant_id, product_id, product_slug, size, color, original_price, discount_price, effective_price, stock, is_active
    from v_inventario_bot
    order by variant_id
  `);

  assert.ok(variants.length > 0);

  await suite.test("devuelve detalle y variante por producto", async () => {
    const first = variants[0];
    assert.ok(first.product_id);
    assert.ok(first.variant_id);
    assert.ok(first.product_slug);
  });

  await suite.test("mantiene stock no negativo y precio efectivo correcto", async () => {
    for (const variant of variants) {
      assert.ok(Number(variant.stock) >= 0);
      assert.equal(
        Number(variant.effective_price),
        Number(variant.discount_price ?? variant.original_price),
      );
    }
  });

  await suite.test("no duplica variantes ni incluye productos inactivos", async () => {
    const { rows } = await client.query(`
      select
        count(*) filter (where is_active = false)::int as inactive_rows,
        count(*) - count(distinct variant_id)::int as duplicate_rows
      from v_inventario_bot
    `);
    assert.equal(Number(rows[0].inactive_rows), 0);
    assert.equal(Number(rows[0].duplicate_rows), 0);
  });

  await suite.test("filtra talla y color mediante parámetros", async () => {
    const first = variants[0];
    const { rows } = await client.query(
      "select variant_id from v_inventario_bot where size = $1 and color = $2",
      [first.size, first.color],
    );
    assert.ok(rows.some((row) => row.variant_id === first.variant_id));
  });
});

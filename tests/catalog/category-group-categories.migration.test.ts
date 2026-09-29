import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationUrl = new URL(
  "../../db/migrations/20260928_000_category_group_categories.sql",
  import.meta.url,
);

test("category group categories migration preserves the source join-table structure", async () => {
  const migration = (await readFile(migrationUrl, "utf8"))
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  assert.match(migration, /^create table if not exists category_group_categories \(/);
  assert.match(
    migration,
    /group_id bigint not null references category_groups\(id\) on delete cascade/,
  );
  assert.match(
    migration,
    /category_id bigint not null references categories\(id\) on delete cascade/,
  );
  assert.match(migration, /primary key \(group_id, category_id\)/);
});

import { jsonb, pgTable, serial, text } from "drizzle-orm/pg-core";
import { test } from "vitest";

import { drizzleToZero } from "../src";

import { Equal, Expect, expectDeepEqual, ZeroTableSchema } from "./utils";
import { column, JSONValue } from "@rocicorp/zero";

test("pg - basic", (tc) => {
  const table = pgTable("test", {
    id: serial().primaryKey(),
    name: text().notNull(),
    json: jsonb().notNull(),
  });

  const result = drizzleToZero(table, {
    id: true,
    name: true,
    json: true,
  });
  const expected = {
    tableName: "test",
    columns: {
      id: {
        type: "number",
        optional: false,
        customType: null as unknown as number,
      },
      name: {
        type: "string",
        optional: false,
        customType: null as unknown as string,
      },
      json: {
        type: "json",
        optional: false,
        customType: null as unknown as JSONValue,
      },
    },
    primaryKey: "id",
  } as const satisfies ZeroTableSchema;

  expectDeepEqual(result).toEqual(expected);
  Expect<Equal<typeof result.columns.id, typeof expected.columns.id>>;
  Expect<Equal<typeof result.columns.name, typeof expected.columns.name>>;
  Expect<Equal<typeof result.columns.json, typeof expected.columns.json>>;
  Expect<Equal<typeof result.primaryKey, typeof expected.primaryKey>>;
  Expect<Equal<typeof result.tableName, typeof expected.tableName>>;
});

test("pg - custom types", (tc) => {
  const table = pgTable("test", {
    id: text().primaryKey(),
    json: jsonb().$type<{ foo: string }>().notNull(),
  });

  const result = drizzleToZero(table, {
    id: column.string(),
    json: true,
  });

  const expected = {
    tableName: "test",
    columns: {
      id: column.string(),
      json: {
        type: "json",
        optional: false,
        customType: null as unknown as { foo: string },
      },
    },
    primaryKey: "id",
  } as const satisfies ZeroTableSchema;

  expectDeepEqual(result).toEqual(expected);
  Expect<Equal<typeof result.columns.id, typeof expected.columns.id>>;
  Expect<Equal<typeof result.columns.json, typeof expected.columns.json>>;
  Expect<Equal<typeof result.primaryKey, typeof expected.primaryKey>>;
  Expect<Equal<typeof result.tableName, typeof expected.tableName>>;
});

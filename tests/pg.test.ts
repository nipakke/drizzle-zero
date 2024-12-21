import {
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  numeric,
  char,
  uuid,
  varchar,
  boolean,
  date,
  real,
  json,
  smallint,
  integer,
  bigint,
  smallserial,
  bigserial,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { expect, test } from "vitest";

import { tableToZero } from "../src";

import { column, type JSONValue } from "@rocicorp/zero";
import {
  type Equal,
  Expect,
  expectDeepEqual,
  type ZeroTableSchema,
} from "./utils";

test("pg - basic", () => {
  const table = pgTable("test", {
    id: serial().primaryKey(),
    name: text().notNull(),
    json: jsonb().notNull(),
  });

  const result = tableToZero(table, {
    id: true,
    name: true,
    json: true,
  });

  const expected = {
    tableName: "test",
    columns: {
      id: column.number(),
      name: column.string(),
      json: column.json<JSONValue>(),
    },
    primaryKey: "id",
  } as const satisfies ZeroTableSchema;

  expectDeepEqual(result).toEqual(expected);
  Expect<Equal<typeof result, typeof expected>>;
});

test("pg - custom types", () => {
  const table = pgTable("test", {
    id: text().primaryKey(),
    json: jsonb().$type<{ foo: string }>().notNull(),
  });

  const result = tableToZero(table, {
    id: column.string(),
    json: true,
  });

  const expected = {
    tableName: "test",
    columns: {
      id: column.string(),
      json: column.json<{ foo: string }>(),
    },
    primaryKey: "id",
  } as const satisfies ZeroTableSchema;

  expectDeepEqual(result).toEqual(expected);
  Expect<Equal<typeof result, typeof expected>>;
});

test("pg - optional fields", () => {
  const table = pgTable("test", {
    id: serial().primaryKey(),
    name: text(), // optional
    description: text(), // optional
    metadata: jsonb(), // optional
  });

  const result = tableToZero(table, {
    id: true,
    name: true,
    description: true,
    metadata: true,
  });

  const expected = {
    tableName: "test",
    columns: {
      id: column.number(),
      name: column.string(true),
      description: column.string(true),
      metadata: column.json<JSONValue>(true),
    },
    primaryKey: "id",
  } as const satisfies ZeroTableSchema;

  expectDeepEqual(result).toEqual(expected);
  Expect<Equal<typeof result, typeof expected>>;
});

test("pg - array types", () => {
  const table = pgTable("test", {
    id: serial().primaryKey(),
    tags: text().array().notNull(),
    scores: jsonb().array(),
  });

  expect(() =>
    tableToZero(table, {
      id: true,
      tags: true,
      scores: true,
    }),
  ).toThrow("Unsupported column type: array");
});

test("pg - complex custom types", () => {
  type UserMetadata = {
    preferences: {
      theme: "light" | "dark";
      notifications: boolean;
    };
    lastLogin: string;
  };

  const table = pgTable("users", {
    id: serial().primaryKey(),
    metadata: jsonb().$type<UserMetadata>().notNull(),
    settings: jsonb().$type<Record<string, boolean>>(),
  });

  const result = tableToZero(table, {
    id: true,
    metadata: true,
    settings: true,
  });

  const expected = {
    tableName: "users",
    columns: {
      id: column.number(),
      metadata: column.json<UserMetadata>(),
      settings: column.json<Record<string, boolean>>(true),
    },
    primaryKey: "id",
  } as const satisfies ZeroTableSchema;

  expectDeepEqual(result).toEqual(expected);
  Expect<Equal<typeof result, typeof expected>>;
});

test("pg - partial column selection", () => {
  const table = pgTable("test", {
    id: serial().primaryKey(),
    name: text().notNull(),
    age: serial().notNull(),
    metadata: jsonb().notNull(),
  });

  const result = tableToZero(table, {
    id: true,
    metadata: true,
    name: false,
    age: false,
  });

  const expected = {
    tableName: "test",
    columns: {
      id: column.number(),
      metadata: column.json<JSONValue>(),
    },
    primaryKey: "id",
  } as const satisfies ZeroTableSchema;

  expectDeepEqual(result).toEqual(expected);
  Expect<Equal<typeof result, typeof expected>>;
});

test("pg - partial column selection", () => {
  const table = pgTable("test", {
    id: serial().primaryKey(),
    name: text().notNull(),
    age: serial().notNull(),
    metadata: jsonb().notNull(),
  });

  const result = tableToZero(table, {
    id: true,
    metadata: true,
    name: false,
    age: false,
  });

  const expected = {
    tableName: "test",
    columns: {
      id: column.number(),
      metadata: column.json<JSONValue>(),
    },
    primaryKey: "id",
  } as const satisfies ZeroTableSchema;

  expectDeepEqual(result).toEqual(expected);
  Expect<Equal<typeof result, typeof expected>>;
});

test("pg - composite primary key", () => {
  const table = pgTable(
    "composite_test",
    {
      userId: text().notNull(),
      orgId: text().notNull(),
      role: text().notNull(),
    },
    (t) => [primaryKey({ columns: [t.userId, t.orgId] })],
  );

  const result = tableToZero(table, {
    userId: true,
    orgId: true,
    role: true,
  });

  const expected = {
    tableName: "composite_test",
    columns: {
      userId: column.string(),
      orgId: column.string(),
      role: column.string(),
    },
    // this type is erased in drizzle, so we need to cast it
    primaryKey: ["userId", "orgId"] as readonly [string, ...string[]],
  } as const satisfies ZeroTableSchema;

  expectDeepEqual(result).toEqual(expected);
  Expect<Equal<typeof result, typeof expected>>;
});

test("pg - timestamp fields", () => {
  const table = pgTable("events", {
    id: serial().primaryKey(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp(),
    scheduledFor: timestamp().notNull(),
  });

  const result = tableToZero(table, {
    id: true,
    createdAt: true,
    updatedAt: true,
    scheduledFor: true,
  });

  const expected = {
    tableName: "events",
    columns: {
      id: column.number(),
      createdAt: column.string(),
      updatedAt: column.string(true),
      scheduledFor: column.string(),
    },
    primaryKey: "id",
  } as const satisfies ZeroTableSchema;

  expectDeepEqual(result).toEqual(expected);
  Expect<Equal<typeof result, typeof expected>>;
});

test("pg - custom column mapping", () => {
  const table = pgTable("users", {
    id: serial().primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    profileData: jsonb("profile_data").$type<{
      bio: string;
      avatar: string;
    }>(),
  });

  const result = tableToZero(table, {
    id: true,
    firstName: true,
    lastName: true,
    profileData: true,
  });

  const expected = {
    tableName: "users",
    columns: {
      id: column.number(),
      firstName: column.string(),
      lastName: column.string(),
      profileData: column.json<{
        bio: string;
        avatar: string;
      }>(true),
    },
    primaryKey: "id",
  } as const satisfies ZeroTableSchema;

  expectDeepEqual(result).toEqual(expected);
  Expect<Equal<typeof result, typeof expected>>;
});

test("pg - enum field", () => {
  const roleEnum = pgEnum("user_role", ["admin", "user", "guest"]);

  const table = pgTable("users", {
    id: serial().primaryKey(),
    role: roleEnum().notNull(),
    backupRole: roleEnum(),
  });

  const result = tableToZero(table, {
    id: true,
    role: true,
    backupRole: true,
  });

  const expected = {
    tableName: "users",
    columns: {
      id: column.number(),
      role: column.enumeration<"admin" | "user" | "guest">(),
      backupRole: column.enumeration<"admin" | "user" | "guest">(true),
    },
    primaryKey: "id",
  } as const satisfies ZeroTableSchema;

  expectDeepEqual(result).toEqual(expected);
  Expect<Equal<typeof result, typeof expected>>;
});

test("pg - simple enum field", () => {
  const moodEnum = pgEnum("mood_type", ["happy", "sad", "ok"]);

  const table = pgTable("users", {
    id: text().primaryKey(),
    name: text().notNull(),
    mood: moodEnum().notNull(),
  });

  const result = tableToZero(table, {
    id: true,
    name: true,
    mood: true,
  });

  const expected = {
    tableName: "users",
    columns: {
      id: column.string(),
      name: column.string(),
      mood: column.enumeration<"happy" | "sad" | "ok">(),
    },
    primaryKey: "id",
  } as const satisfies ZeroTableSchema;

  expectDeepEqual(result).toEqual(expected);
  Expect<Equal<typeof result, typeof expected>>;
});

test("pg - all supported data types", () => {
  const statusEnum = pgEnum("status_type", ["active", "inactive", "pending"]);

  const table = pgTable("all_types", {
    // Integer types
    id: serial("id").primaryKey(),
    smallint: smallint("smallint").notNull(),
    integer: integer("integer").notNull(),
    bigint: bigint("bigint", { mode: "number" }).notNull(),

    // Serial types
    smallSerial: smallserial("smallserial").notNull(),
    regularSerial: serial("regular_serial").notNull(),
    bigSerial: bigserial("bigserial", { mode: "number" }).notNull(),

    // Arbitrary precision types
    numeric: numeric("numeric", { precision: 10, scale: 2 }).notNull(),
    decimal: numeric("decimal", { precision: 10, scale: 2 }).notNull(),

    // Floating-point types
    real: real("real").notNull(),
    doublePrecision: doublePrecision("double_precision").notNull(),

    // String types
    name: text().notNull(),
    code: char().notNull(),
    identifier: uuid().notNull(),
    description: varchar().notNull(),
    isActive: boolean().notNull(),
    createdAt: timestamp().notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull(),
    birthDate: date().notNull(),
    metadata: jsonb().notNull(),
    settings: json().$type<{ theme: string; fontSize: number }>().notNull(),
    status: statusEnum().notNull(),

    // Optional variants
    optionalSmallint: smallint("optional_smallint"),
    optionalInteger: integer("optional_integer"),
    optionalBigint: bigint("optional_bigint", { mode: "number" }),
    optionalNumeric: numeric("optional_numeric", { precision: 10, scale: 2 }),
    optionalReal: real("optional_real"),
    optionalDoublePrecision: doublePrecision("optional_double_precision"),
    optionalText: text(),
    optionalBoolean: boolean(),
    optionalDate: timestamp(),
    optionalJson: jsonb(),
    optionalEnum: statusEnum(),
  });

  const result = tableToZero(table, {
    id: true,
    smallint: true,
    integer: true,
    bigint: true,
    smallSerial: true,
    regularSerial: true,
    bigSerial: true,
    numeric: true,
    decimal: true,
    real: true,
    doublePrecision: true,
    name: true,
    code: true,
    identifier: true,
    description: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
    birthDate: true,
    metadata: true,
    settings: true,
    status: true,
    optionalSmallint: true,
    optionalInteger: true,
    optionalBigint: true,
    optionalNumeric: true,
    optionalReal: true,
    optionalDoublePrecision: true,
    optionalText: true,
    optionalBoolean: true,
    optionalDate: true,
    optionalJson: true,
    optionalEnum: true,
  });

  const expected = {
    tableName: "all_types",
    columns: {
      // Integer types
      id: column.number(),
      smallint: column.number(),
      integer: column.number(),
      bigint: column.number(),

      // Serial types
      smallSerial: column.number(),
      regularSerial: column.number(),
      bigSerial: column.number(),

      // Arbitrary precision types
      numeric: column.number(),
      decimal: column.number(),

      // Floating-point types
      real: column.number(),
      doublePrecision: column.number(),

      // Rest of the types
      name: column.string(),
      code: column.string(),
      identifier: column.string(),
      description: column.string(),
      isActive: column.boolean(),
      createdAt: column.string(),
      updatedAt: column.string(),
      birthDate: column.string(),
      metadata: column.json<JSONValue>(),
      settings: column.json<{ theme: string; fontSize: number }>(),
      status: column.enumeration<"active" | "inactive" | "pending">(),

      // Optional variants
      optionalSmallint: column.number(true),
      optionalInteger: column.number(true),
      optionalBigint: column.number(true),
      optionalNumeric: column.number(true),
      optionalReal: column.number(true),
      optionalDoublePrecision: column.number(true),
      optionalText: column.string(true),
      optionalBoolean: column.boolean(true),
      optionalDate: column.string(true),
      optionalJson: column.json<JSONValue>(true),
      optionalEnum: column.enumeration<"active" | "inactive" | "pending">(true),
    },
    primaryKey: "id",
  } as const satisfies ZeroTableSchema;

  expectDeepEqual(result).toEqual(expected);
  Expect<Equal<typeof result, typeof expected>>;
});

test("pg - override column json type", () => {
  const table = pgTable("metrics", {
    id: serial().primaryKey(),
    metadata: jsonb().notNull(),
  });

  const result = tableToZero(table, {
    id: true,
    metadata: column.json<{ amount: number; currency: string }>(),
  });

  const expected = {
    tableName: "metrics",
    columns: {
      id: column.number(),
      metadata: column.json<{ amount: number; currency: string }>(),
    },
    primaryKey: "id",
  } as const satisfies ZeroTableSchema;

  expectDeepEqual(result).toEqual(expected);
  Expect<Equal<typeof result, typeof expected>>;
});

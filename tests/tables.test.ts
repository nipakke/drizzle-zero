import { column, type JSONValue } from "@rocicorp/zero";
import {
  bigint,
  bigserial,
  boolean,
  char,
  date,
  doublePrecision,
  integer,
  json,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  serial,
  smallint,
  smallserial,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { expect, test, describe } from "vitest";
import { createZeroTableSchema, type ColumnsConfig } from "../src";
import {
  type Equal,
  Expect,
  expectTableSchemaDeepEqual,
  type ZeroTableSchema,
} from "./utils";

describe.concurrent("tables", () => {
  test("pg - basic", () => {
    const table = pgTable("test", {
      id: serial().primaryKey(),
      name: text().notNull(),
      json: jsonb().notNull(),
    });

    const result = createZeroTableSchema(table, {
      id: true,
      name: true,
      json: true,
    });

    const expected = {
      tableName: "test",
      columns: {
        id: {
          type: "number",
          optional: true,
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
      primaryKey: ["id"],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
    Expect<Equal<typeof result, typeof expected>>;
  });

  test("pg - named fields", () => {
    const table = pgTable("test", {
      id: serial("custom_id").primaryKey(),
      name: text("custom_name").notNull(),
    });

    const result = createZeroTableSchema(table, {
      custom_id: true,
      custom_name: true,
    });

    const expected = {
      tableName: "test",
      columns: {
        custom_id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        custom_name: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["custom_id"],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
    Expect<Equal<typeof result, typeof expected>>;
  });

  test("pg - custom types", () => {
    const table = pgTable("test", {
      id: text().primaryKey(),
      json: jsonb().$type<{ foo: string }>().notNull(),
    });

    const result = createZeroTableSchema(table, {
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
      primaryKey: ["id"],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
    Expect<Equal<typeof result, typeof expected>>;
  });

  test("pg - optional fields", () => {
    const table = pgTable("test", {
      id: serial().primaryKey(),
      name: text(), // optional
      description: text(), // optional
      metadata: jsonb(), // optional
    });

    const result = createZeroTableSchema(table, {
      id: true,
      name: true,
      description: true,
      metadata: true,
    });

    const expected = {
      tableName: "test",
      columns: {
        id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        name: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        description: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        metadata: {
          type: "json",
          optional: true,
          customType: null as unknown as JSONValue,
        },
      },
      primaryKey: ["id"],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
    Expect<Equal<typeof result, typeof expected>>;
  });

  test("pg - array types", () => {
    const table = pgTable("test", {
      id: serial().primaryKey(),
      tags: text().array().notNull(),
      scores: jsonb().array(),
    });

    expect(() =>
      createZeroTableSchema(table, {
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

    const result = createZeroTableSchema(table, {
      id: true,
      metadata: true,
      settings: true,
    });

    const expected = {
      tableName: "users",
      columns: {
        id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        metadata: {
          type: "json",
          optional: false,
          customType: null as unknown as UserMetadata,
        },
        settings: {
          type: "json",
          optional: true,
          customType: null as unknown as Record<string, boolean>,
        },
      },
      primaryKey: ["id"],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
    Expect<Equal<typeof result, typeof expected>>;
  });

  test("pg - partial column selection", () => {
    const table = pgTable("test", {
      id: serial().primaryKey(),
      name: text().notNull(),
      age: serial().notNull(),
      metadata: jsonb().notNull(),
    });

    const result = createZeroTableSchema(table, {
      id: true,
      metadata: true,
      name: false,
      age: false,
    });

    const expected = {
      tableName: "test",
      columns: {
        id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        metadata: {
          type: "json",
          optional: false,
          customType: null as unknown as JSONValue,
        },
      },
      primaryKey: ["id"],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
    Expect<Equal<typeof result, typeof expected>>;
  });

  test("pg - partial column selection with omit", () => {
    const table = pgTable("test", {
      id: serial().primaryKey(),
      name: text().notNull(),
      age: serial().notNull(),
      metadata: jsonb().notNull(),
    });

    const result = createZeroTableSchema(table, {
      id: true,
      name: true,
    });

    const expected = {
      tableName: "test",
      columns: {
        id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        name: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
    Expect<Equal<typeof result, typeof expected>>;
  });

  test("pg - partial column selection with false", () => {
    const table = pgTable("test", {
      id: serial().primaryKey(),
      name: text().notNull(),
      age: serial().notNull(),
      metadata: jsonb().notNull(),
    });

    const result = createZeroTableSchema(table, {
      id: true,
      metadata: true,
      age: false,
      name: false,
    });

    const expected = {
      tableName: "test",
      columns: {
        id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        metadata: {
          type: "json",
          optional: false,
          customType: null as unknown as JSONValue,
        },
      },
      primaryKey: ["id"],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
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

    const result = createZeroTableSchema(table, {
      userId: true,
      orgId: true,
      role: true,
    });

    const expected = {
      tableName: "composite_test",
      columns: {
        userId: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        orgId: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        role: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
      },
      // this type is erased in drizzle, so we need to cast it
      primaryKey: ["userId", "orgId"] as readonly [string, ...string[]],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
    Expect<Equal<typeof result, typeof expected>>;
  });

  test("pg - timestamp fields", () => {
    const table = pgTable("events", {
      id: serial().primaryKey(),
      createdAt: timestamp().notNull().defaultNow(),
      updatedAt: timestamp(),
      scheduledFor: timestamp().notNull(),
    });

    const result = createZeroTableSchema(table, {
      id: true,
      createdAt: true,
      updatedAt: true,
      scheduledFor: true,
    });

    const expected = {
      tableName: "events",
      columns: {
        id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        createdAt: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        updatedAt: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        scheduledFor: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
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

    const result = createZeroTableSchema(table, {
      id: true,
      first_name: true,
      last_name: true,
      profile_data: true,
    });

    // result.

    const expected = {
      tableName: "users",
      columns: {
        id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        first_name: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        last_name: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        profile_data: {
          type: "json",
          optional: true,
          customType: null as unknown as {
            bio: string;
            avatar: string;
          },
        },
      },
      primaryKey: ["id"],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
    Expect<Equal<typeof result, typeof expected>>;
  });

  test("pg - enum field", () => {
    const roleEnum = pgEnum("user_role", ["admin", "user", "guest"]);

    const table = pgTable("users", {
      id: serial().primaryKey(),
      role: roleEnum().notNull(),
      backupRole: roleEnum(),
    });

    const result = createZeroTableSchema(table, {
      id: true,
      role: true,
      backupRole: true,
    });

    const expected = {
      tableName: "users",
      columns: {
        id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        role: {
          type: "string",
          optional: false,
          customType: null as unknown as "admin" | "user" | "guest",
          kind: "enum",
        },
        backupRole: {
          type: "string",
          optional: true,
          customType: null as unknown as "admin" | "user" | "guest",
          kind: "enum",
        },
      },
      primaryKey: ["id"],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
    Expect<Equal<typeof result, typeof expected>>;
  });

  test("pg - simple enum field", () => {
    const moodEnum = pgEnum("mood_type", ["happy", "sad", "ok"]);

    const table = pgTable("users", {
      id: text().primaryKey(),
      name: text().notNull(),
      mood: moodEnum().notNull(),
    });

    const result = createZeroTableSchema(table, {
      id: true,
      name: true,
      mood: true,
    });

    const expected = {
      tableName: "users",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        name: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        mood: {
          type: "string",
          optional: false,
          customType: null as unknown as "happy" | "sad" | "ok",
          kind: "enum",
        },
      },
      primaryKey: ["id"],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
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
      optionalText: text("optional_text"),
      optionalBoolean: boolean("optional_boolean"),
      optionalDate: timestamp("optional_date"),
      optionalJson: jsonb("optional_json"),
      optionalEnum: statusEnum("optional_enum"),
    });

    table.smallSerial._.hasDefault;

    const result = createZeroTableSchema(table, {
      id: true,
      smallint: true,
      integer: true,
      bigint: true,
      smallserial: true,
      regular_serial: true,
      bigserial: true,
      numeric: true,
      decimal: true,
      real: true,
      double_precision: true,
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
      optional_smallint: true,
      optional_integer: true,
      optional_bigint: true,
      optional_numeric: true,
      optional_real: true,
      optional_double_precision: true,
      optional_text: true,
      optional_boolean: true,
      optional_date: true,
      optional_json: true,
      optional_enum: true,
    });

    const expected = {
      tableName: "all_types",
      columns: {
        // Integer types
        id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        smallint: {
          type: "number",
          optional: false,
          customType: null as unknown as number,
        },
        integer: {
          type: "number",
          optional: false,
          customType: null as unknown as number,
        },
        bigint: {
          type: "number",
          optional: false,
          customType: null as unknown as number,
        },

        // Serial types
        smallserial: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        regular_serial: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        bigserial: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },

        // Arbitrary precision types
        numeric: {
          type: "number",
          optional: false,
          customType: null as unknown as number,
        },
        decimal: {
          type: "number",
          optional: false,
          customType: null as unknown as number,
        },

        // Floating-point types
        real: {
          type: "number",
          optional: false,
          customType: null as unknown as number,
        },
        double_precision: {
          type: "number",
          optional: false,
          customType: null as unknown as number,
        },

        // Rest of the types
        name: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        code: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        identifier: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        description: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        isActive: {
          type: "boolean",
          optional: false,
          customType: null as unknown as boolean,
        },
        createdAt: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        updatedAt: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        birthDate: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        metadata: {
          type: "json",
          optional: false,
          customType: null as unknown as JSONValue,
        },
        settings: {
          type: "json",
          optional: false,
          customType: null as unknown as { theme: string; fontSize: number },
        },
        status: {
          type: "string",
          optional: false,
          customType: null as unknown as "active" | "inactive" | "pending",
          kind: "enum",
        },

        // Optional variants
        optional_smallint: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        optional_integer: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        optional_bigint: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        optional_numeric: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        optional_real: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        optional_double_precision: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        optional_text: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        optional_boolean: {
          type: "boolean",
          optional: true,
          customType: null as unknown as boolean,
        },
        optional_date: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        optional_json: {
          type: "json",
          optional: true,
          customType: null as unknown as JSONValue,
        },
        optional_enum: {
          type: "string",
          optional: true,
          customType: null as unknown as "active" | "inactive" | "pending",
          kind: "enum",
        },
      },
      primaryKey: ["id"],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
    Expect<Equal<typeof result, typeof expected>>;
  });

  test("pg - override column json type", () => {
    const table = pgTable("metrics", {
      id: serial().primaryKey(),
      metadata: jsonb().notNull(),
    });

    const result = createZeroTableSchema(table, {
      id: true,
      metadata: column.json<{ amount: number; currency: string }>(),
    });

    const expected = {
      tableName: "metrics",
      columns: {
        id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        metadata: column.json<{ amount: number; currency: string }>(),
      },
      primaryKey: ["id"],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
    Expect<Equal<typeof result, typeof expected>>;
  });

  test("pg - compound primary key with serial", () => {
    const table = pgTable(
      "order_items",
      {
        orderId: serial().notNull(),
        productId: text().notNull(),
        quantity: integer().notNull(),
        price: numeric().notNull(),
      },
      (t) => [primaryKey({ columns: [t.orderId, t.productId] })],
    );

    const result = createZeroTableSchema(table, {
      orderId: true,
      productId: true,
      quantity: true,
      price: true,
    });

    const expected = {
      tableName: "order_items",
      columns: {
        orderId: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        productId: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        quantity: {
          type: "number",
          optional: false,
          customType: null as unknown as number,
        },
        price: {
          type: "number",
          optional: false,
          customType: null as unknown as number,
        },
      },
      primaryKey: ["orderId", "productId"] as readonly [string, ...string[]],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
    Expect<Equal<typeof result, typeof expected>>;
  });

  test("pg - default values", () => {
    const table = pgTable("items", {
      id: serial().primaryKey(),
      name: text().notNull().default("unnamed"),
      isActive: boolean().notNull().default(true),
      score: integer().notNull().default(0),
      optionalScore: integer().default(0),
      currentDate: text()
        .notNull()
        .$default(() => new Date().toISOString()),
      optionalCurrentDate: text().$default(() => new Date().toISOString()),
    });

    const result = createZeroTableSchema(table, {
      id: true,
      name: true,
      isActive: true,
      score: true,
      optionalScore: true,
      currentDate: true,
      optionalCurrentDate: true,
    });

    const expected = {
      tableName: "items",
      columns: {
        id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        name: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        isActive: {
          type: "boolean",
          optional: true,
          customType: null as unknown as boolean,
        },
        score: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        optionalScore: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        currentDate: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        optionalCurrentDate: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
    Expect<Equal<typeof result, typeof expected>>;
  });

  test("pg - mixed required and optional json fields", () => {
    type ComplexMetadata = {
      required: {
        version: number;
        features: string[];
      };
      optional?: {
        preferences: Record<string, unknown>;
        lastAccessed?: string;
      };
    };

    const table = pgTable("configs", {
      id: serial().primaryKey(),
      requiredJson: jsonb().$type<{ key: string }>().notNull(),
      optionalJson: jsonb().$type<ComplexMetadata>(),
      mixedJson: json()
        .$type<{ required: number; optional?: string }>()
        .notNull(),
    });

    const result = createZeroTableSchema(table, {
      id: true,
      requiredJson: true,
      optionalJson: true,
      mixedJson: true,
    });

    const expected = {
      tableName: "configs",
      columns: {
        id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        requiredJson: {
          type: "json",
          optional: false,
          customType: null as unknown as { key: string },
        },
        optionalJson: {
          type: "json",
          optional: true,
          customType: null as unknown as ComplexMetadata,
        },
        mixedJson: {
          type: "json",
          optional: false,
          customType: null as unknown as {
            required: number;
            optional?: string;
          },
        },
      },
      primaryKey: ["id"],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
    Expect<Equal<typeof result, typeof expected>>;
  });

  test("pg - custom column selection with type overrides", () => {
    const table = pgTable("products", {
      id: serial().primaryKey(),
      name: text().notNull(),
      description: text(),
      metadata: jsonb().$type<Record<string, unknown>>(),
    });

    const result = createZeroTableSchema(table, {
      id: true,
      name: column.string(true),
      description: column.string(),
      metadata: column.json<{ category: string; tags: string[] }>(true),
    });

    const expected = {
      tableName: "products",
      columns: {
        id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        name: column.string(true),
        description: column.string(),
        metadata: column.json<{ category: string; tags: string[] }>(true),
      },
      primaryKey: ["id"],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
    Expect<Equal<typeof result, typeof expected>>;
  });

  test("pg - override enum column", () => {
    const enumType = pgEnum("status", ["active", "inactive", "pending"]);

    const table = pgTable("products", {
      id: serial().primaryKey(),
      status: enumType("enum_status"),
    });

    const result = createZeroTableSchema(table, {
      id: true,
      enum_status: column.enumeration<"active" | "inactive" | "pending">(true),
    });

    const expected = {
      tableName: "products",
      columns: {
        id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        enum_status: column.enumeration<"active" | "inactive" | "pending">(
          true,
        ),
      },
      primaryKey: ["id"],
    } as const satisfies ZeroTableSchema;

    expectTableSchemaDeepEqual(result).toEqual(expected);
    Expect<
      Equal<
        typeof result.columns.enum_status,
        typeof expected.columns.enum_status
      >
    >;
  });

  test("pg - invalid column selection", () => {
    const table = pgTable("test", {
      id: serial().primaryKey(),
      invalid: text().notNull(),
    });

    expect(() =>
      createZeroTableSchema(table, {
        id: true,
        invalid: "someinvalidtype",
      } as unknown as ColumnsConfig<typeof table>),
    ).toThrow();
  });

  test("pg - no primary key", () => {
    const table = pgTable("test", {
      id: serial(),
      name: text(),
    });

    expect(() =>
      createZeroTableSchema(table, {
        id: true,
        name: true,
      } as unknown as ColumnsConfig<typeof table>),
    ).toThrow();
  });
});

import {
  boolean,
  enumeration,
  json,
  number,
  string,
  table,
} from "@rocicorp/zero";
import { mysqlTable, text as textMysql } from "drizzle-orm/mysql-core";
import {
  bigint,
  bigserial,
  char,
  cidr,
  date,
  doublePrecision,
  geometry,
  inet,
  integer,
  interval,
  jsonb,
  line,
  macaddr,
  numeric,
  boolean as pgBoolean,
  pgEnum,
  json as pgJson,
  pgSchema,
  pgTable,
  point,
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
import { createZeroTableBuilder, type ColumnsConfig } from "../src";
import { assertEqual, expectTableSchemaDeepEqual } from "./utils";
import { describe, test } from "vitest";

describe.concurrent("tables", () => {
  test("pg - basic", () => {
    const testTable = pgTable("test", {
      id: text().primaryKey(),
      name: text().notNull(),
      json: jsonb().notNull(),
    });

    const result = createZeroTableBuilder(testTable, {
      id: true,
      name: true,
      json: true,
    });

    const expected = table("test")
      .columns({
        id: string(),
        name: string(),
        json: json(),
      })
      .primaryKey("id");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - named fields", () => {
    const testTable = pgTable("test", {
      id: text("custom_id").primaryKey(),
      name: text("custom_name").notNull(),
    });

    const result = createZeroTableBuilder(testTable, {
      custom_id: true,
      custom_name: true,
    });

    const expected = table("test")
      .columns({
        custom_id: string(),
        custom_name: string(),
      })
      .primaryKey("custom_id");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - custom types", () => {
    const testTable = pgTable("test", {
      id: text().primaryKey(),
      json: jsonb().$type<{ foo: string }>().notNull(),
    });

    const result = createZeroTableBuilder(testTable, {
      id: string(),
      json: true,
    });

    const expected = table("test")
      .columns({
        id: string(),
        json: json<{ foo: string }>(),
      })
      .primaryKey("id");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - optional fields", () => {
    const testTable = pgTable("test", {
      id: text().primaryKey(),
      name: text(), // optional
      description: text(), // optional
      metadata: jsonb(), // optional
    });

    const result = createZeroTableBuilder(testTable, {
      id: true,
      name: true,
      description: true,
      metadata: true,
    });

    const expected = table("test")
      .columns({
        id: string(),
        name: string().optional(),
        description: string().optional(),
        metadata: json().optional(),
      })
      .primaryKey("id");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - complex custom types", () => {
    type UserMetadata = {
      preferences: {
        theme: "light" | "dark";
        notifications: boolean;
      };
      lastLogin: string;
    };

    const testTable = pgTable("users", {
      id: text().primaryKey(),
      metadata: jsonb().$type<UserMetadata>().notNull(),
      settings: jsonb().$type<Record<string, boolean>>(),
    });

    const result = createZeroTableBuilder(testTable, {
      id: true,
      metadata: true,
      settings: true,
    });

    const expected = table("users")
      .columns({
        id: string(),
        metadata: json<UserMetadata>(),
        settings: json<Record<string, boolean>>().optional(),
      })
      .primaryKey("id");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - partial column selection", () => {
    const testTable = pgTable("test", {
      id: text().primaryKey(),
      name: text().notNull(),
      age: serial().notNull(),
      metadata: jsonb().notNull(),
    });

    const result = createZeroTableBuilder(testTable, {
      id: true,
      metadata: true,
      name: false,
      age: false,
    });

    const expected = table("test")
      .columns({
        id: string(),
        metadata: json(),
      })
      .primaryKey("id");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - partial column selection with omit", () => {
    const testTable = pgTable("test", {
      id: text().primaryKey(),
      name: text().notNull(),
      age: serial().notNull(),
      metadata: jsonb().notNull(),
    });

    const result = createZeroTableBuilder(testTable, {
      id: true,
      name: true,
    });

    const expected = table("test")
      .columns({
        id: string(),
        name: string(),
      })
      .primaryKey("id");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - partial column selection with false", () => {
    const testTable = pgTable("test", {
      id: text().primaryKey(),
      name: text().notNull(),
      age: serial().notNull(),
      metadata: jsonb().notNull(),
    });

    const result = createZeroTableBuilder(testTable, {
      id: true,
      metadata: true,
      age: false,
      name: false,
    });

    const expected = table("test")
      .columns({
        id: string(),
        metadata: json(),
      })
      .primaryKey("id");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - composite primary key", () => {
    const testTable = pgTable(
      "composite_test",
      {
        userId: text().notNull(),
        orgId: text().notNull(),
        role: text().notNull(),
      },
      (t) => [primaryKey({ columns: [t.userId, t.orgId] })],
    );

    const result = createZeroTableBuilder(testTable, {
      userId: true,
      orgId: true,
      role: true,
    });

    const expected = table("composite_test")
      .columns({
        userId: string(),
        orgId: string(),
        role: string(),
      })
      .primaryKey("userId", "orgId");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - timestamp fields", () => {
    const testTable = pgTable("events", {
      id: text().primaryKey(),
      createdAt: timestamp().notNull().defaultNow(),
      updatedAt: timestamp(),
      scheduledFor: timestamp().notNull(),
      scheduledForTz: timestamp({ withTimezone: true }),
      precision: timestamp({ precision: 2 }),
      timestampModeString: timestamp({ mode: "string" }),
      timestampModeDate: timestamp({ mode: "date" }),
    });

    const result = createZeroTableBuilder(testTable, {
      id: true,
      createdAt: true,
      updatedAt: true,
      scheduledFor: true,
      scheduledForTz: true,
      precision: true,
      timestampModeString: true,
      timestampModeDate: true,
    });

    const expected = table("events")
      .columns({
        id: string(),
        createdAt: number().optional(),
        updatedAt: number().optional(),
        scheduledFor: number(),
        scheduledForTz: number().optional(),
        precision: number().optional(),
        timestampModeString: number().optional(),
        timestampModeDate: number().optional(),
      })
      .primaryKey("id");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - custom column mapping", () => {
    const testTable = pgTable("users", {
      id: text().primaryKey(),
      firstName: text("first_name").notNull(),
      lastName: text("last_name").notNull(),
      profileData: jsonb("profile_data").$type<{
        bio: string;
        avatar: string;
      }>(),
    });

    const result = createZeroTableBuilder(testTable, {
      id: true,
      first_name: true,
      last_name: true,
      profile_data: true,
    });

    const expected = table("users")
      .columns({
        id: string(),
        first_name: string(),
        last_name: string(),
        profile_data: json<{ bio: string; avatar: string }>().optional(),
      })
      .primaryKey("id");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - enum field", () => {
    const roleEnum = pgEnum("user_role", ["admin", "user", "guest"]);

    const testTable = pgTable("users", {
      id: text().primaryKey(),
      role: roleEnum().notNull(),
      backupRole: roleEnum(),
    });

    const result = createZeroTableBuilder(testTable, {
      id: true,
      role: true,
      backupRole: true,
    });

    const expected = table("users")
      .columns({
        id: string(),
        role: enumeration<"admin" | "user" | "guest">(),
        backupRole: enumeration<"admin" | "user" | "guest">().optional(),
      })
      .primaryKey("id");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - simple enum field", () => {
    const moodEnum = pgEnum("mood_type", ["happy", "sad", "ok"]);

    const testTable = pgTable("users", {
      id: text().primaryKey(),
      name: text().notNull(),
      mood: moodEnum().notNull(),
    });

    const result = createZeroTableBuilder(testTable, {
      id: true,
      name: true,
      mood: true,
    });

    const expected = table("users")
      .columns({
        id: string(),
        name: string(),
        mood: enumeration<"happy" | "sad" | "ok">(),
      })
      .primaryKey("id");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - all supported data types", () => {
    const statusEnum = pgEnum("status_type", ["active", "inactive", "pending"]);

    const testTable = pgTable("all_types", {
      // Integer types
      id: text("id").primaryKey(),
      smallint: smallint("smallint").notNull(),
      integer: integer("integer").notNull(),
      bigint: bigint("bigint", { mode: "bigint" }).notNull(),
      bigint_number: bigint("bigint_number", { mode: "number" }).notNull(),

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
      isActive: pgBoolean().notNull(),
      createdAt: timestamp().notNull(),
      updatedAt: timestamp({ withTimezone: true }).notNull(),
      birthDate: date().notNull(),
      dateString: date({ mode: "string" }).notNull(),
      metadata: jsonb().notNull(),
      settings: pgJson().$type<{ theme: string; fontSize: number }>().notNull(),
      status: statusEnum().notNull(),

      // Optional variants
      optionalSmallint: smallint("optional_smallint"),
      optionalInteger: integer("optional_integer"),
      optionalBigint: bigint("optional_bigint", { mode: "number" }),
      optionalNumeric: numeric("optional_numeric", { precision: 10, scale: 2 }),
      optionalDecimal: numeric("optional_decimal", { precision: 10, scale: 2 }),
      optionalReal: real("optional_real"),
      optionalDoublePrecision: doublePrecision("optional_double_precision"),
      optionalText: text("optional_text"),
      optionalBoolean: pgBoolean("optional_boolean"),
      optionalTimestamp: timestamp("optional_timestamp"),
      optionalDate: date("optional_date"),
      optionalJson: jsonb("optional_json"),
      optionalEnum: statusEnum("optional_enum"),
    });

    const result = createZeroTableBuilder(testTable, {
      id: true,
      smallint: true,
      integer: true,
      bigint: true,
      bigint_number: true,
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
      dateString: true,
      metadata: true,
      settings: true,
      status: true,
      optional_smallint: true,
      optional_integer: true,
      optional_bigint: true,
      optional_numeric: true,
      optional_decimal: true,
      optional_real: true,
      optional_double_precision: true,
      optional_text: true,
      optional_boolean: true,
      optional_timestamp: true,
      optional_date: true,
      optional_json: true,
      optional_enum: true,
    });

    const expected = table("all_types")
      .columns({
        id: string(),
        smallint: number(),
        integer: number(),
        bigint: number(),
        bigint_number: number(),
        smallserial: number().optional(),
        regular_serial: number().optional(),
        bigserial: number().optional(),
        numeric: number(),
        decimal: number(),
        real: number(),
        double_precision: number(),
        name: string(),
        code: string(),
        identifier: string(),
        description: string(),
        isActive: boolean(),
        createdAt: number(),
        updatedAt: number(),
        birthDate: number(),
        dateString: number(),
        metadata: json(),
        settings: json<{ theme: string; fontSize: number }>(),
        status: enumeration<"active" | "inactive" | "pending">(),
        optional_smallint: number().optional(),
        optional_integer: number().optional(),
        optional_bigint: number().optional(),
        optional_numeric: number().optional(),
        optional_decimal: number().optional(),
        optional_real: number().optional(),
        optional_double_precision: number().optional(),
        optional_text: string().optional(),
        optional_boolean: boolean().optional(),
        optional_timestamp: number().optional(),
        optional_date: number().optional(),
        optional_json: json().optional(),
        optional_enum: enumeration<
          "active" | "inactive" | "pending"
        >().optional(),
      })
      .primaryKey("id");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - override column json type", () => {
    const testTable = pgTable("metrics", {
      id: text().primaryKey(),
      metadata: jsonb().notNull(),
    });

    const result = createZeroTableBuilder(testTable, {
      id: true,
      metadata: json<{ amount: number; currency: string }>().optional(),
    });

    const expected = table("metrics")
      .columns({
        id: string(),
        metadata: json<{ amount: number; currency: string }>().optional(),
      })
      .primaryKey("id");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - compound primary key", () => {
    const testTable = pgTable(
      "order_items",
      {
        orderId: text().notNull(),
        productId: text().notNull(),
        quantity: integer().notNull(),
        price: numeric().notNull(),
      },
      (t) => [primaryKey({ columns: [t.orderId, t.productId] })],
    );

    const result = createZeroTableBuilder(testTable, {
      orderId: true,
      productId: true,
      quantity: true,
      price: true,
    });

    const expected = table("order_items")
      .columns({
        orderId: string(),
        productId: string(),
        quantity: number(),
        price: number(),
      })
      .primaryKey("orderId", "productId");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - default values", () => {
    const testTable = pgTable("items", {
      id: text().primaryKey(),
      name: text().notNull().default("unnamed"),
      isActive: pgBoolean().notNull().default(true),
      score: integer().notNull().default(0),
      optionalScore: integer().default(0),
      currentDateWithRuntimeDefault: text()
        .notNull()
        .$default(() => new Date().toISOString()),
      optionalCurrentDateWithRuntimeDefault: text().$default(() =>
        new Date().toISOString(),
      ),
    });

    const result = createZeroTableBuilder(testTable, {
      id: true,
      name: true,
      isActive: true,
      score: true,
      optionalScore: true,
      currentDateWithRuntimeDefault: true,
      optionalCurrentDateWithRuntimeDefault: true,
    });

    const expected = table("items")
      .columns({
        id: string(),
        name: string().optional(),
        isActive: boolean().optional(),
        score: number().optional(),
        optionalScore: number().optional(),
        currentDateWithRuntimeDefault: string(),
        optionalCurrentDateWithRuntimeDefault: string().optional(),
      })
      .primaryKey("id");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - mixed required and optional json fields", () => {
    type ComplexMetadata = {
      required: {
        version: number;
        features: string[];
      };
      optional?: {
        preferences: Record<string, string>;
        lastAccessed?: string;
      };
    };

    const testTable = pgTable("configs", {
      id: text().primaryKey(),
      requiredJson: jsonb().$type<{ key: string }>().notNull(),
      optionalJson: jsonb().$type<ComplexMetadata>(),
      mixedJson: pgJson()
        .$type<{ required: number; optional?: string }>()
        .notNull(),
    });

    const result = createZeroTableBuilder(testTable, {
      id: true,
      requiredJson: true,
      optionalJson: true,
      mixedJson: true,
    });

    const expected = table("configs")
      .columns({
        id: string(),
        requiredJson: json<{ key: string }>(),
        optionalJson: json<ComplexMetadata>().optional(),
        mixedJson: json<{ required: number; optional?: string }>(),
      })
      .primaryKey("id");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - custom column selection with type overrides", () => {
    const testTable = pgTable("products", {
      id: text().primaryKey(),
      name: text().notNull(),
      description: text(),
      metadata: jsonb().$type<Record<string, unknown>>(),
    });

    const result = createZeroTableBuilder(testTable, {
      id: true,
      name: string<"typed-value">(),
      description: string<"typed-value-2">().optional(),
      metadata: json<{ category: string; tags: string[] }>().optional(),
    });

    const expected = table("products")
      .columns({
        id: string(),
        name: string<"typed-value">(),
        description: string<"typed-value-2">().optional(),
        metadata: json<{ category: string; tags: string[] }>().optional(),
      })
      .primaryKey("id");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - override enum column", () => {
    const enumType = pgEnum("status", ["active", "inactive", "pending"]);

    const testTable = pgTable("products", {
      id: text().primaryKey(),
      status: enumType("enum_status"),
    });

    const result = createZeroTableBuilder(testTable, {
      id: true,
      enum_status: enumeration<"active" | "inactive">(),
    });

    const expected = table("products")
      .columns({
        id: string(),
        enum_status: enumeration<"active" | "inactive">(),
      })
      .primaryKey("id");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - custom schema", () => {
    const customSchema = pgSchema("custom_schema");

    const testTable = customSchema.table("products", {
      id: text("custom_id").primaryKey(),
      name: text("custom_name").notNull(),
    });

    const result = createZeroTableBuilder(testTable, {
      custom_id: true,
      custom_name: true,
    });

    const expected = table("products")
      .columns({
        custom_id: string(),
        custom_name: string(),
      })
      .primaryKey("custom_id");

    expectTableSchemaDeepEqual(result.build()).toEqual(expected.build());
    assertEqual(result, expected);
  });

  test("pg - invalid column type", ({ expect }) => {
    const testTable = pgTable("test", {
      id: text().primaryKey(),
      invalid: text().notNull(),
    });

    expect(() =>
      createZeroTableBuilder(testTable, {
        id: true,
        invalid: "someinvalidtype",
      } as unknown as ColumnsConfig<typeof testTable>),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: Invalid column config for column invalid - expected boolean or object but was string]`,
    );
  });

  test("pg - invalid column selection", ({ expect }) => {
    const testTable = pgTable("test", {
      id: text().primaryKey(),
      invalid: text().notNull(),
    });

    expect(() =>
      createZeroTableBuilder(testTable, {
        id: true,
        invalid: "someinvalidtype",
      } as unknown as ColumnsConfig<typeof testTable>),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: Invalid column config for column invalid - expected boolean or object but was string]`,
    );
  });

  test("pg - array types", ({ expect }) => {
    const testTable = pgTable("test", {
      id: text().primaryKey(),
      tags: text().array().notNull(),
      scores: jsonb().array(),
    });

    expect(() =>
      createZeroTableBuilder(testTable, {
        id: true,
        tags: true,
        scores: true,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: Unsupported column type: PgArray (array). It must be supported by Zero, e.g.: number | bigint | boolean | date | PgText | PgChar | PgVarchar | PgUUID | PgEnumColumn | PgJsonb | PgJson | PgNumeric | PgDateString | PgTimestampString]`,
    );
  });

  test("pg - interval types", ({ expect }) => {
    const testTable = pgTable("test", {
      id: text().primaryKey(),
      interval: interval().notNull(),
    });

    expect(() =>
      createZeroTableBuilder(testTable, {
        id: true,
        interval: true,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: Unsupported column type: PgInterval (string). It must be supported by Zero, e.g.: number | bigint | boolean | date | PgText | PgChar | PgVarchar | PgUUID | PgEnumColumn | PgJsonb | PgJson | PgNumeric | PgDateString | PgTimestampString]`,
    );
  });

  test("pg - cidr types", ({ expect }) => {
    const testTable = pgTable("test", {
      id: text().primaryKey(),
      cidr: cidr().notNull(),
    });

    expect(() =>
      createZeroTableBuilder(testTable, {
        id: true,
        cidr: true,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: Unsupported column type: PgCidr (string). It must be supported by Zero, e.g.: number | bigint | boolean | date | PgText | PgChar | PgVarchar | PgUUID | PgEnumColumn | PgJsonb | PgJson | PgNumeric | PgDateString | PgTimestampString]`,
    );
  });

  test("pg - macaddr types", ({ expect }) => {
    const testTable = pgTable("test", {
      id: text().primaryKey(),
      macaddr: macaddr().notNull(),
    });

    expect(() =>
      createZeroTableBuilder(testTable, {
        id: true,
        macaddr: true,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: Unsupported column type: PgMacaddr (string). It must be supported by Zero, e.g.: number | bigint | boolean | date | PgText | PgChar | PgVarchar | PgUUID | PgEnumColumn | PgJsonb | PgJson | PgNumeric | PgDateString | PgTimestampString]`,
    );
  });

  test("pg - inet types", ({ expect }) => {
    const testTable = pgTable("test", {
      id: text().primaryKey(),
      inet: inet().notNull(),
    });

    expect(() =>
      createZeroTableBuilder(testTable, {
        id: true,
        inet: true,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: Unsupported column type: PgInet (string). It must be supported by Zero, e.g.: number | bigint | boolean | date | PgText | PgChar | PgVarchar | PgUUID | PgEnumColumn | PgJsonb | PgJson | PgNumeric | PgDateString | PgTimestampString]`,
    );
  });

  test("pg - point types", ({ expect }) => {
    const testTable = pgTable("test", {
      id: text().primaryKey(),
      point: point().notNull(),
    });

    expect(() =>
      createZeroTableBuilder(testTable, {
        id: true,
        point: true,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: Unsupported column type: PgPointTuple (array). It must be supported by Zero, e.g.: number | bigint | boolean | date | PgText | PgChar | PgVarchar | PgUUID | PgEnumColumn | PgJsonb | PgJson | PgNumeric | PgDateString | PgTimestampString]`,
    );
  });

  test("pg - line types", ({ expect }) => {
    const testTable = pgTable("test", {
      id: text().primaryKey(),
      line: line().notNull(),
    });

    expect(() =>
      createZeroTableBuilder(testTable, {
        id: true,
        line: true,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: Unsupported column type: PgLine (array). It must be supported by Zero, e.g.: number | bigint | boolean | date | PgText | PgChar | PgVarchar | PgUUID | PgEnumColumn | PgJsonb | PgJson | PgNumeric | PgDateString | PgTimestampString]`,
    );
  });

  test("pg - geometry types", ({ expect }) => {
    const testTable = pgTable("test", {
      id: text().primaryKey(),
      location: geometry("location", {
        type: "point",
        mode: "xy",
        srid: 4326,
      }).notNull(),
    });

    expect(() =>
      createZeroTableBuilder(testTable, {
        id: true,
        location: true,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: Unsupported column type: PgGeometryObject (json). It must be supported by Zero, e.g.: number | bigint | boolean | date | PgText | PgChar | PgVarchar | PgUUID | PgEnumColumn | PgJsonb | PgJson | PgNumeric | PgDateString | PgTimestampString]`,
    );
  });

  test("pg - no primary key", ({ expect }) => {
    const testTable = pgTable("test", {
      id: text(),
    });

    expect(() =>
      createZeroTableBuilder(testTable, {
        id: true,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: No primary keys found in table - test. Did you forget to define a primary key?]`,
    );
  });

  test("pg - auto-increment primary key not supported", ({ expect }) => {
    const testTable = pgTable("test", {
      id: serial().primaryKey(),
      name: text(),
    });

    expect(() =>
      createZeroTableBuilder(testTable, {
        id: true,
        name: true,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: Primary key column id cannot have a default value defined on the database level and cannot be optional, since auto-incrementing primary keys can cause race conditions with concurrent inserts. See the Zero docs for more information.]`,
    );
  });

  test("pg - fail if table is not pg", ({ expect }) => {
    const testTable = mysqlTable("test", {
      id: textMysql().primaryKey(),
      name: textMysql(),
    });

    expect(() =>
      createZeroTableBuilder(testTable, {
        id: true,
        name: true,
      }),
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: Unsupported table type: test. Only Postgres tables are supported.]`,
    );
  });
});

import { beforeAll, expect, test, describe } from "vitest";
import { WebSocket } from "ws";
import { db, getNewZero, startPostgresAndZero } from "./utils";
import { randomUUID } from "crypto";

// Provide WebSocket on the global scope
globalThis.WebSocket = WebSocket as any;

beforeAll(async () => {
  await startPostgresAndZero();
}, 60000);

describe("relationships", () => {
  test("can query users", async () => {
    const zero = await getNewZero();

    const q = zero.query.user;

    const preloadedUsers = await q.preload();
    await preloadedUsers.complete;

    const user = await q.run();

    expect(user).toHaveLength(3);
    expect(user[0]?.name).toBe("James");
    expect(user[0]?.id).toBe("1");

    preloadedUsers.cleanup();
  });

  test("can query messages", async () => {
    const zero = await getNewZero();

    const q = zero.query.message;

    const preloadedMessages = await q.preload();
    await preloadedMessages.complete;

    const messages = await q.run();

    expect(messages).toHaveLength(2);
    expect(messages[0]?.body).toBe("Hey, James!");
    expect(messages[0]?.metadata.key).toEqual("value1");

    preloadedMessages.cleanup();
  });

  test("can query messages with filter", async () => {
    const zero = await getNewZero();

    const q = zero.query.message.where((query) =>
      query.cmp("body", "=", "Thomas!"),
    );

    const preloadedMessages = await q.preload();
    await preloadedMessages.complete;

    const messages = await q.run();

    expect(messages).toHaveLength(1);
    expect(messages[0]?.body).toBe("Thomas!");
    expect(messages[0]?.metadata.key).toEqual("value5");

    preloadedMessages.cleanup();
  });

  test("can query messages with relationships", async () => {
    const zero = await getNewZero();

    const q = zero.query.message.related("medium").related("sender");

    const preloadedMessages = await q.preload();
    await preloadedMessages.complete;

    const messages = await q.one().run();

    expect(messages?.medium).toHaveLength(1);
    expect(messages?.medium[0]?.name).toBe("email");

    expect(messages?.sender).toHaveLength(1);
    expect(messages?.sender[0]?.name).toBe("James");

    preloadedMessages.cleanup();
  });

  test("can insert messages", async () => {
    const zero = await getNewZero();

    await zero.mutate.message.insert({
      id: "99",
      body: "Hi, James!",
      senderId: "1",
      mediumId: "4",
      metadata: { key: "9988" },
    });

    const q = zero.query.message.where((query) => query.cmp("id", "=", "99"));

    const preloadedMessages = await q.preload();
    await preloadedMessages.complete;

    const message = await q.one().run();

    expect(message?.id).toBe("99");
    expect(message?.metadata.key).toEqual("9988");
    expect(message?.createdAt).toBeDefined();
    expect(message?.updatedAt).toBeDefined();
    preloadedMessages.cleanup();

    const q1 = zero.query.medium.where((query) =>
      query.cmp("id", "=", message?.mediumId ?? "none"),
    );

    const preloadedMedium = await q1.preload();
    await preloadedMedium.complete;

    const medium = await q1.one().run();

    expect(medium?.name).toBe("whatsapp");

    preloadedMedium.cleanup();
  });
});

describe("types", () => {
  test("can query all types", async () => {
    const zero = await getNewZero();

    const q = zero.query.all_types.one();

    const preloadedAllTypes = await q.preload();
    await preloadedAllTypes.complete;

    const result = await q.run();

    expect(result?.id).toEqual("1");
    expect(result?.smallint).toEqual(1);
    expect(result?.integer).toEqual(2);
    expect(result?.bigint).toEqual(3);
    expect(result?.numeric).toEqual(8.8);
    expect(result?.decimal).toEqual(9.9);
    expect(result?.real).toEqual(9);
    expect(result?.double_precision).toEqual(10);
    expect(result?.text).toEqual("text");
    expect(result?.char).toEqual("c");
    expect(result?.uuid).toBeDefined();
    expect(result?.varchar).toEqual("varchar");
    expect(result?.boolean).toEqual(true);
    expect(result?.timestamp).toBeDefined();
    expect(result?.timestampTz).toBeDefined();
    expect(result?.date).toBeDefined();
    expect(result?.json).toEqual({ key: "value" });
    expect(result?.jsonb).toEqual({ key: "value" });
    expect(result?.typed_json).toEqual({ theme: "light", fontSize: 16 });
    expect(result?.status).toEqual("pending");

    expect(result?.smallserial).toEqual(1);
    expect(result?.serial).toEqual(1);
    expect(result?.bigserial).toEqual(1);

    expect(result?.optional_smallint).toBeNull();
    expect(result?.optional_integer).toBeNull();
    expect(result?.optional_bigint).toBeNull();
    expect(result?.optional_numeric).toBeNull();
    expect(result?.optional_real).toBeNull();
    expect(result?.optional_double_precision).toBeNull();
    expect(result?.optional_text).toBeNull();
    expect(result?.optional_boolean).toEqual(false);
    expect(result?.optional_timestamp).toBeNull();
    expect(result?.optional_json).toBeNull();
    expect(result?.optional_enum).toBeNull();
    expect(result?.optional_varchar).toBeNull();
    expect(result?.optional_uuid).toBeNull();

    preloadedAllTypes.cleanup();
  });

  test("can insert all types", async () => {
    const zero = await getNewZero();

    await zero.mutate.all_types.insert({
      id: "1011",
      smallint: 22,
      integer: 23,
      bigint: 24,
      numeric: 25.8,
      decimal: 26.9,
      real: 27,
      double_precision: 28,
      text: "text2",
      char: "f",
      uuid: randomUUID(),
      varchar: "varchar2",
      boolean: true,
      timestamp: new Date().toISOString(),
      timestampTz: new Date().toISOString(),
      date: new Date().toISOString(),
      json: { key: "value" },
      jsonb: { key: "value" },
      typed_json: { theme: "light", fontSize: 16 },
      status: "active",
    });

    const q = zero.query.all_types.where((query) =>
      query.cmp("id", "=", "1011"),
    );

    const preloadedAllTypes = await q.preload();
    await preloadedAllTypes.complete;

    const result = await q.one().run();

    expect(result?.id).toEqual("1011");
    expect(result?.smallint).toEqual(22);
    expect(result?.integer).toEqual(23);
    expect(result?.bigint).toEqual(24);
    expect(result?.numeric).toEqual(25.8);
    expect(result?.decimal).toEqual(26.9);
    expect(result?.real).toEqual(27);
    expect(result?.double_precision).toEqual(28);
    expect(result?.text).toEqual("text2");
    expect(result?.char).toEqual("f");
    expect(result?.uuid).toBeDefined();
    expect(result?.varchar).toEqual("varchar2");
    expect(result?.boolean).toEqual(true);
    expect(result?.timestamp).toBeDefined();
    expect(result?.timestampTz).toBeDefined();
    expect(result?.date).toBeDefined();
    expect(result?.json).toEqual({ key: "value" });
    expect(result?.jsonb).toEqual({ key: "value" });
    expect(result?.typed_json).toEqual({ theme: "light", fontSize: 16 });
    expect(result?.status).toEqual("active");

    preloadedAllTypes.cleanup();

    const dbResult = await db.query.allTypesTable.findFirst({
      where: (table, { eq }) => eq(table.id, "1011"),
    });

    expect(dbResult?.id).toEqual("1011");
    expect(dbResult?.smallintField).toEqual(22);
    expect(dbResult?.integerField).toEqual(23);
    expect(dbResult?.bigintField).toEqual(24);
    expect(dbResult?.numericField).toEqual("25.80");
    expect(dbResult?.decimalField).toEqual("26.90");
    expect(dbResult?.realField).toEqual(27);
    expect(dbResult?.doublePrecisionField).toEqual(28);
    expect(dbResult?.textField).toEqual("text2");
    expect(dbResult?.charField).toEqual("f");
    expect(dbResult?.uuidField).toBeDefined();
    expect(dbResult?.varcharField).toEqual("varchar2");
    expect(dbResult?.booleanField).toEqual(true);
    expect(dbResult?.timestampField).toBeDefined();
    expect(dbResult?.timestampTzField).toBeDefined();
    expect(dbResult?.dateField).toBeDefined();
    expect(dbResult?.jsonField).toEqual({ key: "value" });
    expect(dbResult?.jsonbField).toEqual({ key: "value" });
    expect(dbResult?.typedJsonField).toEqual({ theme: "light", fontSize: 16 });
    expect(dbResult?.statusField).toEqual("active");

    expect(dbResult?.smallSerialField).toEqual(2);
    expect(dbResult?.serialField).toEqual(2);
    expect(dbResult?.bigSerialField).toEqual(2);

    expect(dbResult?.optionalSmallint).toBeNull();
    expect(dbResult?.optionalInteger).toBeNull();
    expect(dbResult?.optionalBigint).toBeNull();
    expect(dbResult?.optionalNumeric).toBeNull();
    expect(dbResult?.optionalReal).toBeNull();
    expect(dbResult?.optionalDoublePrecision).toBeNull();
    expect(dbResult?.optionalText).toBeNull();
    expect(dbResult?.optionalBoolean).toBeNull();
    expect(dbResult?.optionalTimestamp).toBeNull();
    expect(dbResult?.optionalJson).toBeNull();
    expect(dbResult?.optionalEnum).toBeNull();
    expect(dbResult?.optionalVarchar).toBeNull();
    expect(dbResult?.optionalUuid).toBeNull();
  });
});

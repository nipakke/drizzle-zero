import { afterAll, beforeAll, expect, test, describe } from "vitest";
import { WebSocket } from "ws";
import { db, getNewZero, shutdown, startPostgresAndZero } from "./utils";
import { randomUUID } from "crypto";

// Provide WebSocket on the global scope
globalThis.WebSocket = WebSocket as any;

beforeAll(async () => {
  await startPostgresAndZero();
}, 60000);

afterAll(async () => {
  await shutdown();
});

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
    expect(messages[0]?.metadata.key).toStrictEqual("value1");

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
    expect(messages[0]?.metadata.key).toStrictEqual("value5");

    preloadedMessages.cleanup();
  });

  test("can query messages with relationships", async () => {
    const zero = await getNewZero();

    const q = zero.query.message.related("medium").related("sender");

    const preloadedMessages = await q.preload();
    await preloadedMessages.complete;

    const messages = await q.one().run();

    expect(messages?.medium).toHaveLength(1);
    expect(messages?.medium?.name).toBe("email");

    expect(messages?.sender).toHaveLength(1);
    expect(messages?.sender?.name).toBe("James");

    preloadedMessages.cleanup();
  });

  test("can query many-to-many relationships", async () => {
    const zero = await getNewZero();

    const q = zero.query.user.related("mediums").one();

    const preloadedUsers = await q.preload();
    await preloadedUsers.complete;

    const user = await q.one().run();

    expect(user?.mediums).toHaveLength(2);
    expect(user?.mediums[0]?.name).toBe("email");
    expect(user?.mediums[1]?.name).toBe("whatsapp");

    preloadedUsers.cleanup();
  });

  test("can query many-to-many extended relationships", async () => {
    const zero = await getNewZero();

    const q = zero.query.user.related("friends").one();

    const preloadedUsers = await q.preload();
    await preloadedUsers.complete;

    const user = await q.one().run();

    expect(user?.friends).toHaveLength(1);
    expect(user?.friends[0]?.name).toBe("John");

    preloadedUsers.cleanup();
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
    expect(message?.metadata.key).toStrictEqual("9988");
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

    expect(result?.id).toStrictEqual("1");
    expect(result?.smallint).toStrictEqual(1);
    expect(result?.integer).toStrictEqual(2);
    expect(result?.bigint).toStrictEqual(95807);
    expect(result?.bigint_number).toStrictEqual(444);
    expect(result?.numeric).toStrictEqual(8.8);
    expect(result?.decimal).toStrictEqual(9.9);
    expect(result?.real).toStrictEqual(9);
    expect(result?.double_precision).toStrictEqual(10);
    expect(result?.text).toStrictEqual("text");
    expect(result?.char).toStrictEqual("c");
    expect(typeof result?.uuid).toStrictEqual("string");
    expect(result?.varchar).toStrictEqual("varchar");
    expect(result?.boolean).toStrictEqual(true);
    expect(typeof result?.timestamp).toStrictEqual("number");
    expect(typeof result?.timestamp_tz).toStrictEqual("number");
    expect(typeof result?.timestamp_mode_date).toStrictEqual("number");
    expect(typeof result?.timestamp_mode_string).toStrictEqual("number");
    expect(typeof result?.date).toStrictEqual("number");
    expect(result?.json).toStrictEqual({ key: "value" });
    expect(result?.jsonb).toStrictEqual({ key: "value" });
    expect(result?.typed_json).toStrictEqual({ theme: "light", fontSize: 16 });
    expect(result?.status).toStrictEqual("pending");

    expect(result?.smallserial).toStrictEqual(1);
    expect(result?.serial).toStrictEqual(1);
    expect(result?.bigserial).toStrictEqual(1);

    expect(result?.optional_smallint).toBeNull();
    expect(result?.optional_integer).toBeNull();
    expect(result?.optional_bigint).toBeNull();
    expect(result?.optional_numeric).toBeNull();
    expect(result?.optional_real).toBeNull();
    expect(result?.optional_double_precision).toBeNull();
    expect(result?.optional_text).toBeNull();
    expect(result?.optional_boolean).toStrictEqual(false);
    expect(result?.optional_timestamp).toBeNull();
    expect(result?.optional_json).toBeNull();
    expect(result?.optional_enum).toBeNull();
    expect(result?.optional_varchar).toBeNull();
    expect(result?.optional_uuid).toBeNull();
    expect(result?.optional_enum).toBeNull();
    expect(result?.optional_varchar).toBeNull();
    expect(result?.optional_uuid).toBeNull();

    preloadedAllTypes.cleanup();
  });

  test("can insert all types", async () => {
    const zero = await getNewZero();

    const currentDate = new Date();

    await zero.mutate.all_types.insert({
      id: "1011",
      smallint: 22,
      integer: 23,
      bigint: 24,
      bigint_number: 444,
      numeric: 25.8,
      decimal: 26.9,
      real: 27,
      double_precision: 28,
      text: "text2",
      char: "f",
      uuid: randomUUID(),
      varchar: "varchar2",
      boolean: true,
      timestamp: currentDate.getTime(),
      timestamp_tz: currentDate.getTime(),
      timestamp_mode_date: currentDate.getTime(),
      timestamp_mode_string: currentDate.getTime(),
      date: currentDate.getTime(),
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

    expect(result?.id).toStrictEqual("1011");
    expect(result?.smallint).toStrictEqual(22);
    expect(result?.integer).toStrictEqual(23);
    expect(result?.bigint).toStrictEqual(24);
    expect(result?.bigint_number).toStrictEqual(444);
    expect(result?.numeric).toStrictEqual(25.8);
    expect(result?.decimal).toStrictEqual(26.9);
    expect(result?.real).toStrictEqual(27);
    expect(result?.double_precision).toStrictEqual(28);
    expect(result?.text).toStrictEqual("text2");
    expect(result?.char).toStrictEqual("f");
    expect(typeof result?.uuid).toStrictEqual("string");
    expect(result?.varchar).toStrictEqual("varchar2");
    expect(result?.boolean).toStrictEqual(true);
    expect(result?.timestamp).toStrictEqual(currentDate.getTime());
    expect(result?.timestamp_tz).toStrictEqual(currentDate.getTime());
    expect(result?.timestamp_mode_date).toStrictEqual(currentDate.getTime());
    expect(result?.timestamp_mode_string).toStrictEqual(currentDate.getTime());
    expect(result?.date).toBeDefined();
    expect(result?.json).toStrictEqual({ key: "value" });
    expect(result?.jsonb).toStrictEqual({ key: "value" });
    expect(result?.typed_json).toStrictEqual({ theme: "light", fontSize: 16 });
    expect(result?.status).toStrictEqual("active");

    preloadedAllTypes.cleanup();

    const dbResult = await db.query.allTypesTable.findFirst({
      where: (table, { eq }) => eq(table.id, "1011"),
    });

    expect(dbResult?.id).toStrictEqual("1011");
    expect(dbResult?.smallintField).toStrictEqual(22);
    expect(dbResult?.integerField).toStrictEqual(23);
    expect(dbResult?.bigintField).toStrictEqual(24n);
    expect(dbResult?.bigintNumberField).toStrictEqual(444);
    expect(dbResult?.numericField).toStrictEqual("25.80");
    expect(dbResult?.decimalField).toStrictEqual("26.90");
    expect(dbResult?.realField).toStrictEqual(27);
    expect(dbResult?.doublePrecisionField).toStrictEqual(28);
    expect(dbResult?.textField).toStrictEqual("text2");
    expect(dbResult?.charField).toStrictEqual("f");
    expect(dbResult?.uuidField).toBeDefined();
    expect(dbResult?.varcharField).toStrictEqual("varchar2");
    expect(dbResult?.booleanField).toStrictEqual(true);
    expect(dbResult?.timestampField?.toISOString()).toStrictEqual(
      currentDate.toISOString(),
    );
    expect(dbResult?.timestampTzField?.toISOString()).toStrictEqual(
      currentDate.toISOString(),
    );
    expect(dbResult?.timestampModeDate?.toISOString()).toStrictEqual(
      currentDate.toISOString(),
    );
    expect(dbResult?.timestampModeString).toContain(
      currentDate.toISOString().split("T")[0],
    );
    expect(dbResult?.dateField).toStrictEqual(
      currentDate.toISOString().split("T")[0],
    );
    expect(dbResult?.jsonField).toStrictEqual({ key: "value" });
    expect(dbResult?.jsonbField).toStrictEqual({ key: "value" });
    expect(dbResult?.typedJsonField).toStrictEqual({
      theme: "light",
      fontSize: 16,
    });
    expect(dbResult?.statusField).toStrictEqual("active");

    expect(dbResult?.smallSerialField).toStrictEqual(2);
    expect(dbResult?.serialField).toStrictEqual(2);
    expect(dbResult?.bigSerialField).toStrictEqual(2);

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

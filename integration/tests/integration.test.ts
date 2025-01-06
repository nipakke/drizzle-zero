import { Zero } from "@rocicorp/zero";
import { beforeAll, expect, test } from "vitest";
import { WebSocket } from "ws";
import { schema } from "../schema";
import { startPostgresAndZero } from "./utils";

// Provide WebSocket on the global scope
globalThis.WebSocket = WebSocket as any;

const getNewZero = async () => {
  return new Zero({
    server: "http://localhost:4949",
    userID: "1",
    schema: schema,
    kvStore: "mem",
  });
};

beforeAll(async () => {
  await startPostgresAndZero();
}, 60000);

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
    body: "Hello, James!",
    senderId: "1",
    mediumId: "1",
    metadata: { key: "newvalue" },
  });

  const q = zero.query.message;

  const preloadedMessages = await q.preload();
  await preloadedMessages.complete;

  const messages = await q.run();
  expect(messages).toHaveLength(3);
  expect(messages[2]?.id).toBe("99");
  expect(messages[2]?.metadata.key).toEqual("newvalue");
  expect(messages[2]?.createdAt).toBeDefined();
  expect(messages[2]?.updatedAt).toBeDefined();
  preloadedMessages.cleanup();
});

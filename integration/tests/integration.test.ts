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

  const preloadedUsers = await zero.query.user.preload();
  await preloadedUsers.complete;

  const user = await zero.query.user.run();

  expect(user).toHaveLength(3);
  expect(user[0]?.name).toBe("James");
  expect(user[0]?.id).toBe("1");

  preloadedUsers.cleanup();
});

test("can query messages", async () => {
  const zero = await getNewZero();

  const preloadedMessages = await zero.query.message.preload();
  await preloadedMessages.complete;

  const messages = await zero.query.message.run();

  expect(messages).toHaveLength(1);
  expect(messages[0]?.body).toBe("Hey, James!");

  preloadedMessages.cleanup();
});

test("can query messages with relationships", async () => {
  const zero = await getNewZero();

  const preloadedMessages = await zero.query.message
    .related("medium")
    .related("sender")
    .preload();
  await preloadedMessages.complete;

  const messages = await zero.query.message
    .related("sender")
    .related("medium")
    .one()
    .run();

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
  });

  const preloadedMessages = await zero.query.message.preload();
  await preloadedMessages.complete;

  const messages = await zero.query.message.run();
  expect(messages).toHaveLength(2);
  expect(messages[1]?.id).toBe("99");

  preloadedMessages.cleanup();
});

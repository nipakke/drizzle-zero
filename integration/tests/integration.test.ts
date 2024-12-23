import { Zero } from "@rocicorp/zero";
import { beforeAll, expect, test } from "vitest";
import { WebSocket } from "ws";
import { schema } from "../schema";
import { startPostgresAndZero } from "./utils";

// Provide WebSocket on the global scope
globalThis.WebSocket = WebSocket as any;

beforeAll(async () => {
  await startPostgresAndZero();
}, 60000);

test("can query users", async () => {
  const zero = new Zero({
    server: "http://localhost:4949",
    userID: "1",
    schema: schema,
    kvStore: "mem",
  });

  const preloadedUsers = await zero.query.user.preload();
  await preloadedUsers.complete;

  const user = await zero.query.user.run();

  expect(user).toHaveLength(3);
  expect(user[0].name).toBe("James");
  expect(user[0].id).toBe("1");

  preloadedUsers.cleanup();
});

test("can query messages", async () => {
  const zero = new Zero({
    server: "http://localhost:4949",
    userID: "1",
    schema: schema,
    kvStore: "mem",
  });

  const preloadedMessages = await zero.query.message.preload();
  await preloadedMessages.complete;

  const messages = await zero.query.message.run();

  expect(messages).toHaveLength(4);
  expect(messages[0].body).toBe("Hey, James!");

  preloadedMessages.cleanup();
});

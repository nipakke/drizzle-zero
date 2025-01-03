import {
  column,
  createSchema,
  createTableSchema,
  type JSONValue,
  type TableSchema,
} from "@rocicorp/zero";
import { test } from "vitest";
import { Expect, expectSchemaDeepEqual, type Equal } from "./utils";

test("relationships - one-to-one self-referential", async () => {
  const { schema: oneToOneSelfZeroSchema } = await import(
    "./schemas/one-to-one-self.zero"
  );

  const expectedUsers = {
    tableName: "user",
    columns: {
      id: column.number(),
      name: column.string(true),
      invited_by: column.number(true),
    },
    primaryKey: ["id"],
    relationships: {
      invitee: {
        sourceField: "invited_by" as "id" | "invited_by" | "name",
        destField: "id" as "id" | "invited_by" | "name",
        destSchema: () => expectedUsers,
      },
    },
  } as const;

  const expected = createSchema({
    version: 1,
    tables: {
      user: expectedUsers,
    },
  });

  expectSchemaDeepEqual(oneToOneSelfZeroSchema).toEqual(expected);
  Expect<Equal<typeof oneToOneSelfZeroSchema, typeof expected>>;
});

test("relationships - one-to-one", async () => {
  const { schema: oneToOneZeroSchema } = await import(
    "./schemas/one-to-one.zero"
  );

  const expectedUsers = {
    tableName: "user",
    columns: {
      id: column.number(),
      name: column.string(true),
    },
    primaryKey: ["id"],
  } as const satisfies TableSchema;

  const expectedProfileInfo = {
    tableName: "profile_info",
    columns: {
      id: column.number(),
      user_id: column.number(true),
      metadata: column.json<JSONValue>(true),
    },
    primaryKey: ["id"],
    relationships: {
      user: {
        sourceField: "user_id" as "id" | "user_id" | "metadata",
        destField: "id" as "id" | "name",
        destSchema: () => expectedUsers,
      },
    },
  } as const satisfies TableSchema;

  const expected = createSchema({
    version: 1,
    tables: {
      user: expectedUsers,
      profile_info: expectedProfileInfo,
    },
  });

  expectSchemaDeepEqual(oneToOneZeroSchema).toEqual(expected);
  Expect<Equal<typeof oneToOneZeroSchema, typeof expected>>;
});

test("relationships - one-to-one-2", async () => {
  const { schema: oneToOne2ZeroSchema } = await import(
    "./schemas/one-to-one-2.zero"
  );

  const expectedUsers = {
    tableName: "user",
    columns: {
      id: column.string(),
      name: column.string(),
      partner: column.boolean(),
    },
    primaryKey: ["id"],
  } as const satisfies TableSchema;

  const expectedMedium = {
    tableName: "medium",
    columns: {
      id: column.string(),
      name: column.string(),
    },
    primaryKey: ["id"],
  } as const satisfies TableSchema;

  const expectedMessage = {
    tableName: "message",
    columns: {
      id: column.string(),
      senderId: column.string(true),
      mediumId: column.string(true),
      body: column.string(),
    },
    primaryKey: ["id"],
    relationships: {
      medium: {
        sourceField: "mediumId" as "id" | "mediumId" | "senderId" | "body",
        destField: "id" as "id" | "name",
        destSchema: () => expectedMedium,
      },
      sender: {
        sourceField: "senderId" as "id" | "senderId" | "mediumId" | "body",
        destField: "id" as "id" | "name" | "partner",
        destSchema: () => expectedUsers,
      },
    },
  } as const satisfies TableSchema;

  const expected = createSchema({
    version: 2.1,
    tables: {
      user: expectedUsers,
      medium: expectedMedium,
      message: expectedMessage,
    },
  });

  expectSchemaDeepEqual(oneToOne2ZeroSchema).toEqual(expected);
  Expect<Equal<typeof oneToOne2ZeroSchema, typeof expected>>;
});

test("relationships - one-to-many", async () => {
  const { schema: oneToManyZeroSchema } = await import(
    "./schemas/one-to-many.zero"
  );

  const expectedUsers = {
    tableName: "user",
    columns: {
      id: column.number(),
      name: column.string(true),
    },
    primaryKey: ["id"],
  } as const satisfies TableSchema;

  const expectedPosts = createTableSchema({
    tableName: "post",
    columns: {
      id: column.number(),
      content: column.string(true),
      author_id: column.number(true),
    },
    primaryKey: ["id"],
    relationships: {
      author: {
        sourceField: "author_id" as "id" | "content" | "author_id",
        destField: "id" as "id" | "name",
        destSchema: () => expectedUsers,
      },
    },
  });

  const expectedComments = createTableSchema({
    tableName: "comment",
    columns: {
      id: column.number(),
      text: column.string(true),
      author_id: column.number(true),
      post_id: column.number(true),
    },
    primaryKey: ["id"],
    relationships: {
      post: {
        sourceField: "post_id" as "id" | "text" | "author_id" | "post_id",
        destField: "id" as "id" | "content" | "author_id",
        destSchema: () => expectedPosts,
      },
    },
  });

  const expected = createSchema({
    version: 1,
    tables: {
      user: expectedUsers,
      post: expectedPosts,
      comment: expectedComments,
    },
  });

  expectSchemaDeepEqual(oneToManyZeroSchema).toEqual(expected);
  Expect<Equal<typeof oneToManyZeroSchema, typeof expected>>;
});

test("relationships - many-to-many", async () => {
  const { schema: manyToManyZeroSchema } = await import(
    "./schemas/many-to-many.zero"
  );

  const expectedUsers = {
    tableName: "user",
    columns: {
      id: column.number(),
      name: column.string(true),
    },
    primaryKey: ["id"],
  } as const satisfies TableSchema;

  const expectedUsersToGroups = {
    tableName: "users_to_group",
    columns: {
      user_id: column.number(),
      group_id: column.number(),
    },
    primaryKey: ["user_id", "group_id"] as readonly [string, ...string[]],
    relationships: {
      group: {
        sourceField: "group_id" as "user_id" | "group_id",
        destField: "id" as "id" | "name",
        destSchema: () => expectedGroups,
      },
      user: {
        sourceField: "user_id" as "user_id" | "group_id",
        destField: "id" as "id" | "name",
        destSchema: () => expectedUsers,
      },
    },
  } as const satisfies TableSchema;

  const expectedGroups = {
    tableName: "group",
    columns: {
      id: column.number(),
      name: column.string(true),
    },
    primaryKey: ["id"],
  } as const satisfies TableSchema;

  const expected = createSchema({
    version: 1,
    tables: {
      user: expectedUsers,
      users_to_group: expectedUsersToGroups,
      group: expectedGroups,
    },
  });

  expectSchemaDeepEqual(manyToManyZeroSchema).toEqual(expected);
  Expect<Equal<typeof manyToManyZeroSchema, typeof expected>>;
});

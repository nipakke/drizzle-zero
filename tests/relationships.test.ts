import { createSchema, type JSONValue } from "@rocicorp/zero";
import { describe, expect, test } from "vitest";
import {
  Expect,
  expectSchemaDeepEqual,
  type AtLeastOne,
  type Equal,
} from "./utils";

describe.concurrent("relationships", () => {
  test("relationships - many-to-many-incorrect-many", async () => {
    await expect(
      import("./schemas/many-to-many-incorrect-many.zero"),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: Invalid many-to-many configuration for user.groups: Not all required fields were provided.]`,
    );
  });

  test("relationships - many-to-many-subset", async () => {
    await expect(
      import("./schemas/one-to-one-missing-foreign-key.zero"),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: No relationship found for: userPosts (One from users to posts). Did you forget to define foreign keys?]`,
    );
  });

  test("relationships - many-to-many-missing-foreign-key", async () => {
    await expect(
      import("./schemas/many-to-many-missing-foreign-key.zero"),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: Invalid many-to-many configuration for user.groups: Could not find foreign key relationships in junction table users_to_group]`,
    );
  });

  test("relationships - many-to-many-duplicate-relationship", async () => {
    await expect(
      import("./schemas/many-to-many-duplicate-relationship.zero"),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: Duplicate relationship found for: usersToGroups (Many from user to users_to_group).]`,
    );
  });

  test("relationships - one-to-one-missing-foreign-key", async () => {
    await expect(
      import("./schemas/one-to-one-missing-foreign-key.zero"),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: No relationship found for: userPosts (One from users to posts). Did you forget to define foreign keys?]`,
    );
  });

  test("relationships - one-to-many-missing-named", async () => {
    await expect(
      import("./schemas/one-to-many-missing-named.zero"),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: No relationship found for: author (Many from users to posts). Did you forget to define foreign keys for named relation "author"?]`,
    );
  });

  test("relationships - no-relations", async () => {
    const { schema: noRelationsZeroSchema } = await import(
      "./schemas/no-relations.zero"
    );

    const expectedUsers = {
      tableName: "user",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        name: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
    } as const;

    const expectedProfileInfo = {
      tableName: "profile_info",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        user_id: {
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
    } as const;

    const expected = createSchema({
      version: 1,
      tables: {
        user: expectedUsers,
        profile_info: expectedProfileInfo,
      },
    });

    expectSchemaDeepEqual(noRelationsZeroSchema).toEqual(expected);
    Expect<Equal<typeof noRelationsZeroSchema, typeof expected>>;
  });

  test("relationships - one-to-one self-referential", async () => {
    const { schema: oneToOneSelfZeroSchema } = await import(
      "./schemas/one-to-one-self.zero"
    );

    const expectedUsers = {
      tableName: "user",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        name: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        invited_by: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
      relationships: {
        invitee: {
          sourceField: ["invited_by"] as AtLeastOne<
            "id" | "name" | "invited_by"
          >,
          destField: ["id"] as AtLeastOne<"id" | "name" | "invited_by">,
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
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        name: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
      relationships: {
        profileInfo: {
          sourceField: ["id"] as AtLeastOne<"id" | "name">,
          destField: ["user_id"] as AtLeastOne<"id" | "user_id">,
          destSchema: () => expectedProfileInfo,
        },
      },
    } as const;

    const expectedProfileInfo = {
      tableName: "profile_info",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        user_id: {
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
      relationships: {
        user: {
          sourceField: ["user_id"] as AtLeastOne<"id" | "user_id">,
          destField: ["id"] as AtLeastOne<"id" | "name">,
          destSchema: () => expectedUsers,
        },
      },
    } as const;

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

  test("relationships - one-to-one-subset", async () => {
    const { schema: oneToOneSubsetZeroSchema } = await import(
      "./schemas/one-to-one-subset.zero"
    );

    const expectedUsers = {
      tableName: "user",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        name: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
    } as const;

    const expected = createSchema({
      version: 1,
      tables: {
        user: expectedUsers,
      },
    });

    expectSchemaDeepEqual(oneToOneSubsetZeroSchema).toEqual(expected);
    Expect<Equal<typeof oneToOneSubsetZeroSchema, typeof expected>>;
  });

  test("relationships - one-to-one-foreign-key", async () => {
    const { schema: oneToOneForeignKeyZeroSchema } = await import(
      "./schemas/one-to-one-foreign-key.zero"
    );

    const expectedUsers = {
      tableName: "users",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        name: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
      relationships: {
        userPosts: {
          sourceField: ["id"] as AtLeastOne<"id" | "name">,
          destField: ["author"] as AtLeastOne<"id" | "name" | "author">,
          destSchema: () => expectedPosts,
        },
      },
    } as const;

    const expectedPosts = {
      tableName: "posts",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        name: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        author: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
      relationships: {
        postAuthor: {
          sourceField: ["author"] as AtLeastOne<"id" | "name" | "author">,
          destField: ["id"] as AtLeastOne<"id" | "name">,
          destSchema: () => expectedUsers,
        },
      },
    } as const;

    const expected = createSchema({
      version: 1,
      tables: {
        users: expectedUsers,
        posts: expectedPosts,
      },
    });

    expectSchemaDeepEqual(oneToOneForeignKeyZeroSchema).toEqual(expected);
    Expect<Equal<typeof oneToOneForeignKeyZeroSchema, typeof expected>>;
  });

  test("relationships - one-to-one-2", async () => {
    const { schema: oneToOne2ZeroSchema } = await import(
      "./schemas/one-to-one-2.zero"
    );

    const expectedUsers = {
      tableName: "user",
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
        partner: {
          type: "boolean",
          optional: false,
          customType: null as unknown as boolean,
        },
      },
      primaryKey: ["id"],
      relationships: {
        mediums: [
          {
            sourceField: ["id"] as AtLeastOne<"id" | "name">,
            destField: ["senderId"] as AtLeastOne<
              "id" | "senderId" | "mediumId" | "body"
            >,
            destSchema: () => expectedMessage,
          },
          {
            sourceField: ["mediumId"] as AtLeastOne<
              "id" | "senderId" | "mediumId" | "body"
            >,
            destField: ["id"] as AtLeastOne<"id" | "name">,
            destSchema: () => expectedMedium,
          },
        ],
        messages: {
          sourceField: ["id"] as AtLeastOne<"id" | "name">,
          destField: ["senderId"] as AtLeastOne<
            "id" | "senderId" | "mediumId" | "body"
          >,
          destSchema: () => expectedMessage,
        },
      },
    } as const;

    const expectedMedium = {
      tableName: "medium",
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
      },
      primaryKey: ["id"],
      relationships: {
        messages: {
          sourceField: ["id"] as AtLeastOne<"id" | "name">,
          destField: ["mediumId"] as AtLeastOne<
            "id" | "mediumId" | "senderId" | "body"
          >,
          destSchema: () => expectedMessage,
        },
      },
    } as const;

    const expectedMessage = {
      tableName: "message",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        senderId: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        mediumId: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        body: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
      relationships: {
        medium: {
          sourceField: ["mediumId"] as AtLeastOne<
            "id" | "mediumId" | "senderId" | "body"
          >,
          destField: ["id"] as AtLeastOne<"id" | "name">,
          destSchema: () => expectedMedium,
        },
        sender: {
          sourceField: ["senderId"] as AtLeastOne<
            "id" | "senderId" | "mediumId" | "body"
          >,
          destField: ["id"] as AtLeastOne<"id" | "name">,
          destSchema: () => expectedUsers,
        },
      },
    } as const;

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
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        name: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
      relationships: {
        posts: {
          sourceField: ["id"] as AtLeastOne<"id" | "name">,
          destField: ["author_id"] as AtLeastOne<
            "id" | "author_id" | "content"
          >,
          destSchema: () => expectedPosts,
        },
      },
    } as const;

    const expectedPosts = {
      tableName: "post",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        content: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        author_id: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
      relationships: {
        author: {
          sourceField: ["author_id"] as AtLeastOne<
            "id" | "content" | "author_id"
          >,
          destField: ["id"] as AtLeastOne<"id" | "name">,
          destSchema: () => expectedUsers,
        },
      },
    } as const;

    const expectedComments = {
      tableName: "comment",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        text: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        author_id: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        post_id: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
      relationships: {
        post: {
          sourceField: ["post_id"] as AtLeastOne<
            "id" | "text" | "author_id" | "post_id"
          >,
          destField: ["id"] as AtLeastOne<"id" | "content" | "author_id">,
          destSchema: () => expectedPosts,
        },
        author: {
          sourceField: ["author_id"] as AtLeastOne<
            "id" | "text" | "author_id" | "post_id"
          >,
          destField: ["id"] as AtLeastOne<"id" | "name">,
          destSchema: () => expectedUsers,
        },
      },
    } as const;

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

  test("relationships - one-to-many-named", async () => {
    const { schema: oneToManyNamedZeroSchema } = await import(
      "./schemas/one-to-many-named.zero"
    );

    const expectedUsers = {
      tableName: "users",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        name: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
      relationships: {
        author: {
          sourceField: ["id"] as AtLeastOne<"id" | "name">,
          destField: ["author_id"] as AtLeastOne<
            "id" | "author_id" | "content" | "reviewer_id"
          >,
          destSchema: () => expectedPosts,
        },
        reviewer: {
          sourceField: ["id"] as AtLeastOne<"id" | "name">,
          destField: ["reviewer_id"] as AtLeastOne<
            "id" | "reviewer_id" | "content" | "author_id"
          >,
          destSchema: () => expectedPosts,
        },
      },
    } as const;

    const expectedPosts = {
      tableName: "posts",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        content: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        author_id: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        reviewer_id: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
      relationships: {
        author: {
          sourceField: ["author_id"] as AtLeastOne<
            "id" | "content" | "author_id" | "reviewer_id"
          >,
          destField: ["id"] as AtLeastOne<"id" | "name">,
          destSchema: () => expectedUsers,
        },
        reviewer: {
          sourceField: ["reviewer_id"] as AtLeastOne<
            "id" | "content" | "reviewer_id" | "author_id"
          >,
          destField: ["id"] as AtLeastOne<"id" | "name">,
          destSchema: () => expectedUsers,
        },
      },
    } as const;

    const expected = createSchema({
      version: 1,
      tables: {
        users: expectedUsers,
        posts: expectedPosts,
      },
    });

    expectSchemaDeepEqual(oneToManyNamedZeroSchema).toEqual(expected);
    Expect<Equal<typeof oneToManyNamedZeroSchema, typeof expected>>;
  });

  test("relationships - many-to-many", async () => {
    const { schema: manyToManyZeroSchema } = await import(
      "./schemas/many-to-many.zero"
    );

    const expectedUsers = {
      tableName: "user",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        name: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
      relationships: {
        groups: [
          {
            sourceField: ["id"] as AtLeastOne<"id" | "name">,
            destField: ["user_id"] as AtLeastOne<"user_id" | "group_id">,
            destSchema: () => expectedUsersToGroups,
          },
          {
            sourceField: ["group_id"] as AtLeastOne<"group_id" | "user_id">,
            destField: ["id"] as AtLeastOne<"id" | "name">,
            destSchema: () => expectedGroups,
          },
        ],
        usersToGroups: {
          sourceField: ["id"] as AtLeastOne<"id" | "name">,
          destField: ["user_id"] as AtLeastOne<"user_id" | "group_id">,
          destSchema: () => expectedUsersToGroups,
        },
      },
    } as const;

    const expectedUsersToGroups = {
      tableName: "users_to_group",
      columns: {
        user_id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        group_id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["user_id", "group_id"] as Readonly<AtLeastOne<string>>,
      relationships: {
        group: {
          sourceField: ["group_id"] as AtLeastOne<"user_id" | "group_id">,
          destField: ["id"] as AtLeastOne<"id" | "name">,
          destSchema: () => expectedGroups,
        },
        user: {
          sourceField: ["user_id"] as AtLeastOne<"user_id" | "group_id">,
          destField: ["id"] as AtLeastOne<"id" | "name">,
          destSchema: () => expectedUsers,
        },
      },
    } as const;

    const expectedGroups = {
      tableName: "group",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        name: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
      relationships: {
        usersToGroups: {
          sourceField: ["id"] as AtLeastOne<"id" | "name">,
          destField: ["group_id"] as AtLeastOne<"user_id" | "group_id">,
          destSchema: () => expectedUsersToGroups,
        },
      },
    } as const;

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

  test("relationships - many-to-many-subset", async () => {
    const { schema: manyToManySubsetZeroSchema } = await import(
      "./schemas/many-to-many-subset.zero"
    );

    const expectedUsers = {
      tableName: "user",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
    } as const;

    const expected = createSchema({
      version: 1,
      tables: {
        user: expectedUsers,
      },
    });

    expectSchemaDeepEqual(manyToManySubsetZeroSchema).toEqual(expected);
    Expect<Equal<typeof manyToManySubsetZeroSchema, typeof expected>>;
  });

  test("relationships - many-to-many-subset-2", async () => {
    const { schema: manyToManySubset2ZeroSchema } = await import(
      "./schemas/many-to-many-subset-2.zero"
    );

    const expectedUsers = {
      tableName: "user",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        name: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
      relationships: {
        usersToGroups: {
          sourceField: ["id"] as AtLeastOne<"id" | "name">,
          destField: ["user_id"] as AtLeastOne<"user_id" | "group_id">,
          destSchema: () => expectedUsersToGroups,
        },
      },
    } as const;

    const expectedUsersToGroups = {
      tableName: "users_to_group",
      columns: {
        user_id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        group_id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["user_id", "group_id"] as Readonly<AtLeastOne<string>>,
      relationships: {
        user: {
          sourceField: ["user_id"] as AtLeastOne<"user_id" | "group_id">,
          destField: ["id"] as AtLeastOne<"id" | "name">,
          destSchema: () => expectedUsers,
        },
      },
    } as const;

    const expected = createSchema({
      version: 1,
      tables: {
        user: expectedUsers,
        users_to_group: expectedUsersToGroups,
      },
    });

    expectSchemaDeepEqual(manyToManySubset2ZeroSchema).toEqual(expected);
    Expect<Equal<typeof manyToManySubset2ZeroSchema, typeof expected>>;
  });

  test("relationships - many-to-many-self-referential", async () => {
    const { schema: manyToManySelfReferentialZeroSchema } = await import(
      "./schemas/many-to-many-self-referential.zero"
    );

    const expectedUsers = {
      tableName: "user",
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
      },
      primaryKey: ["id"],
      relationships: {
        friends: [
          {
            sourceField: ["id"] as AtLeastOne<"id" | "name">,
            destField: ["requesting_id"] as AtLeastOne<
              "requesting_id" | "accepting_id"
            >,
            destSchema: () => expectedFriendship,
          },
          {
            sourceField: ["accepting_id"] as AtLeastOne<
              "accepting_id" | "requesting_id"
            >,
            destField: ["id"] as AtLeastOne<"id" | "name">,
            destSchema: () => expectedUsers,
          },
        ],
      },
    } as const;

    const expectedFriendship = {
      tableName: "friendship",
      columns: {
        requesting_id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        accepting_id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        accepted: {
          type: "boolean",
          optional: false,
          customType: null as unknown as boolean,
        },
      },
      primaryKey: ["requesting_id", "accepting_id"] as Readonly<
        AtLeastOne<string>
      >,
    } as const;

    const expected = createSchema({
      version: 1,
      tables: {
        user: expectedUsers,
        friendship: expectedFriendship,
      },
    });

    expectSchemaDeepEqual(manyToManySelfReferentialZeroSchema).toEqual(
      expected,
    );
    Expect<Equal<typeof manyToManySelfReferentialZeroSchema, typeof expected>>;
  });

  test("relationships - many-to-many-extended-config", async () => {
    const { schema: manyToManyExtendedConfigZeroSchema } = await import(
      "./schemas/many-to-many-extended-config.zero"
    );

    const expectedUsers = {
      tableName: "user",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        name: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
      relationships: {
        groups: [
          {
            sourceField: ["id"] as AtLeastOne<"id" | "name">,
            destField: ["user_id"] as AtLeastOne<"user_id" | "group_id">,
            destSchema: () => expectedUsersToGroups,
          },
          {
            sourceField: ["group_id"] as AtLeastOne<"group_id" | "user_id">,
            destField: ["id"] as AtLeastOne<"id" | "name">,
            destSchema: () => expectedGroups,
          },
        ],
        usersToGroups: {
          sourceField: ["id"] as AtLeastOne<"id" | "name">,
          destField: ["user_id"] as AtLeastOne<"user_id" | "group_id">,
          destSchema: () => expectedUsersToGroups,
        },
      },
    } as const;

    const expectedUsersToGroups = {
      tableName: "users_to_group",
      columns: {
        user_id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        group_id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["user_id", "group_id"] as Readonly<AtLeastOne<string>>,
      relationships: {
        group: {
          sourceField: ["group_id"] as AtLeastOne<"user_id" | "group_id">,
          destField: ["id"] as AtLeastOne<"id" | "name">,
          destSchema: () => expectedGroups,
        },
        user: {
          sourceField: ["user_id"] as AtLeastOne<"user_id" | "group_id">,
          destField: ["id"] as AtLeastOne<"id" | "name">,
          destSchema: () => expectedUsers,
        },
      },
    } as const;

    const expectedGroups = {
      tableName: "group",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        name: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
      relationships: {
        usersToGroups: {
          sourceField: ["id"] as AtLeastOne<"id" | "name">,
          destField: ["group_id"] as AtLeastOne<"user_id" | "group_id">,
          destSchema: () => expectedUsersToGroups,
        },
      },
    } as const;

    const expected = createSchema({
      version: 1,
      tables: {
        user: expectedUsers,
        users_to_group: expectedUsersToGroups,
        group: expectedGroups,
      },
    });

    expectSchemaDeepEqual(manyToManyExtendedConfigZeroSchema).toEqual(expected);
    Expect<Equal<typeof manyToManyExtendedConfigZeroSchema, typeof expected>>;
  });

  test("relationships - custom-schema", async () => {
    const { schema: customSchemaZeroSchema } = await import(
      "./schemas/custom-schema.zero"
    );

    const expectedUsers = {
      tableName: "user",
      columns: {
        id: {
          type: "string",
          optional: false,
          customType: null as unknown as string,
        },
        name: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        invited_by: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
      },
      primaryKey: ["id"],
      relationships: {
        invitee: {
          sourceField: ["invited_by"] as AtLeastOne<
            "id" | "name" | "invited_by"
          >,
          destField: ["id"] as AtLeastOne<"id" | "name" | "invited_by">,
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

    expectSchemaDeepEqual(customSchemaZeroSchema).toEqual(expected);
    Expect<Equal<typeof customSchemaZeroSchema, typeof expected>>;
  });
});

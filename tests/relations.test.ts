import {
  boolean,
  createSchema,
  json,
  relationships,
  string,
  table,
} from "@rocicorp/zero";
import { describe, test, TestAPI } from "vitest";
import { assertEqual, expectSchemaDeepEqual } from "./utils";

describe.concurrent("relationships", () => {
  test("relationships - many-to-many-incorrect-many", async ({
    expect,
  }: TestAPI) => {
    await expect(
      import("./schemas/many-to-many-incorrect-many.zero"),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: Invalid many-to-many configuration for user.groups: Not all required fields were provided.]`,
    );
  });

  test("relationships - many-to-many-subset", async ({ expect }: TestAPI) => {
    await expect(
      import("./schemas/one-to-one-missing-foreign-key.zero"),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: No relationship found for: userPosts (One from users to posts). Did you forget to define foreign keys?]`,
    );
  });

  test("relationships - many-to-many-missing-foreign-key", async ({
    expect,
  }: TestAPI) => {
    await expect(
      import("./schemas/many-to-many-missing-foreign-key.zero"),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: Invalid many-to-many configuration for user.groups: Could not find foreign key relationships in junction table users_to_group]`,
    );
  });

  test("relationships - many-to-many-duplicate-relationship", async ({
    expect,
  }: TestAPI) => {
    await expect(
      import("./schemas/many-to-many-duplicate-relationship.zero"),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: Duplicate relationship found for: usersToGroups (from user to users_to_group).]`,
    );
  });

  test("relationships - one-to-one-missing-foreign-key", async ({
    expect,
  }: TestAPI) => {
    await expect(
      import("./schemas/one-to-one-missing-foreign-key.zero"),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: drizzle-zero: No relationship found for: userPosts (One from users to posts). Did you forget to define foreign keys?]`,
    );
  });

  test("relationships - one-to-many-missing-named", async ({
    expect,
  }: TestAPI) => {
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

    const expectedUsers = table("user")
      .columns({
        id: string(),
        name: string().optional(),
      })
      .primaryKey("id");

    const expectedProfileInfo = table("profile_info")
      .columns({
        id: string(),
        user_id: string().optional(),
        metadata: json().optional(),
      })
      .primaryKey("id");

    const expected = createSchema(1, {
      tables: [expectedUsers, expectedProfileInfo],
    });

    expectSchemaDeepEqual(noRelationsZeroSchema).toEqual(expected);
    assertEqual(noRelationsZeroSchema, expected);
  });

  test("relationships - one-to-one self-referential", async () => {
    const { schema: oneToOneSelfZeroSchema } = await import(
      "./schemas/one-to-one-self.zero"
    );

    const expectedUsers = table("user")
      .columns({
        id: string(),
        name: string().optional(),
        invited_by: string().optional(),
      })
      .primaryKey("id");

    const expectedRelations = relationships(expectedUsers, ({ one }) => ({
      invitee: one({
        sourceField: ["invited_by"],
        destField: ["id"],
        destSchema: expectedUsers,
      }),
    }));

    const expected = createSchema(1, {
      tables: [expectedUsers],
      relationships: [expectedRelations],
    });

    expectSchemaDeepEqual(oneToOneSelfZeroSchema).toEqual(expected);
    assertEqual(oneToOneSelfZeroSchema, expected);
  });

  test("relationships - one-to-one", async () => {
    const { schema: oneToOneZeroSchema } = await import(
      "./schemas/one-to-one.zero"
    );

    const expectedUsers = table("user")
      .columns({
        id: string(),
        name: string().optional(),
      })
      .primaryKey("id");

    const expectedProfileInfo = table("profile_info")
      .columns({
        id: string(),
        user_id: string().optional(),
        metadata: json().optional(),
      })
      .primaryKey("id");

    const expectedUsersRelations = relationships(expectedUsers, ({ one }) => ({
      profileInfo: one({
        sourceField: ["id"],
        destField: ["user_id"],
        destSchema: expectedProfileInfo,
      }),
    }));

    const expectedProfileInfoRelations = relationships(
      expectedProfileInfo,
      ({ one }) => ({
        user: one({
          sourceField: ["user_id"],
          destField: ["id"],
          destSchema: expectedUsers,
        }),
      }),
    );

    const expected = createSchema(1, {
      tables: [expectedUsers, expectedProfileInfo],
      relationships: [expectedUsersRelations, expectedProfileInfoRelations],
    });

    expectSchemaDeepEqual(oneToOneZeroSchema).toEqual(expected);
    assertEqual(oneToOneZeroSchema, expected);
  });

  test("relationships - one-to-one-subset", async () => {
    const { schema: oneToOneSubsetZeroSchema } = await import(
      "./schemas/one-to-one-subset.zero"
    );

    const expectedUsers = table("user")
      .columns({
        id: string(),
        name: string().optional(),
      })
      .primaryKey("id");

    const expected = createSchema(1, {
      tables: [expectedUsers],
    });

    expectSchemaDeepEqual(oneToOneSubsetZeroSchema).toEqual(expected);
    assertEqual(oneToOneSubsetZeroSchema, expected);
  });

  test("relationships - one-to-one-foreign-key", async () => {
    const { schema: oneToOneForeignKeyZeroSchema } = await import(
      "./schemas/one-to-one-foreign-key.zero"
    );

    const expectedUsers = table("users")
      .columns({
        id: string(),
        name: string().optional(),
      })
      .primaryKey("id");

    const expectedPosts = table("posts")
      .columns({
        id: string(),
        name: string().optional(),
        author: string(),
      })
      .primaryKey("id");

    const expectedUsersRelationships = relationships(
      expectedUsers,
      ({ one }) => ({
        userPosts: one({
          sourceField: ["id"],
          destField: ["author"],
          destSchema: expectedPosts,
        }),
      }),
    );

    const expectedPostsRelationships = relationships(
      expectedPosts,
      ({ one }) => ({
        postAuthor: one({
          sourceField: ["author"],
          destField: ["id"],
          destSchema: expectedUsers,
        }),
      }),
    );

    const expected = createSchema(1, {
      tables: [expectedUsers, expectedPosts],
      relationships: [expectedUsersRelationships, expectedPostsRelationships],
    });

    expectSchemaDeepEqual(oneToOneForeignKeyZeroSchema).toEqual(expected);
    assertEqual(oneToOneForeignKeyZeroSchema, expected);
  });

  test("relationships - one-to-one-2", async () => {
    const { schema: oneToOne2ZeroSchema } = await import(
      "./schemas/one-to-one-2.zero"
    );

    const expectedUsers = table("user")
      .columns({
        id: string(),
        name: string(),
        partner: boolean(),
      })
      .primaryKey("id");

    const expectedMedium = table("medium")
      .columns({
        id: string(),
        name: string(),
      })
      .primaryKey("id");

    const expectedMessage = table("message")
      .columns({
        id: string(),
        senderId: string().optional(),
        mediumId: string().optional(),
        body: string(),
      })
      .primaryKey("id");

    const expectedMediumRelationships = relationships(
      expectedMedium,
      ({ many }) => ({
        messages: many({
          sourceField: ["id"],
          destField: ["mediumId"],
          destSchema: expectedMessage,
        }),
      }),
    );

    const expectedUsersRelationships = relationships(
      expectedUsers,
      ({ many }) => ({
        messages: many({
          sourceField: ["id"],
          destField: ["senderId"],
          destSchema: expectedMessage,
        }),
        mediums: many(
          {
            sourceField: ["id"],
            destField: ["senderId"],
            destSchema: expectedMessage,
          },
          {
            sourceField: ["mediumId"],
            destField: ["id"],
            destSchema: expectedMedium,
          },
        ),
      }),
    );

    const expectedMessageRelationships = relationships(
      expectedMessage,
      ({ one }) => ({
        medium: one({
          sourceField: ["mediumId"],
          destField: ["id"],
          destSchema: expectedMedium,
        }),
        sender: one({
          sourceField: ["senderId"],
          destField: ["id"],
          destSchema: expectedUsers,
        }),
      }),
    );

    const expected = createSchema(2.1, {
      tables: [expectedUsers, expectedMedium, expectedMessage],
      relationships: [
        expectedUsersRelationships,
        expectedMediumRelationships,
        expectedMessageRelationships,
      ],
    });

    expectSchemaDeepEqual(oneToOne2ZeroSchema).toEqual(expected);
    assertEqual(oneToOne2ZeroSchema, expected);
  });

  test("relationships - one-to-many", async () => {
    const { schema: oneToManyZeroSchema } = await import(
      "./schemas/one-to-many.zero"
    );

    const expectedUsers = table("user")
      .columns({
        id: string(),
        name: string().optional(),
      })
      .primaryKey("id");

    const expectedPosts = table("post")
      .columns({
        id: string(),
        content: string().optional(),
        author_id: string().optional(),
      })
      .primaryKey("id");

    const expectedComments = table("comment")
      .columns({
        id: string(),
        text: string().optional(),
        author_id: string().optional(),
        post_id: string().optional(),
      })
      .primaryKey("id");

    const expectedUsersRelationships = relationships(
      expectedUsers,
      ({ many }) => ({
        posts: many({
          sourceField: ["id"],
          destField: ["author_id"],
          destSchema: expectedPosts,
        }),
      }),
    );

    const expectedPostsRelationships = relationships(
      expectedPosts,
      ({ one }) => ({
        author: one({
          sourceField: ["author_id"],
          destField: ["id"],
          destSchema: expectedUsers,
        }),
      }),
    );

    const expectedCommentsRelationships = relationships(
      expectedComments,
      ({ one }) => ({
        post: one({
          sourceField: ["post_id"],
          destField: ["id"],
          destSchema: expectedPosts,
        }),
        author: one({
          sourceField: ["author_id"],
          destField: ["id"],
          destSchema: expectedUsers,
        }),
      }),
    );

    const expected = createSchema(1, {
      tables: [expectedUsers, expectedPosts, expectedComments],
      relationships: [
        expectedUsersRelationships,
        expectedPostsRelationships,
        expectedCommentsRelationships,
      ],
    });

    expectSchemaDeepEqual(oneToManyZeroSchema).toEqual(expected);
    assertEqual(oneToManyZeroSchema, expected);
  });

  test("relationships - one-to-many-named", async () => {
    const { schema: oneToManyNamedZeroSchema } = await import(
      "./schemas/one-to-many-named.zero"
    );

    const expectedUsers = table("users")
      .columns({
        id: string(),
        name: string().optional(),
      })
      .primaryKey("id");

    const expectedPosts = table("posts")
      .columns({
        id: string(),
        content: string().optional(),
        author_id: string().optional(),
        reviewer_id: string().optional(),
      })
      .primaryKey("id");

    const expectedUsersRelationships = relationships(
      expectedUsers,
      ({ many }) => ({
        author: many({
          sourceField: ["id"],
          destField: ["author_id"],
          destSchema: expectedPosts,
        }),
        reviewer: many({
          sourceField: ["id"],
          destField: ["reviewer_id"],
          destSchema: expectedPosts,
        }),
      }),
    );

    const expectedPostsRelationships = relationships(
      expectedPosts,
      ({ one }) => ({
        author: one({
          sourceField: ["author_id"],
          destField: ["id"],
          destSchema: expectedUsers,
        }),
        reviewer: one({
          sourceField: ["reviewer_id"],
          destField: ["id"],
          destSchema: expectedUsers,
        }),
      }),
    );

    const expected = createSchema(1, {
      tables: [expectedUsers, expectedPosts],
      relationships: [expectedUsersRelationships, expectedPostsRelationships],
    });

    expectSchemaDeepEqual(oneToManyNamedZeroSchema).toEqual(expected);
    assertEqual(oneToManyNamedZeroSchema, expected);
  });

  test("relationships - many-to-many", async () => {
    const { schema: manyToManyZeroSchema } = await import(
      "./schemas/many-to-many.zero"
    );

    const expectedUsers = table("user")
      .columns({
        id: string(),
        name: string().optional(),
      })
      .primaryKey("id");

    const expectedUsersToGroups = table("users_to_group")
      .columns({
        user_id: string(),
        group_id: string(),
      })
      .primaryKey("user_id", "group_id");

    const expectedGroups = table("group")
      .columns({
        id: string(),
        name: string().optional(),
      })
      .primaryKey("id");

    const expectedUsersRelationships = relationships(
      expectedUsers,
      ({ many }) => ({
        groups: many(
          {
            sourceField: ["id"],
            destField: ["user_id"],
            destSchema: expectedUsersToGroups,
          },
          {
            sourceField: ["group_id"],
            destField: ["id"],
            destSchema: expectedGroups,
          },
        ),
        usersToGroups: many({
          sourceField: ["id"],
          destField: ["user_id"],
          destSchema: expectedUsersToGroups,
        }),
      }),
    );

    const expectedUsersToGroupsRelationships = relationships(
      expectedUsersToGroups,
      ({ one }) => ({
        user: one({
          sourceField: ["user_id"],
          destField: ["id"],
          destSchema: expectedUsers,
        }),
        group: one({
          sourceField: ["group_id"],
          destField: ["id"],
          destSchema: expectedGroups,
        }),
      }),
    );

    const expectedGroupsRelationships = relationships(
      expectedGroups,
      ({ many }) => ({
        usersToGroups: many({
          sourceField: ["id"],
          destField: ["group_id"],
          destSchema: expectedUsersToGroups,
        }),
      }),
    );

    const expected = createSchema(1, {
      tables: [expectedUsers, expectedUsersToGroups, expectedGroups],
      relationships: [
        expectedUsersRelationships,
        expectedUsersToGroupsRelationships,
        expectedGroupsRelationships,
      ],
    });

    expectSchemaDeepEqual(manyToManyZeroSchema).toEqual(expected);
    assertEqual(manyToManyZeroSchema, expected);
  });

  test("relationships - many-to-many-subset", async () => {
    const { schema: manyToManySubsetZeroSchema } = await import(
      "./schemas/many-to-many-subset.zero"
    );

    const expectedUsers = table("user")
      .columns({
        id: string(),
      })
      .primaryKey("id");

    const expected = createSchema(1, {
      tables: [expectedUsers],
    });

    expectSchemaDeepEqual(manyToManySubsetZeroSchema).toEqual(expected);
    assertEqual(manyToManySubsetZeroSchema, expected);
  });

  test("relationships - many-to-many-subset-2", async () => {
    const { schema: manyToManySubset2ZeroSchema } = await import(
      "./schemas/many-to-many-subset-2.zero"
    );

    const expectedUsers = table("user")
      .columns({
        id: string(),
        name: string().optional(),
      })
      .primaryKey("id");

    const expectedUsersToGroups = table("users_to_group")
      .columns({
        user_id: string(),
        group_id: string(),
      })
      .primaryKey("user_id", "group_id");

    const expectedUsersToGroupsRelationships = relationships(
      expectedUsersToGroups,
      ({ one }) => ({
        user: one({
          sourceField: ["user_id"],
          destField: ["id"],
          destSchema: expectedUsers,
        }),
      }),
    );

    const usersRelationships = relationships(expectedUsers, ({ many }) => ({
      usersToGroups: many({
        sourceField: ["id"],
        destField: ["user_id"],
        destSchema: expectedUsersToGroups,
      }),
    }));

    const expected = createSchema(1, {
      tables: [expectedUsers, expectedUsersToGroups],
      relationships: [usersRelationships, expectedUsersToGroupsRelationships],
    });

    expectSchemaDeepEqual(manyToManySubset2ZeroSchema).toEqual(expected);
    assertEqual(manyToManySubset2ZeroSchema, expected);
  });

  test("relationships - many-to-many-self-referential", async () => {
    const { schema: manyToManySelfReferentialZeroSchema } = await import(
      "./schemas/many-to-many-self-referential.zero"
    );

    const expectedUsers = table("user")
      .columns({
        id: string(),
        name: string(),
      })
      .primaryKey("id");

    const expectedFriendship = table("friendship")
      .columns({
        requesting_id: string(),
        accepting_id: string(),
        accepted: boolean(),
      })
      .primaryKey("requesting_id", "accepting_id");

    const expectedUsersRelationships = relationships(
      expectedUsers,
      ({ many }) => ({
        friends: many(
          {
            sourceField: ["id"],
            destField: ["requesting_id"],
            destSchema: expectedFriendship,
          },
          {
            sourceField: ["accepting_id"],
            destField: ["id"],
            destSchema: expectedUsers,
          },
        ),
      }),
    );

    const expected = createSchema(1, {
      tables: [expectedUsers, expectedFriendship],
      relationships: [expectedUsersRelationships],
    });

    expectSchemaDeepEqual(manyToManySelfReferentialZeroSchema).toEqual(
      expected,
    );
    assertEqual(manyToManySelfReferentialZeroSchema, expected);
  });

  test("relationships - many-to-many-extended-config", async () => {
    const { schema: manyToManyExtendedConfigZeroSchema } = await import(
      "./schemas/many-to-many-extended-config.zero"
    );

    const expectedUsers = table("user")
      .columns({
        id: string(),
        name: string().optional(),
      })
      .primaryKey("id");

    const expectedUsersToGroups = table("users_to_group")
      .columns({
        user_id: string(),
        group_id: string(),
      })
      .primaryKey("user_id", "group_id");

    const expectedGroups = table("group")
      .columns({
        id: string(),
        name: string().optional(),
      })
      .primaryKey("id");

    const expectedGroupsRelationships = relationships(
      expectedGroups,
      ({ many }) => ({
        usersToGroups: many({
          sourceField: ["id"],
          destField: ["group_id"],
          destSchema: expectedUsersToGroups,
        }),
      }),
    );

    const expectedUsersToGroupsRelationships = relationships(
      expectedUsersToGroups,
      ({ one }) => ({
        group: one({
          sourceField: ["group_id"],
          destField: ["id"],
          destSchema: expectedGroups,
        }),
        user: one({
          sourceField: ["user_id"],
          destField: ["id"],
          destSchema: expectedUsers,
        }),
      }),
    );

    const expectedUsersRelationships = relationships(
      expectedUsers,
      ({ many }) => ({
        groups: many(
          {
            sourceField: ["id"],
            destField: ["user_id"],
            destSchema: expectedUsersToGroups,
          },
          {
            sourceField: ["group_id"],
            destField: ["id"],
            destSchema: expectedGroups,
          },
        ),
        usersToGroups: many({
          sourceField: ["id"],
          destField: ["user_id"],
          destSchema: expectedUsersToGroups,
        }),
      }),
    );

    const expected = createSchema(1, {
      tables: [expectedUsers, expectedUsersToGroups, expectedGroups],
      relationships: [
        expectedUsersRelationships,
        expectedUsersToGroupsRelationships,
        expectedGroupsRelationships,
      ],
    });

    expectSchemaDeepEqual(manyToManyExtendedConfigZeroSchema).toEqual(expected);
    assertEqual(manyToManyExtendedConfigZeroSchema, expected);
  });

  test("relationships - custom-schema", async () => {
    const { schema: customSchemaZeroSchema } = await import(
      "./schemas/custom-schema.zero"
    );

    const expectedUsers = table("user")
      .columns({
        id: string(),
        name: string().optional(),
        invited_by: string().optional(),
      })
      .primaryKey("id");

    const expectedUsersRelationships = relationships(
      expectedUsers,
      ({ one }) => ({
        invitee: one({
          sourceField: ["invited_by"],
          destField: ["id"],
          destSchema: expectedUsers,
        }),
      }),
    );

    const expected = createSchema(1, {
      tables: [expectedUsers],
      relationships: [expectedUsersRelationships],
    });

    expectSchemaDeepEqual(customSchemaZeroSchema).toEqual(expected);
    assertEqual(customSchemaZeroSchema, expected);
  });
});

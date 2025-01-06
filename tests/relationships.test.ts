import { createSchema, type JSONValue } from "@rocicorp/zero";
import { test, describe } from "vitest";
import {
  Expect,
  expectSchemaDeepEqual,
  type AtLeastOne,
  type Equal,
} from "./utils";

describe.concurrent("relationships", () => {
  test("relationships - one-to-one self-referential", async () => {
    const { schema: oneToOneSelfZeroSchema } = await import(
      "./schemas/one-to-one-self.zero"
    );

    const expectedUsers = {
      tableName: "user",
      columns: {
        id: {
          type: "number",
          optional: false,
          customType: null as unknown as number,
        },
        name: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        invited_by: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
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
    Expect<
      Equal<
        typeof oneToOneSelfZeroSchema.tables.user.columns.name,
        typeof expected.tables.user.columns.name
      >
    >;
  });

  test("relationships - one-to-one", async () => {
    const { schema: oneToOneZeroSchema } = await import(
      "./schemas/one-to-one.zero"
    );

    const expectedUsers = {
      tableName: "user",
      columns: {
        id: {
          type: "number",
          optional: false,
          customType: null as unknown as number,
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
          destField: ["user_id"] as AtLeastOne<"id" | "user_id" | "metadata">,
          destSchema: () => expectedProfileInfo,
        },
      },
    } as const;

    const expectedProfileInfo = {
      tableName: "profile_info",
      columns: {
        id: {
          type: "number",
          optional: false,
          customType: null as unknown as number,
        },
        user_id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
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
          sourceField: ["user_id"] as AtLeastOne<"id" | "user_id" | "metadata">,
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
        messages: {
          sourceField: ["id"] as AtLeastOne<"id" | "name" | "partner">,
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
          destField: ["id"] as AtLeastOne<"id" | "name" | "partner">,
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
          type: "number",
          optional: false,
          customType: null as unknown as number,
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
          type: "number",
          optional: false,
          customType: null as unknown as number,
        },
        content: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        author_id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
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
          type: "number",
          optional: false,
          customType: null as unknown as number,
        },
        text: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        author_id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        post_id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
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
          type: "number",
          optional: false,
          customType: null as unknown as number,
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
          type: "number",
          optional: false,
          customType: null as unknown as number,
        },
        content: {
          type: "string",
          optional: true,
          customType: null as unknown as string,
        },
        author_id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
        },
        reviewer_id: {
          type: "number",
          optional: true,
          customType: null as unknown as number,
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
          type: "number",
          optional: false,
          customType: null as unknown as number,
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
          type: "number",
          optional: false,
          customType: null as unknown as number,
        },
        group_id: {
          type: "number",
          optional: false,
          customType: null as unknown as number,
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
          type: "number",
          optional: false,
          customType: null as unknown as number,
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
});

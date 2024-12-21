import { test } from "vitest";

test.skip("pg - basic", () => {
  // const userTable = pgTable("user", {
  //   id: text().primaryKey(),
  //   name: text().notNull(),
  // });
  // const postTable = pgTable("post", {
  //   id: text().primaryKey(),
  //   text: text().notNull(),
  //   userId: text("user_id")
  //     .references(() => userTable.id, { onDelete: "cascade" })
  //     .notNull(),
  // });
  // const postsRelations = relations(postTable, ({ one }) => ({
  //   user: one(userTable, {
  //     fields: [postTable.userId],
  //     references: [userTable.id],
  //   }),
  // }));
  // const postResult = relationsToZero(postsRelations);
  // const postResult = createZeroSchema(postTable, {
  //   id: true,
  //   text: true,
  //   userId: true,
  // });
  // const userResult = createZeroSchema(userTable, {
  //   id: true,
  //   name: true,
  // });
  // const expectedUsers = {
  //   tableName: "user",
  //   columns: {
  //     id: column.string(),
  //     name: column.string(),
  //   },
  //   primaryKey: "id",
  // } as const satisfies ZeroTableSchema;
  // const expectedPosts = {
  //   tableName: "post",
  //   columns: {
  //     id: column.string(),
  //     text: column.string(),
  //     userId: column.string(),
  //   },
  //   primaryKey: "id",
  //   relationships: {
  //     userId: {
  //       sourceField: "userId",
  //       destField: "id",
  //       destSchema: expectedUsers,
  //     },
  //   },
  // } as const satisfies ZeroTableSchema;
  // expectDeepEqual(postResult).toEqual(expectedPosts);
  // Expect<Equal<typeof postResult, typeof expectedPosts>>;
  // expectDeepEqual(userResult).toEqual(expectedUsers);
  // Expect<Equal<typeof userResult, typeof expectedUsers>>;
});

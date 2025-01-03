import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
} from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: serial("id").primaryKey(),
  name: text("name"),
});

// export const usersRelations = relations(users, ({ many }) => ({
//   usersToGroups: many(usersToGroups),
// }));

export const usersToGroups = pgTable(
  "users_to_group",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    groupId: integer("group_id")
      .notNull()
      .references(() => groups.id),
  },
  (t) => [primaryKey({ columns: [t.userId, t.groupId] })],
);

export const usersToGroupsRelations = relations(usersToGroups, ({ one }) => ({
  group: one(groups, {
    fields: [usersToGroups.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [usersToGroups.userId],
    references: [users.id],
  }),
}));

export const groups = pgTable("group", {
  id: serial("id").primaryKey(),
  name: text("name"),
});

// TODO this does not work because Zero does not support circular references
//
// export const groupsRelations = relations(groups, ({ many }) => ({
//   usersToGroups: many(usersToGroups),
// }));

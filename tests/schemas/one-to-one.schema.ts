import { relations } from "drizzle-orm";
import { integer, jsonb, pgTable, serial, text } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: serial("id").primaryKey(),
  name: text("name"),
});

// export const usersRelations = relations(users, ({ one }) => ({
//   profileInfo: one(profileInfo),
// }));

export const profileInfo = pgTable("profile_info", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  metadata: jsonb("metadata"),
});

export const profileInfoRelations = relations(profileInfo, ({ one }) => ({
  user: one(users, { fields: [profileInfo.userId], references: [users.id] }),
}));

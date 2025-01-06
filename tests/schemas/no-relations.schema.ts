import { integer, jsonb, pgTable, serial, text } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: serial("id").primaryKey(),
  name: text("name"),
});

export const profileInfo = pgTable("profile_info", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  metadata: jsonb("metadata"),
});

import { pgTable, text } from "drizzle-orm/pg-core";
import { boolean } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  partner: boolean("partner").notNull(),
});

export const medium = pgTable("medium", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const message = pgTable("message", {
  id: text("id").primaryKey(),
  senderId: text("senderId").references(() => user.id),
  mediumId: text("mediumId").references(() => medium.id),
  body: text("body").notNull(),
});

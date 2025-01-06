import { relations } from "drizzle-orm";
import { boolean, jsonb, pgTable, text } from "drizzle-orm/pg-core";

export const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  partner: boolean("partner").notNull(),
});

export const userRelations = relations(userTable, ({ many }) => ({
  messages: many(messageTable),
}));

export const mediumTable = pgTable("medium", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const mediumRelations = relations(mediumTable, ({ many }) => ({
  messages: many(messageTable),
}));

export const messageTable = pgTable("message", {
  id: text("id").primaryKey(),
  senderId: text("senderId").references(() => userTable.id),
  mediumId: text("mediumId").references(() => mediumTable.id),
  body: text("body").notNull(),
  metadata: jsonb("metadata").$type<{ key: string }>().notNull(),
});

export const messageRelations = relations(messageTable, ({ one }) => ({
  medium: one(mediumTable, {
    fields: [messageTable.mediumId],
    references: [mediumTable.id],
  }),
  sender: one(userTable, {
    fields: [messageTable.senderId],
    references: [userTable.id],
  }),
}));

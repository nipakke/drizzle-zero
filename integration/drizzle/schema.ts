import { relations, sql } from "drizzle-orm";
import { boolean, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const sharedColumns = {
  createdAt: timestamp("createdAt", {
    mode: "string",
    precision: 3,
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", {
    mode: "string",
    precision: 3,
    withTimezone: true,
  })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`now()`),
} as const;

export const userTable = pgTable("user", {
  ...sharedColumns,
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  partner: boolean("partner").notNull(),
});

// userTable._.columns.createdAt._.hasDefault

export const userRelations = relations(userTable, ({ many }) => ({
  messages: many(messageTable),
}));

export const mediumTable = pgTable("medium", {
  ...sharedColumns,
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const mediumRelations = relations(mediumTable, ({ many }) => ({
  messages: many(messageTable),
}));

export const messageTable = pgTable("message", {
  ...sharedColumns,
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

import { pgTable, text } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const User = pgTable('user', {
  id: text('id').primaryKey().notNull(),
  name: text('name'),
  email: text('email').notNull(),
  password: text('password'),
});

export const Account = pgTable('account', {
  id: text('id').primaryKey().notNull(),
  userId: text('userId').references(() => User.id),
  provider: text('provider').notNull(),
});

export const UserRelations = relations(User, ({ many }) => ({
  accounts: many(Account),
})); 
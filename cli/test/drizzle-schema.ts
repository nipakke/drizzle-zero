import { pgTable, text } from "drizzle-orm/pg-core";

export const User = pgTable("user", {
  id: text("id").primaryKey().notNull(),
  name: text("name"),
  email: text("email").$type<"email_value">().notNull(),
  password: text("password"),
});

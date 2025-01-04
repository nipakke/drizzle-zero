import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: serial("id").primaryKey(),
  name: text("name"),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const posts = pgTable("post", {
  id: serial("id").primaryKey(),
  content: text("content"),
  authorId: integer("author_id").references(() => users.id),
});

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));

export const comments = pgTable("comment", {
  id: serial("id").primaryKey(),
  text: text("text"),
  authorId: integer("author_id").references(() => users.id),
  postId: integer("post_id").references(() => posts.id),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
}));

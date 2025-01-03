import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: serial("id").primaryKey(),
  name: text("name"),
});

// TODO: this does not work because Zero does not support circular references
//
// export const usersRelations = relations(users, ({ many }) => ({
//   posts: many(posts),
// }));

export const posts = pgTable("post", {
  id: serial("id").primaryKey(),
  content: text("content"),
  authorId: integer("author_id"),
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
  authorId: integer("author_id"),
  postId: integer("post_id"),
});

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
}));

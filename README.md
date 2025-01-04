# drizzle-zero

Generate [Zero](https://zero.rocicorp.dev/) schemas from [Drizzle ORM](https://orm.drizzle.team) schemas.

## Installation

```bash
npm install drizzle-zero
# or
yarn add drizzle-zero
# or
pnpm add drizzle-zero
```

## Usage

Here's an example of how to convert a Drizzle schema to a Zero schema, complete with bidirectional relationships:

```ts
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
```

You can then convert this Drizzle schema to a Zero schema:

```ts
import { createSchema } from "@rocicorp/zero";
import { createZeroTableSchema } from "drizzle-zero";
import * as drizzleSchema from "./drizzle-schema";

// Convert to Zero schema
export const schema = createSchema(
  createZeroSchema(drizzleSchema, {
    version: 1,
    tables: {
      user: {
        id: true,
        name: true,
      },
      post: {
        id: true,
        content: true,
        author_id: true,
      },
      comment: {
        id: true,
        text: true,
        post_id: true,
        author_id: true,
      },
    },
  }),
);
```

## Features

- Convert Drizzle ORM schemas to Zero schemas
- Handles all Drizzle column types that are supported by Zero
- Type-safe schema generation
- Supports relationships:
  - One-to-one relationships
  - One-to-many relationships
  - Many-to-many relationships
  - Self-referential relationships

## License

MIT

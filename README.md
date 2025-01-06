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

Here's an example of how to convert a Drizzle schema to a Zero schema with bidirectional relationships:

```ts
import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: serial("id").primaryKey(),
  name: text("name"),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const posts = pgTable("post", {
  id: serial("id").primaryKey(),
  // this JSON type will be passed to Zero
  content: jsonb("content").$type<{ textValue: string }>().notNull(),
  authorId: integer("author_id").references(() => users.id),
});

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
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
    // Specify which tables and columns to include in the Zero schema
    // this allows for the "expand/migrate/contract" pattern recommended in the Zero docs
    // e.g. when a column is first added, it should be set to false, and then changed to true
    // once the migration has been run
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
    },
  }),
);

// Define permissions with the inferred types from Drizzle
type Schema = typeof schema;
type User = typeof schema.tables.user;

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  const allowIfUserIsSelf = (
    authData: AuthData,
    { cmp }: ExpressionBuilder<User>,
  ) => cmp("id", "=", authData.sub);

  // ...further permissions definitions
});
```

Use the generated Zero schema:

```tsx
import { useQuery, useZero } from "@rocicorp/zero/react";

function PostList({ selectedAuthorId }: { selectedAuthorId?: number }) {
  const z = useZero();

  // Build a query for posts with their authors
  let postsQuery = z.query.post.related("author").limit(100);

  // Filter by author if selectedAuthorId is provided
  if (selectedAuthorId) {
    postsQuery = postsQuery.where("author_id", "=", selectedAuthorId);
  }

  const [posts, postsDetail] = useQuery(postsQuery);

  return (
    <div>
      <div>
        {postsDetail.type === "complete"
          ? "Complete results"
          : "Partial results"}
      </div>
      <div>
        {posts.map((post) => (
          <div key={post.id} className="post">
            {/* this is the JSON type from Drizzle */}
            <h2>{post.content.textValue}</h2>
            <p>By: {post.author?.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Features

- Convert Drizzle ORM schemas to Zero schemas
- Handles all Drizzle column types that are supported by Zero
- Type-safe schema generation, with inferred types from Drizzle
- Sync a subset of tables
- Supports relationships:
  - One-to-one relationships
  - One-to-many relationships
  - Many-to-many relationships
  - Self-referential relationships

## License

MIT

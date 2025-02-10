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
import { pgTable, text, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
});

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const posts = pgTable("post", {
  id: text("id").primaryKey(),
  // this JSON type will be passed to Zero
  content: jsonb("content").$type<{ textValue: string }>().notNull(),
  authorId: text("author_id").references(() => users.id),
});

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));
```

Convert this Drizzle schema to a Zero schema:

```ts
import { createZeroSchema } from "drizzle-zero";
import * as drizzleSchema from "./drizzle-schema";

// Convert to Zero schema
export const schema = createZeroSchema(drizzleSchema, {
  version: 1,
  // Specify which tables and columns to include in the Zero schema.
  // This allows for the "expand/migrate/contract" pattern recommended in the Zero docs.
  // When a column is first added, it should be set to false, and then changed to true
  // once the migration has been run.

  // All tables/columns must be defined, but can be set to false to exclude them from the Zero schema.
  tables: {
    // this can be set to false
    // e.g. user: false,
    user: {
      id: true,
      name: true,
    },
    post: {
      // or this can be set to false
      // e.g. id: false,
      id: true,
      content: true,
      author_id: true,
    },
  },
});

// Define permissions with the inferred types from Drizzle
type Schema = typeof schema;
type User = Row<typeof schema.tables.user>;

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  const allowIfUserIsSelf = (
    authData: AuthData,
    { cmp }: ExpressionBuilder<Schema, "user">,
  ) => cmp("id", "=", authData.sub);

  // ...further permissions definitions
});
```

Use the generated Zero schema:

```tsx
import { useQuery, useZero } from "@rocicorp/zero/react";

function PostList() {
  const z = useZero();

  // Build a query for posts with their authors
  const postsQuery = z.query.post.related("author").limit(10);

  const [posts] = useQuery(postsQuery);

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id} className="post">
          {/* Access the JSON content from Drizzle */}
          <p>{post.content.textValue}</p>
          <p>By: {post.author?.name}</p>
        </div>
      ))}
    </div>
  );
}
```

## Many-to-Many Relationships

drizzle-zero supports many-to-many relationships with a junction table. You can configure them in two ways:

### Simple Configuration

```ts
export const schema = createZeroSchema(drizzleSchema, {
  version: 1,
  tables: {
    user: {
      id: true,
      name: true,
    },
    users_to_group: {
      user_id: true,
      group_id: true,
    },
    group: {
      id: true,
      name: true,
    },
  },
  manyToMany: {
    user: {
      // Simple format: [junction table, target table]
      groups: ["users_to_group", "group"],
    },
  },
});
```

Then query as usual, skipping the junction table:

```tsx
const userQuery = z.query.user.where("id", "=", "1").related("groups").one();

const [user] = useQuery(userQuery);

console.log(user);
// {
//   id: "user_1",
//   name: "User 1",
//   groups: [
//     { id: "group_1", name: "Group 1" },
//     { id: "group_2", name: "Group 2" },
//   ],
// }
```

### Extended Configuration

For more complex scenarios like self-referential relationships:

```ts
export const schema = createZeroSchema(drizzleSchema, {
  version: 1,
  tables: {
    user: {
      id: true,
      name: true,
    },
    friendship: {
      requesting_id: true,
      accepting_id: true,
    },
  },
  manyToMany: {
    user: {
      // Extended format with explicit field mappings
      friends: [
        {
          sourceField: ["id"],
          destTable: "friendship",
          destField: ["requesting_id"],
        },
        {
          sourceField: ["accepting_id"],
          destTable: "user",
          destField: ["id"],
        },
      ],
    },
  },
});
```

## Features

- Convert Drizzle ORM schemas to Zero schemas
  - Sync a subset of tables and columns
- Handles all Drizzle column types that are supported by Zero
- Type-safe schema generation with inferred types from Drizzle
- Supports relationships:
  - One-to-one relationships
  - One-to-many relationships
  - Many-to-many relationships with simple or extended configuration
  - Self-referential relationships

## License

[Unlicense](LICENSE)

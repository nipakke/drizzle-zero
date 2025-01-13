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
import { createSchema } from "@rocicorp/zero";
import { createZeroSchema } from "drizzle-zero";
import * as drizzleSchema from "./drizzle-schema";

// Convert to Zero schema
export const schema = createSchema(
  createZeroSchema(drizzleSchema, {
    version: 1,
    // Specify which tables and columns to include in the Zero schema.
    // This allows for the "expand/migrate/contract" pattern recommended in the Zero docs.
    // When a column is first added, it should be set to false, and then changed to true
    // once the migration has been run.
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

drizzle-zero supports many-to-many relationships with a junction table (in this case, `users_to_group`):

```ts
import { relations } from "drizzle-orm";
import { pgTable, text, primaryKey } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
});

export const groups = pgTable("group", {
  id: text("id").primaryKey(),
  name: text("name"),
});

// Junction table
export const usersToGroups = pgTable(
  "users_to_group",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    groupId: text("group_id")
      .notNull()
      .references(() => groups.id),
  },
  (t) => [primaryKey({ columns: [t.userId, t.groupId] })],
);

// Define the relationships
export const usersRelations = relations(users, ({ many }) => ({
  usersToGroups: many(usersToGroups),
}));

export const groupsRelations = relations(groups, ({ many }) => ({
  usersToGroups: many(usersToGroups),
}));

export const usersToGroupsRelations = relations(usersToGroups, ({ one }) => ({
  group: one(groups, {
    fields: [usersToGroups.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [usersToGroups.userId],
    references: [users.id],
  }),
}));
```

Configure the Zero schema to handle the many-to-many relationship:

```ts
export const schema = createSchema(
  createZeroSchema(drizzleSchema, {
    version: 1,
    tables: {
      user: {
        id: true,
        name: true,
      },
      group: {
        id: true,
        name: true,
      },
      users_to_group: {
        user_id: true,
        group_id: true,
      },
    },
    manyToMany: {
      // The origin table to define the many-to-many relationship on
      user: {
        // The key is the relation name and value is [junction table, target table]
        groups: ["users_to_group", "group"],
      },
    },
  }),
);
```

Then, skip the junction table when querying:

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

## Features

- Convert Drizzle ORM schemas to Zero schemas
  - Sync a subset of tables and columns
- Handles all Drizzle column types that are supported by Zero
- Type-safe schema generation with inferred types from Drizzle
- Supports relationships:
  - One-to-one relationships
  - One-to-many relationships
  - Many-to-many relationships (skipping junction tables)
  - Self-referential relationships

## License

MIT

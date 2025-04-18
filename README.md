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

## CLI

🚨 The 0.8.0 release of `drizzle-zero` ships with a CLI - this is the recommended way to use it going forward.
A future release will deprecate the code-based version. See below for the documentation.

## Usage

Here's an example of how to convert a Drizzle schema to a Zero schema with bidirectional relationships:

### Define Drizzle schema

You should have an existing Drizzle schema, e.g.:

```ts
import { relations } from "drizzle-orm";
import { pgTable, text, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  // custom types are supported for any column type!
  email: text("email").$type<`${string}@${string}`>().notNull(),
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

### Add `drizzle-zero.config.ts`

Create a new config file at `drizzle-zero.config.ts` with the columns you want to include in the CLI output:

```ts
import { drizzleZeroConfig } from "drizzle-zero";
import * as drizzleSchema from "./drizzle-schema";

// Define your configuration file for the CLI
export default drizzleZeroConfig(drizzleSchema, {
  // Specify which tables and columns to include in the Zero schema.
  // This allows for the "expand/migrate/contract" pattern recommended in the Zero docs.
  // When a column is first added, it should be set to false, and then changed to true
  // once the migration has been run.

  // All tables/columns must be defined, but can be set to false to exclude them from the Zero schema.
  // Column names match your Drizzle schema definitions
  tables: {
    // this can be set to false
    // e.g. user: false,
    users: {
      id: true,
      name: true,
    },
    posts: {
      // or this can be set to false
      // e.g. id: false,
      id: true,
      content: true,
      // Use the JavaScript field name (authorId), not the DB column name (author_id)
      authorId: true,
    },
  },
});
```

You can customize this config file path with `-c, --config <input-file>`.

### Add schema generation script

You can then add the schema generation script to your `package.json`:

```json
{
  "scripts": {
    "generate": "drizzle-zero generate --format",
    "postinstall": "npm generate"
  }
}
```

This command will, by default, output your schema to `zero-schema.gen.ts`.
You can customize this config file path with `-o, --output <output-file>`.

To specify a custom tsconfig file, use `-t, --tsconfig <tsconfig-file>`.
It will, by default, look for one in the current directory.

### Define Zero schema file

You can then import the `zero-schema.gen.ts` schema from your Zero `schema.ts`
and define permissions on top of it.

```ts
import { type Row, definePermissions } from "@rocicorp/zero";
import { schema } from "./zero-schema.gen";

export { schema };

export type Schema = typeof schema;
export type User = Row<typeof schema.tables.user>;
//            ^ {
//                readonly id: string;
//                readonly name: string;
//                readonly email: `${string}@${string}`;
//              }

export const permissions = definePermissions<{}, Schema>(schema, () => {
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
          <p>Email: {post.author?.email}</p>
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
export default drizzleZeroConfig(drizzleSchema, {
  tables: {
    user: {
      id: true,
      name: true,
    },
    usersToGroup: {
      userId: true,
      groupId: true,
    },
    group: {
      id: true,
      name: true,
    },
  },
  manyToMany: {
    user: {
      // Simple format: [junction table, target table]
      // Do not use the same name as any existing relationships
      groups: ["usersToGroup", "group"],
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
export default drizzleZeroConfig(drizzleSchema, {
  tables: {
    user: {
      id: true,
      name: true,
    },
    friendship: {
      requestingId: true,
      acceptingId: true,
    },
  },
  manyToMany: {
    user: {
      // Extended format with explicit field mappings
      friends: [
        {
          sourceField: ["id"],
          destTable: "friendship",
          destField: ["requestingId"],
        },
        {
          sourceField: ["acceptingId"],
          destTable: "user",
          destField: ["id"],
        },
      ],
    },
  },
});
```

## Features

- Output static schemas from the CLI
- Convert Drizzle ORM schemas to Zero schemas
  - Sync a subset of tables and columns
- Handles all Drizzle column types that are supported by Zero
- Type-safe schema generation with inferred types from Drizzle
- Supports relationships:
  - One-to-one relationships
  - One-to-many relationships
  - Many-to-many relationships with simple or extended configuration
  - Self-referential relationships
- Handles custom schemas and column mappings

## License

[Unlicense](LICENSE)

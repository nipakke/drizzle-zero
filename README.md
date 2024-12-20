# drizzle-zero

Generate [Zero](https://github.com/rocicorp/mono) schemas from [Drizzle ORM](https://orm.drizzle.team) schemas.

## Installation

```bash
npm install drizzle-zero
# or
yarn add drizzle-zero
# or
pnpm add drizzle-zero
```

## Usage

Here's a simple example of how to convert a Drizzle schema to a Zero schema:

```ts
import { pgTable, text } from 'drizzle-orm/pg-core';
import { createSchema, createTableSchema } from '@rocicorp/zero';
import { drizzleToZero } from 'drizzle-zero';

// Define your Drizzle table
const userTable = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

// Convert to Zero schema
const userSchema = createTableSchema(
  drizzleToZero(userTable, {
    id: true,
    name: true,
  })
);

// Create your Zero schema
export const schema = createSchema({
  version: 1,
  tables: {
    user: userSchema,
  },
});
```

## Features

- Convert Drizzle ORM schemas to Zero schemas
- Handles all Drizzle column types that are supported by Zero
- Type-safe schema generation

## Limitations

- Relationships are not supported yet

## License

MIT

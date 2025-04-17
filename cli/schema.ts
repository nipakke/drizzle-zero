import { Row } from "@rocicorp/zero";
import { drizzleSchema, Schema } from "./drizzle-zero.gen";

export const schema = drizzleSchema;

export type { Schema };
export type User = Row<Schema["tables"]["User"]>;

// ... permissions, etc.

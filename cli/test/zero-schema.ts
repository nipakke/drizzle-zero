import type { Row } from "@rocicorp/zero";
import { drizzleSchema, type Schema } from "./zero-schema.gen";

export const schema = drizzleSchema;

export type { Schema };
export type User = Row<Schema["tables"]["User"]>;

// ... permissions, etc.

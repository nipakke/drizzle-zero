import type { Row } from "@rocicorp/zero";
import type { Schema } from "./zero-schema.gen";

export * from "./zero-schema.gen";
export type User = Row<Schema["tables"]["User"]>;

// ... permissions, etc.

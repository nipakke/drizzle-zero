import { zeroSchema, zeroSchemaVersions } from "./pg";
import { createZeroSchema, type CreateZeroSchema } from "./relations";
import { createZeroTableSchema, type CreateZeroTableSchema } from "./tables";
import type { ColumnsConfig, ZeroColumns } from "./types";

export {
  createZeroSchema,
  createZeroTableSchema,
  zeroSchema,
  zeroSchemaVersions,
  type ColumnsConfig,
  type CreateZeroSchema,
  type CreateZeroTableSchema,
  type ZeroColumns,
};

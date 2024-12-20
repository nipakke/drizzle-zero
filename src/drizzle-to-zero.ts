type DrizzleDataType =
  | "number"
  | "bigint"
  | "boolean"
  | "date"
  | "string"
  | "json";

export const drizzleDataTypeToZeroType = {
  number: "number",
  bigint: "number",
  boolean: "boolean",
  date: "string",
  string: "string",
  json: "json",
} as const satisfies Record<DrizzleDataType, string>;

export type DrizzleDataTypeToZeroType = typeof drizzleDataTypeToZeroType;

type DrizzleColumnType = "PgNumeric";

export const drizzleColumnTypeToZeroType = {
  PgNumeric: "number",
} as const satisfies Record<DrizzleColumnType, string>;

export type DrizzleColumnTypeToZeroType = typeof drizzleColumnTypeToZeroType;

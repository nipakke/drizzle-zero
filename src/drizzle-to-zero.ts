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
  date: "number",
  string: "string",
  json: "json",
} as const satisfies Record<DrizzleDataType, string>;

export type DrizzleDataTypeToZeroType = typeof drizzleDataTypeToZeroType;

type DrizzleColumnType = "PgNumeric" | "PgDateString";

export const drizzleColumnTypeToZeroType = {
  PgNumeric: "number",
  PgDateString: "number",
} as const satisfies Record<DrizzleColumnType, string>;

export type DrizzleColumnTypeToZeroType = typeof drizzleColumnTypeToZeroType;

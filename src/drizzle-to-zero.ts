type ColumnDataType =
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
} as const satisfies Record<ColumnDataType, string>;

export type DrizzleDataTypeToZeroType = typeof drizzleDataTypeToZeroType;

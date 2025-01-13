import type { Column, Relations, Table } from "drizzle-orm";

/**
 * Extracts the table name from a Drizzle table type.
 * @template TTable The Drizzle table type
 */
export type TableName<TTable extends Table> = TTable["_"]["name"];

/**
 * Extracts the column name from a Drizzle column type.
 * @template TColumn The Drizzle column type
 */
export type ColumnName<TColumn extends Column> = TColumn["_"]["name"];

/**
 * Gets all columns from a Drizzle table type.
 * @template TTable The Drizzle table type
 */
export type Columns<TTable extends Table> = TTable["_"]["columns"];

/**
 * Gets all column names from a Drizzle table type.
 * @template TTable The Drizzle table type
 */
export type ColumnNames<TTable extends Table> = ColumnName<
  Columns<TTable>[keyof Columns<TTable>]
>;

/**
 * Helper type that extracts primary key columns from a table.
 * @template T The Drizzle table type
 */
type PrimaryKeyColumns<T extends Table> = {
  [K in keyof Columns<T>]: Columns<T>[K]["_"]["isPrimaryKey"] extends true
    ? ColumnName<Columns<T>[K]>
    : never;
}[keyof Columns<T>];

/**
 * Finds the primary key(s) from a table. Returns either:
 * - A readonly tuple of the primary key column name if one exists
 * - A readonly array of at least one string if no primary key is defined
 * @template T The Drizzle table type
 */
export type FindPrimaryKeyFromTable<T extends Table> = [
  PrimaryKeyColumns<T>,
] extends [never]
  ? Readonly<AtLeastOne<string>>
  : readonly [PrimaryKeyColumns<T>];

/**
 * Finds relations defined for a specific table in the Drizzle schema.
 * @template TDrizzleSchema The complete Drizzle schema
 * @template TTable The table to find relations for
 */
export type FindRelationsForTable<
  TDrizzleSchema extends Record<string, unknown>,
  TTable extends Table,
> = Extract<
  TDrizzleSchema[{
    [P in keyof TDrizzleSchema]: TDrizzleSchema[P] extends Relations<
      TableName<TTable>
    >
      ? P
      : never;
  }[keyof TDrizzleSchema]],
  Relations<TableName<TTable>>
>;

/**
 * Type guard that checks if a type is a Table with a specific name.
 * @template T The type to check
 * @template Name The name to check for
 */
type IsTableWithName<T, Name extends string> = T extends { _: { name: Name } }
  ? T extends Table<any>
    ? true
    : false
  : false;

/**
 * Finds a table in the schema by its name.
 * @template TDrizzleSchema The complete Drizzle schema
 * @template Name The name of the table to find
 */
export type FindTableByName<
  TDrizzleSchema extends Record<string, unknown>,
  Name extends string,
> = Extract<
  {
    [P in keyof TDrizzleSchema]: IsTableWithName<
      TDrizzleSchema[P],
      Name
    > extends true
      ? TDrizzleSchema[P]
      : never;
  }[keyof TDrizzleSchema],
  Table<any>
>;

/**
 * Extracts the configuration type from a Relations type.
 * @template T The Relations type to extract config from
 */
export type RelationsConfig<T extends Relations> = ReturnType<T["config"]>;

/**
 * Utility type that flattens an object type by removing any intermediate interfaces.
 * @template T The type to flatten
 */
export type Flatten<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Utility type that ensures an array has at least one element.
 * @template T The type of elements in the array
 */
export type AtLeastOne<T> = [T, ...T[]];

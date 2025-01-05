import type { JSONValue } from "@rocicorp/zero";
import type { Column, Relations, Table } from "drizzle-orm";
import type {
  DrizzleColumnTypeToZeroType,
  DrizzleDataTypeToZeroType,
} from "./drizzle-to-zero";

export type TableName<T extends Table> = T["_"]["name"];
export type ColumnName<C extends Column> = C["_"]["name"];

type Columns<T extends Table> = T["_"]["columns"];
export type ColumnNames<T extends Table> = ColumnName<
  Columns<T>[keyof Columns<T>]
>;
type ColumnDefinition<T extends Table, K extends ColumnNames<T>> = {
  [C in keyof Columns<T>]: ColumnName<Columns<T>[C]> extends K
    ? Columns<T>[C]
    : never;
}[keyof Columns<T>];

export type RelationsForTable<T extends Table> = Relations<TableName<T>>;

export type FindPrimaryKeyFromTable<TTable extends Table> = {
  [K in keyof Columns<TTable>]: Columns<TTable>[K]["_"]["isPrimaryKey"] extends true
    ? ColumnName<Columns<TTable>[K]>
    : never;
}[keyof Columns<TTable>] extends never
  ? readonly [string, ...string[]]
  : readonly [
      {
        [K in keyof Columns<TTable>]: Columns<TTable>[K]["_"]["isPrimaryKey"] extends true
          ? ColumnName<Columns<TTable>[K]>
          : never;
      }[keyof Columns<TTable>],
    ];

type TypeOverride<TCustomType> = {
  readonly type: "string" | "number" | "boolean" | "json";
  readonly optional: boolean;
  readonly customType: TCustomType;
  readonly kind?: "enum";
};

/**
 * Specify the columns to be included in sync.
 *
 * @example
 * ```ts
 * {
 *   id: true,
 *   name: true,
 * }
 * ```
 */
export type ColumnsConfig<T extends Table> = {
  readonly [K in ColumnNames<T>]:
    | boolean
    | TypeOverride<
        ZeroTypeToTypescriptType[DrizzleDataTypeToZeroType[Columns<T>[K]["dataType"]]]
      >;
};

export type ZeroTypeToTypescriptType = {
  number: number;
  boolean: boolean;
  date: string;
  string: string;
  json: JSONValue;
};

type ZeroMappedColumnType<
  T extends Table,
  K extends keyof Columns<T>,
> = ColumnDefinition<T, K>["_"] extends {
  columnType: keyof DrizzleColumnTypeToZeroType;
}
  ? DrizzleColumnTypeToZeroType[ColumnDefinition<T, K>["_"]["columnType"]]
  : DrizzleDataTypeToZeroType[ColumnDefinition<T, K>["dataType"]];

type ZeroMappedCustomType<
  T extends Table,
  K extends ColumnNames<T>,
> = ColumnDefinition<T, K>["_"] extends {
  columnType: "PgEnumColumn";
}
  ? ColumnDefinition<T, K>["_"]["data"]
  : ColumnDefinition<T, K>["_"] extends { $type: any }
    ? ColumnDefinition<T, K>["_"]["$type"]
    : ZeroTypeToTypescriptType[ZeroMappedColumnType<T, K>];

type ZeroColumnDefinition<T extends Table, K extends ColumnNames<T>> = Readonly<
  {
    readonly optional: ColumnDefinition<T, K>["_"]["notNull"] extends true
      ? boolean // false
      : boolean; // true;
    readonly type: ZeroMappedColumnType<T, K>;
    readonly customType: ZeroMappedCustomType<T, K>;
  } & (ColumnDefinition<T, K>["_"] extends { columnType: "PgEnumColumn" }
    ? { readonly kind: "enum" }
    : {})
>;

export type ZeroColumns<T extends Table, C extends ColumnsConfig<T>> = {
  readonly [K in keyof C as C[K] extends true | TypeOverride<any>
    ? K
    : never]: K extends ColumnNames<T>
    ? C[K] extends TypeOverride<any>
      ? C[K]
      : C[K] extends true
        ? ZeroColumnDefinition<T, K>
        : never
    : never;
};

export type Flatten<T> = {
  [K in keyof T]: T[K];
} & {};

export type AtLeastOne<T> = [T, ...T[]];

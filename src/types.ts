import type { JSONValue } from "@rocicorp/zero";
import type { Column, Table } from "drizzle-orm";
import type {
  DrizzleColumnTypeToZeroType,
  DrizzleDataTypeToZeroType,
} from "./drizzle-to-zero";

export type TableName<T extends Table> = T["_"]["name"];
export type ColumnName<C extends Column> = C["_"]["name"];

export type Columns<T extends Table> = T["_"]["columns"];
export type ColumnNames<T extends Table> = ColumnName<
  Columns<T>[keyof Columns<T>]
>;
type ColumnDefinition<T extends Table, K extends ColumnNames<T>> = {
  [C in keyof Columns<T>]: ColumnName<Columns<T>[C]> extends K
    ? Columns<T>[C]
    : never;
}[keyof Columns<T>];

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
  readonly [K in ColumnNames<T>]?:
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
  CD extends ColumnDefinition<T, K>["_"] = ColumnDefinition<T, K>["_"],
> = CD extends {
  columnType: keyof DrizzleColumnTypeToZeroType;
}
  ? DrizzleColumnTypeToZeroType[CD["columnType"]]
  : DrizzleDataTypeToZeroType[CD["dataType"]];

type ZeroMappedCustomType<
  T extends Table,
  K extends ColumnNames<T>,
  CD extends ColumnDefinition<T, K>["_"] = ColumnDefinition<T, K>["_"],
> = CD extends {
  columnType: "PgEnumColumn";
}
  ? CD["data"]
  : CD extends { $type: any }
    ? CD["$type"]
    : ZeroTypeToTypescriptType[ZeroMappedColumnType<T, K>];

type ZeroColumnDefinition<
  T extends Table,
  K extends ColumnNames<T>,
  CD extends ColumnDefinition<T, K>["_"] = ColumnDefinition<T, K>["_"],
> = Readonly<
  {
    readonly optional: CD extends {
      hasDefault: true;
    }
      ? true : CD extends { notNull: true } ? false : true;
    readonly type: ZeroMappedColumnType<T, K>;
    readonly customType: ZeroMappedCustomType<T, K>;
  } & (CD extends { columnType: "PgEnumColumn" }
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

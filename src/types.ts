import type { JSONValue } from "@rocicorp/zero";
import type { Column, Table } from "drizzle-orm";
import type {
  DrizzleColumnTypeToZeroType,
  DrizzleDataTypeToZeroType,
} from "./drizzle-to-zero";

export type TableName<TTable extends Table> = TTable["_"]["name"];
export type ColumnName<TColumn extends Column> = TColumn["_"]["name"];

export type Columns<TTable extends Table> = TTable["_"]["columns"];
export type ColumnNames<TTable extends Table> = ColumnName<
  Columns<TTable>[keyof Columns<TTable>]
>;
type ColumnDefinition<TTable extends Table, K extends ColumnNames<TTable>> = {
  [C in keyof Columns<TTable>]: ColumnName<Columns<TTable>[C]> extends K
    ? Columns<TTable>[C]
    : never;
}[keyof Columns<TTable>];

type PrimaryKeyColumns<T extends Table> = {
  [K in keyof Columns<T>]: Columns<T>[K]["_"]["isPrimaryKey"] extends true
    ? ColumnName<Columns<T>[K]>
    : never;
}[keyof Columns<T>];

export type FindPrimaryKeyFromTable<T extends Table> = [
  PrimaryKeyColumns<T>,
] extends [never]
  ? Readonly<AtLeastOne<string>>
  : readonly [PrimaryKeyColumns<T>];

/**
 * The type override for a column.
 */
type TypeOverride<TCustomType> = {
  readonly type: "string" | "number" | "boolean" | "json";
  readonly optional: boolean;
  readonly customType: TCustomType;
  readonly kind?: "enum";
};

/**
 * The configuration for the columns to include in the Zero schema.
 */
export type ColumnsConfig<TTable extends Table> = {
  /**
   * The columns to include in the Zero schema.
   */
  readonly [KColumn in ColumnNames<TTable>]?:
    | boolean
    | TypeOverride<
        ZeroTypeToTypescriptType[DrizzleDataTypeToZeroType[Columns<TTable>[KColumn]["dataType"]]]
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
  TTable extends Table,
  KColumn extends ColumnNames<TTable>,
  CD extends ColumnDefinition<TTable, KColumn>["_"] = ColumnDefinition<
    TTable,
    KColumn
  >["_"],
> = CD extends {
  columnType: keyof DrizzleColumnTypeToZeroType;
}
  ? DrizzleColumnTypeToZeroType[CD["columnType"]]
  : DrizzleDataTypeToZeroType[CD["dataType"]];

type ZeroMappedCustomType<
  TTable extends Table,
  KColumn extends ColumnNames<TTable>,
  CD extends ColumnDefinition<TTable, KColumn>["_"] = ColumnDefinition<
    TTable,
    KColumn
  >["_"],
> = CD extends {
  columnType: "PgEnumColumn";
}
  ? CD["data"]
  : CD extends { $type: any }
    ? CD["$type"]
    : ZeroTypeToTypescriptType[ZeroMappedColumnType<TTable, KColumn>];

type ZeroColumnDefinition<
  TTable extends Table,
  KColumn extends ColumnNames<TTable>,
  CD extends ColumnDefinition<TTable, KColumn>["_"] = ColumnDefinition<
    TTable,
    KColumn
  >["_"],
> = Readonly<
  {
    readonly optional: CD extends {
      hasDefault: true;
      // Zero doesn't support runtime defaults yet
      hasRuntimeDefault: false;
    }
      ? true
      : CD extends { notNull: true }
        ? false
        : true;
    readonly type: ZeroMappedColumnType<TTable, KColumn>;
    readonly customType: ZeroMappedCustomType<TTable, KColumn>;
  } & (CD extends { columnType: "PgEnumColumn" }
    ? { readonly kind: "enum" }
    : {})
>;

export type ZeroColumns<
  TTable extends Table,
  TColumnConfig extends ColumnsConfig<TTable>,
> = {
  readonly [KColumn in keyof TColumnConfig as TColumnConfig[KColumn] extends
    | true
    | TypeOverride<any>
    ? KColumn
    : never]: KColumn extends ColumnNames<TTable>
    ? TColumnConfig[KColumn] extends TypeOverride<any>
      ? TColumnConfig[KColumn]
      : TColumnConfig[KColumn] extends true
        ? ZeroColumnDefinition<TTable, KColumn>
        : never
    : never;
};

export type Flatten<T> = {
  [K in keyof T]: T[K];
} & {};

export type AtLeastOne<T> = [T, ...T[]];

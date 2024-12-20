import type { JSONValue } from "@rocicorp/zero";
import type { Table } from "drizzle-orm";
import type { DrizzleDataTypeToZeroType } from "./drizzle-to-zero";

type Columns<T extends Table> = T["_"]["columns"];
type ColumnNames<T extends Table> = keyof Columns<T>;
type ColumnDefinition<
  T extends Table,
  K extends ColumnNames<T>,
> = Columns<T>[K];

export type FindPrimaryKeyFromTable<TTable extends Table> = {
  [K in ColumnNames<TTable>]: Columns<TTable>[K]["_"]["isPrimaryKey"] extends true
    ? K
    : never;
}[ColumnNames<TTable>];

type TypeOverride<TCustomType> = {
  readonly type: "string" | "number" | "boolean" | "json";
  readonly optional: boolean;
  readonly customType: TCustomType;
};

export type ColumnsConfig<
  T extends Table,
  PK extends FindPrimaryKeyFromTable<T>,
> = {
  readonly [K in ColumnNames<T>]?:
    | boolean
    | TypeOverride<
        ZeroTypeToTypescriptType[DrizzleDataTypeToZeroType[Columns<T>[K]["dataType"]]]
      >;
} & {
  readonly [K in PK]:
    | boolean
    | TypeOverride<
        ZeroTypeToTypescriptType[DrizzleDataTypeToZeroType[Columns<T>[K]["dataType"]]]
      >;
};

export type ZeroTypeToTypescriptType = {
  number: number;
  bigint: number;
  boolean: boolean;
  date: string;
  string: string;
  json: JSONValue;
};

type ZeroColumnDefinition<T extends Table, K extends ColumnNames<T>> = {
  readonly optional: ColumnDefinition<T, K>["_"]["notNull"] extends true
    ? false
    : true;
  readonly type: DrizzleDataTypeToZeroType[ColumnDefinition<T, K>["dataType"]];
  readonly customType: ColumnDefinition<T, K>["_"] extends { $type: any }
    ? ColumnDefinition<T, K>["_"]["$type"]
    : ZeroTypeToTypescriptType[DrizzleDataTypeToZeroType[ColumnDefinition<
        T,
        K
      >["dataType"]]];
};

export type ZeroColumns<
  T extends Table,
  C extends ColumnsConfig<T, FindPrimaryKeyFromTable<T>>,
> = {
  [K in keyof C]: K extends ColumnNames<T>
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

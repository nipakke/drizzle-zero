import type { JSONValue } from "@rocicorp/zero";
import type { Table } from "drizzle-orm";
import type {
  DrizzleDataTypeToZeroType,
  DrizzleColumnTypeToZeroType,
} from "./drizzle-to-zero";

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
}[ColumnNames<TTable>] extends never
  ? readonly [string, ...string[]]
  : {
      [K in ColumnNames<TTable>]: Columns<TTable>[K]["_"]["isPrimaryKey"] extends true
        ? K
        : never;
    }[ColumnNames<TTable>];

type TypeOverride<TCustomType> = {
  readonly type: "string" | "number" | "boolean" | "json";
  readonly optional: boolean;
  readonly customType: TCustomType;
};

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
  K extends ColumnNames<T>,
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
    optional: ColumnDefinition<T, K>["_"]["notNull"] extends true
      ? boolean // false
      : boolean; // true;
    type: ZeroMappedColumnType<T, K>;
    customType: ZeroMappedCustomType<T, K>;
  } & (ColumnDefinition<T, K>["_"] extends { columnType: "PgEnumColumn" }
    ? { kind: "enum" }
    : {})
>;

export type ZeroColumns<T extends Table, C extends ColumnsConfig<T>> = {
  readonly [K in keyof C]: K extends ColumnNames<T>
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

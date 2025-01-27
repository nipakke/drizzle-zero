import {
  type ColumnBuilder,
  type TableBuilderWithColumns,
  boolean as zeroBoolean,
  enumeration as zeroEnumeration,
  json as zeroJson,
  number as zeroNumber,
  string as zeroString,
  table as zeroTable,
} from "@rocicorp/zero";
import { getTableColumns, getTableName, Table } from "drizzle-orm";
import { getTableConfigForDatabase } from "./db";
import {
  type DrizzleColumnTypeToZeroType,
  drizzleColumnTypeToZeroType,
  type DrizzleDataTypeToZeroType,
  drizzleDataTypeToZeroType,
  type ZeroTypeToTypescriptType,
} from "./drizzle-to-zero";
import type {
  ColumnName,
  ColumnNames,
  Columns,
  FindPrimaryKeyFromTable,
  TableName,
} from "./types";
import { typedEntries } from "./util";

/**
 * Represents a column definition from a Drizzle table, filtered by column name.
 * @template TTable The Drizzle table type
 * @template K The column name to filter by
 */
type ColumnDefinition<TTable extends Table, K extends ColumnNames<TTable>> = {
  [C in keyof Columns<TTable>]: ColumnName<Columns<TTable>[C]> extends K
    ? Columns<TTable>[C]
    : never;
}[keyof Columns<TTable>];

/**
 * The type override for a column.
 * Used to customize how a Drizzle column is mapped to a Zero schema.
 * @template TCustomType The TypeScript type that corresponds to the Zero type
 */
type TypeOverride<TCustomType> = {
  readonly type: "string" | "number" | "boolean" | "json";
  readonly optional: boolean;
  readonly customType: TCustomType;
  readonly kind?: "enum";
};

/**
 * Configuration for specifying which columns to include in the Zero schema and how to map them.
 * @template TTable The Drizzle table type
 */
export type ColumnsConfig<TTable extends Table> = {
  /**
   * The columns to include in the Zero schema.
   * Set to true to use default mapping, or provide a TypeOverride for custom mapping.
   */
  readonly [KColumn in ColumnNames<TTable>]?:
    | boolean
    | ColumnBuilder<
        TypeOverride<
          ZeroTypeToTypescriptType[DrizzleDataTypeToZeroType[Columns<TTable>[KColumn]["dataType"]]]
        >
      >;
};

/**
 * Maps a Drizzle column type to its corresponding Zero type.
 * @template TTable The Drizzle table type
 * @template KColumn The column name
 * @template CD The column definition type
 */
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

/**
 * Maps a Drizzle column to its corresponding TypeScript type in Zero.
 * Handles special cases like enums and custom types.
 * @template TTable The Drizzle table type
 * @template KColumn The column name
 * @template CD The column definition type
 */
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

/**
 * Defines the structure of a column in the Zero schema.
 * @template TTable The Drizzle table type
 * @template KColumn The column name
 * @template CD The column definition type
 */
type ZeroColumnDefinition<
  TTable extends Table,
  KColumn extends ColumnNames<TTable>,
  CD extends ColumnDefinition<TTable, KColumn>["_"] = ColumnDefinition<
    TTable,
    KColumn
  >["_"],
  BaseDefinition extends {
    optional: false;
    type: ZeroMappedColumnType<TTable, KColumn>;
    customType: ZeroMappedCustomType<TTable, KColumn>;
  } = {
    optional: false;
    type: ZeroMappedColumnType<TTable, KColumn>;
    customType: ZeroMappedCustomType<TTable, KColumn>;
  },
> = CD extends {
  hasDefault: true;
  hasRuntimeDefault: false;
}
  ? Omit<BaseDefinition, "optional"> & { optional: true }
  : CD extends { notNull: true }
    ? BaseDefinition
    : Omit<BaseDefinition, "optional"> & { optional: true };

/**
 * Maps the columns configuration to their Zero schema definitions.
 * @template TTable The Drizzle table type
 * @template TColumnConfig The columns configuration
 */
export type ZeroColumns<
  TTable extends Table,
  TColumnConfig extends ColumnsConfig<TTable>,
> = {
  [KColumn in keyof TColumnConfig as TColumnConfig[KColumn] extends
    | true
    | ColumnBuilder<any>
    ? KColumn
    : never]: KColumn extends ColumnNames<TTable>
    ? TColumnConfig[KColumn] extends ColumnBuilder<any>
      ? TColumnConfig[KColumn]["schema"]
      : TColumnConfig[KColumn] extends true
        ? ZeroColumnDefinition<TTable, KColumn>
        : never
    : never;
};

/**
 * Represents the underlying schema for a Zero table.
 * @template TTable The Drizzle table type
 * @template TColumnConfig The columns configuration
 */
export type ZeroTableBuilderSchema<
  TTable extends Table = Table,
  TColumnConfig extends ColumnsConfig<TTable> = ColumnsConfig<TTable>,
> = {
  name: TableName<TTable>;
  primaryKey: any; // FindPrimaryKeyFromTable<TTable>;
  columns: ZeroColumns<TTable, TColumnConfig>;
};

/**
 * Represents the complete Zero schema for a Drizzle table.
 * @template TTable The Drizzle table type
 * @template TColumnConfig The columns configuration
 */
type ZeroTableBuilder<
  TTable extends Table = Table,
  TColumnConfig extends ColumnsConfig<TTable> = ColumnsConfig<TTable>,
> = TableBuilderWithColumns<
  Readonly<ZeroTableBuilderSchema<TTable, TColumnConfig>>
>;

/**
 * Creates a Zero schema from a Drizzle table definition.
 * @template TTable The Drizzle table type
 * @template TColumnConfig The columns configuration type
 * @param table The Drizzle table instance
 * @param columns Configuration specifying which columns to include and how to map them
 * @returns A Zero schema definition for the table
 * @throws {Error} If primary key configuration is invalid or column types are unsupported
 */
const createZeroTableBuilder = <
  TTable extends Table,
  TColumnConfig extends ColumnsConfig<TTable>,
>(
  table: TTable,
  columns: TColumnConfig,
): ZeroTableBuilder<TTable, TColumnConfig> => {
  const tableColumns = getTableColumns(table);
  const tableConfig = getTableConfigForDatabase(table);

  const primaryKeysFromColumns: string[] = [];

  const columnsMapped = typedEntries(tableColumns).reduce(
    (acc, [_key, column]) => {
      const name = column.name;

      const columnConfig = columns[name as keyof TColumnConfig];

      if (
        typeof columnConfig !== "boolean" &&
        typeof columnConfig !== "object" &&
        typeof columnConfig !== "undefined"
      ) {
        throw new Error(
          `drizzle-zero: Invalid column config for column ${name} - expected boolean or object but was ${typeof columnConfig}`,
        );
      }

      if (!columnConfig) {
        return acc;
      }

      if (typeof columnConfig !== "boolean") {
        columnConfig.schema.customType;
      }

      const type =
        drizzleColumnTypeToZeroType[
          column.columnType as keyof DrizzleColumnTypeToZeroType
        ] ??
        drizzleDataTypeToZeroType[
          column.dataType as keyof DrizzleDataTypeToZeroType
        ] ??
        null;

      if (type === null) {
        throw new Error(
          `drizzle-zero: Unsupported column type: ${column.columnType} (${column.dataType}). It must be supported by Zero, e.g.: ${Object.keys({ ...drizzleDataTypeToZeroType, ...drizzleColumnTypeToZeroType }).join(" | ")}`,
        );
      }

      const isColumnOptional =
        typeof columnConfig === "boolean"
          ? column.hasDefault && column.defaultFn === undefined
            ? true
            : !column.notNull
          : columnConfig.schema.optional;

      if (column.primary) {
        if (isColumnOptional) {
          throw new Error(
            `drizzle-zero: Primary key column ${name} cannot have a default value defined on the database level and cannot be optional, since auto-incrementing primary keys can cause race conditions with concurrent inserts. See the Zero docs for more information.`,
          );
        }

        primaryKeysFromColumns.push(name);
      }

      if (columnConfig && typeof columnConfig !== "boolean") {
        return {
          ...acc,
          [name]: columnConfig,
        };
      }

      const schemaValue = column.enumValues
        ? zeroEnumeration<typeof column.enumValues>()
        : type === "string"
          ? zeroString()
          : type === "number"
            ? zeroNumber()
            : type === "json"
              ? zeroJson()
              : zeroBoolean();

      return {
        ...acc,
        [name]: isColumnOptional ? schemaValue.optional() : schemaValue,
      };
    },
    {} as Record<string, any>,
  );

  const tableName = getTableName(table);

  const primaryKeys = [
    ...primaryKeysFromColumns,
    ...tableConfig.primaryKeys
      .flatMap((k) => k.columns.map((c) => c.name))
      .filter(Boolean),
  ];

  if (!primaryKeys.length) {
    throw new Error(
      `drizzle-zero: No primary keys found in table - ${tableName}. Did you forget to define a primary key?`,
    );
  }

  const zeroTableSchemaBuilder = zeroTable(tableName)
    .columns(columnsMapped)
    .primaryKey(...(primaryKeys as unknown as FindPrimaryKeyFromTable<TTable>));

  return zeroTableSchemaBuilder as ZeroTableBuilder<TTable, TColumnConfig>;
};

export { createZeroTableBuilder, type ZeroTableBuilder };

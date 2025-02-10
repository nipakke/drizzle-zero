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
  ColumnNames,
  Columns,
  FindPrimaryKeyFromTable,
  Flatten,
} from "./types";
import { typedEntries } from "./util";

/**
 * Represents a column definition from a Drizzle table, filtered by column name.
 * @template TTable The Drizzle table type
 * @template K The column name to filter by
 */
type ColumnDefinition<TTable extends Table, K extends ColumnNames<TTable>> = {
  [C in keyof Columns<TTable>]: C extends K ? Columns<TTable>[C] : never;
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
export type ColumnsConfig<TTable extends Table> =
  | false
  | Flatten<{
      /**
       * The columns to include in the Zero schema.
       * Set to true to use default mapping, or provide a TypeOverride for custom mapping.
       */
      readonly [KColumn in ColumnNames<TTable>]:
        | boolean
        | ColumnBuilder<
            TypeOverride<
              ZeroTypeToTypescriptType[DrizzleDataTypeToZeroType[Columns<TTable>[KColumn]["dataType"]]]
            >
          >;
    }>;

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
  BaseOptional extends Omit<BaseDefinition, "optional"> & {
    optional: true;
  } = Omit<BaseDefinition, "optional"> & { optional: true },
> = (CD extends {
  hasDefault: true;
  hasRuntimeDefault: false;
}
  ? BaseOptional
  : CD extends { notNull: true }
    ? BaseDefinition
    : Omit<BaseDefinition, "optional"> & { optional: true }) &
  (CD extends { name: KColumn } ? {} : { serverName: string });

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
        ? Flatten<ZeroColumnDefinition<TTable, KColumn>>
        : never
    : never;
};

/**
 * Represents the underlying schema for a Zero table.
 * @template TTableName The name of the table
 * @template TTable The Drizzle table type
 * @template TColumnConfig The columns configuration
 */
export type ZeroTableBuilderSchema<
  TTableName extends string,
  TTable extends Table,
  TColumnConfig extends ColumnsConfig<TTable>,
> = {
  name: TTableName;
  primaryKey: any; // FindPrimaryKeyFromTable<TTable>;
  columns: Flatten<ZeroColumns<TTable, TColumnConfig>>;
};

/**
 * Represents the complete Zero schema for a Drizzle table.
 * @template TTable The Drizzle table type
 * @template TColumnConfig The columns configuration
 */
type ZeroTableBuilder<
  TTableName extends string,
  TTable extends Table,
  TColumnConfig extends ColumnsConfig<TTable>,
> = TableBuilderWithColumns<
  Readonly<ZeroTableBuilderSchema<TTableName, TTable, TColumnConfig>>
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
  TTableName extends string,
  TTable extends Table,
  TColumnConfig extends ColumnsConfig<TTable>,
>(
  /**
   * The mapped name of the table
   */
  tableName: TTableName,
  /**
   * The Drizzle table instance
   */
  table: TTable,
  /**
   * Configuration specifying which columns to include and how to map them
   */
  columns: TColumnConfig,
): ZeroTableBuilder<TTableName, TTable, TColumnConfig> => {
  const actualTableName = getTableName(table);
  const tableColumns = getTableColumns(table);
  const tableConfig = getTableConfigForDatabase(table);

  const primaryKeysFromColumns: string[] = [];

  const columnsMapped = typedEntries(tableColumns).reduce(
    (acc, [key, column]) => {
      const columnConfig = columns[key as keyof TColumnConfig];

      if (columnConfig === false) {
        return acc;
      }

      if (
        typeof columnConfig !== "boolean" &&
        typeof columnConfig !== "object" &&
        typeof columnConfig !== "undefined"
      ) {
        throw new Error(
          `drizzle-zero: Invalid column config for column ${column.name} - expected boolean or ColumnBuilder but was ${typeof columnConfig}`,
        );
      }

      const isColumnBuilder = (value: unknown): value is ColumnBuilder<any> =>
        typeof value === "object" && value !== null && "schema" in value;

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
          : isColumnBuilder(columnConfig)
            ? columnConfig.schema.optional
            : false;

      if (column.primary) {


        primaryKeysFromColumns.push(String(key));
      }

      if (columnConfig && typeof columnConfig !== "boolean") {
        return {
          ...acc,
          [key]: columnConfig,
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

      const schemaValueWithFrom =
        column.name !== key ? schemaValue.from(column.name) : schemaValue;

      return {
        ...acc,
        [key]: isColumnOptional
          ? schemaValueWithFrom.optional()
          : schemaValueWithFrom,
      };
    },
    {} as Record<string, any>,
  );

  const primaryKeys = [
    ...primaryKeysFromColumns,
    ...tableConfig.primaryKeys.flatMap((k) =>
      k.columns.map((c) =>
        getDrizzleColumnKeyFromColumnName({
          columnName: c.name,
          table: c.table,
        }),
      ),
    ),
  ];

  if (!primaryKeys.length) {
    throw new Error(
      `drizzle-zero: No primary keys found in table - ${actualTableName}. Did you forget to define a primary key?`,
    );
  }

  const resolvedTableName = tableConfig.schema
    ? `${tableConfig.schema}.${actualTableName}`
    : actualTableName;

  const zeroBuilder = zeroTable(tableName);

  const zeroBuilderWithFrom =
    resolvedTableName !== tableName
      ? zeroBuilder.from(resolvedTableName)
      : zeroBuilder;

  return zeroBuilderWithFrom
    .columns(columnsMapped)
    .primaryKey(
      ...(primaryKeys as unknown as FindPrimaryKeyFromTable<TTable>),
    ) as ZeroTableBuilder<TTableName, TTable, TColumnConfig>;
};

/**
 * Get the key of a column in the schema from the column name.
 * @param columnName - The name of the column to get the key for
 * @param table - The table to get the column key from
 * @returns The key of the column in the schema
 */
const getDrizzleColumnKeyFromColumnName = ({
  columnName,
  table,
}: {
  columnName: string;
  table: Table;
}) => {
  const tableColumns = getTableColumns(table);

  return typedEntries(tableColumns).find(
    ([_name, column]) => column.name === columnName,
  )?.[0]!;
};

export {
  createZeroTableBuilder,
  getDrizzleColumnKeyFromColumnName,
  type ZeroTableBuilder,
};

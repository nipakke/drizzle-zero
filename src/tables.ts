import { getTableColumns, getTableName, Table } from "drizzle-orm";
import { getTableConfigForDatabase } from "./db";
import {
  type DrizzleColumnTypeToZeroType,
  drizzleColumnTypeToZeroType,
  type DrizzleDataTypeToZeroType,
  drizzleDataTypeToZeroType,
} from "./drizzle-to-zero";
import type {
  ColumnsConfig,
  FindPrimaryKeyFromTable,
  Flatten,
  TableName,
  ZeroColumns,
  ZeroTypeToTypescriptType,
} from "./types";
import { typedEntries } from "./util";

type CreateZeroTableSchema<
  TTable extends Table = Table,
  TColumnConfig extends ColumnsConfig<TTable> = ColumnsConfig<TTable>,
> = Flatten<{
  readonly tableName: TableName<TTable>;
  readonly primaryKey: FindPrimaryKeyFromTable<TTable>;
  readonly columns: ZeroColumns<TTable, TColumnConfig>;
}>;

const createZeroTableSchema = <
  TTable extends Table,
  TColumnConfig extends ColumnsConfig<TTable>,
>(
  table: TTable,
  columns: TColumnConfig,
): CreateZeroTableSchema<TTable, TColumnConfig> => {
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
          `Invalid column config for column ${name} - expected boolean or object but was ${typeof columnConfig}`,
        );
      }

      if (!columnConfig) {
        return acc;
      }

      if (typeof columnConfig !== "boolean") {
        columnConfig.customType;
      }

      const type =
        drizzleColumnTypeToZeroType[
          column.columnType as keyof DrizzleColumnTypeToZeroType
        ] ??
        drizzleDataTypeToZeroType[
          column.dataType as keyof DrizzleDataTypeToZeroType
        ];

      if (!type) {
        throw new Error(
          `Unsupported column type: ${column.dataType}. It must be supported by Zero, e.g.: ${Object.keys(drizzleDataTypeToZeroType).join(" | ")}`,
        );
      }

      const isColumnOptional =
        typeof columnConfig === "boolean"
          ? column.hasDefault && column.defaultFn === undefined
            ? true
            : !column.notNull
          : columnConfig.optional;

      if (column.primary) {
        if (isColumnOptional) {
          throw new Error(
            `Primary key column ${name} cannot have a default value defined on the database level and cannot be optional, since auto-incrementing primary keys can cause race conditions with concurrent inserts. See the Zero docs for more information.`,
          );
        }

        primaryKeysFromColumns.push(name);
      }

      const schemaValue = {
        type: typeof columnConfig === "boolean" ? type : columnConfig.type,
        optional: isColumnOptional,
        customType: null as unknown as ZeroTypeToTypescriptType[typeof type],
        ...(typeof columnConfig !== "boolean" && columnConfig.kind
          ? { kind: columnConfig.kind }
          : column.enumValues
            ? { kind: "enum" }
            : {}),
      };

      return {
        ...acc,
        [name]: schemaValue,
      };
    },
    {} as ZeroColumns<TTable, TColumnConfig>,
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
      `No primary keys found in table - ${tableName}. Did you forget to define a primary key?`,
    );
  }

  return {
    tableName,
    columns: columnsMapped,
    primaryKey: primaryKeys as unknown as FindPrimaryKeyFromTable<TTable>,
  } as unknown as CreateZeroTableSchema<TTable, TColumnConfig>;
};

export { createZeroTableSchema, type CreateZeroTableSchema };

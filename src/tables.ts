import { getTableColumns, getTableName, Table } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
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
  T extends Table = Table,
  C extends ColumnsConfig<T> = ColumnsConfig<T>,
> = Flatten<{
  readonly tableName: TableName<T>;
  readonly primaryKey: FindPrimaryKeyFromTable<T>;
  readonly columns: ZeroColumns<T, C>;
}>;

const createZeroTableSchema = <T extends Table, C extends ColumnsConfig<T>>(
  table: T,
  columns: C,
): CreateZeroTableSchema<T, C> => {
  const tableColumns = getTableColumns(table);

  const primaryKeysFromColumns: string[] = [];

  const columnsMapped = typedEntries(tableColumns).reduce(
    (acc, [_key, column]) => {
      const name = column.name;

      const columnConfig = columns[name as keyof C];

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
        throw new Error(`Unsupported column type: ${column.dataType}`);
      }

      if (column.primary) {
        primaryKeysFromColumns.push(name);
      }

      const schemaValue = {
        type: typeof columnConfig === "boolean" ? type : columnConfig.type,
        optional:
          typeof columnConfig === "boolean"
            ? column.hasDefault
              ? true
              : !column.notNull
            : columnConfig.optional,
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
    {} as ZeroColumns<T, C>,
  );

  const tableName = getTableName(table);

  const primaryKeys = [
    ...primaryKeysFromColumns,
    ...getTableConfig(table)
      .primaryKeys.flatMap((k) => k.columns.map((c) => c.name))
      .filter(Boolean),
  ];

  if (!primaryKeys.length) {
    throw new Error("No primary keys found in table");
  }

  return {
    tableName,
    columns: columnsMapped,
    primaryKey: primaryKeys as unknown as FindPrimaryKeyFromTable<T>,
  } as unknown as CreateZeroTableSchema<T, C>;
};

export { createZeroTableSchema, type CreateZeroTableSchema };

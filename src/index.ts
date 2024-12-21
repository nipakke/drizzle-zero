import { getTableColumns, getTableName, type Table } from "drizzle-orm";
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
  ZeroColumns,
  ZeroTypeToTypescriptType,
} from "./types";

function typedEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

const tableToZero = <T extends Table, C extends ColumnsConfig<T>>(
  table: T,
  columns: C,
): TableToZeroResult<T, C> => {
  const tableColumns = getTableColumns(table);

  let primaryKey: FindPrimaryKeyFromTable<T> | undefined;

  const columnsMapped = typedEntries(tableColumns).reduce(
    (acc, [key, column]) => {
      if (!columns[key as keyof C]) {
        return acc;
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

      const schemaValue = {
        optional: !column.notNull,
        type,
        customType: null as unknown as ZeroTypeToTypescriptType[typeof type],
        ...(column.enumValues ? { kind: "enum" } : {}),
      };

      if (column.primary) {
        primaryKey = key as FindPrimaryKeyFromTable<T>;
      }

      return {
        ...acc,
        [key]: schemaValue,
      };
    },
    {} as ZeroColumns<T, C>,
  );

  const tableName = getTableName(table);

  let primaryKeys = [] as unknown as [string, ...string[]];

  if (!primaryKey) {
    primaryKeys = getTableConfig(table).primaryKeys.flatMap((k) =>
      k.columns.map((c) => c.name),
    ) as unknown as [string, ...string[]];
  }

  if (!primaryKey && !primaryKeys.length) {
    throw new Error("No primary keys found in table");
  }

  return {
    tableName,
    columns: columnsMapped,
    primaryKey: (primaryKey
      ? primaryKey
      : primaryKeys) as FindPrimaryKeyFromTable<T>,
  } as const;
};

type TableToZeroResult<T extends Table, C extends ColumnsConfig<T>> = Flatten<{
  readonly tableName: T["_"]["name"];
  readonly primaryKey: FindPrimaryKeyFromTable<T>;
  readonly columns: ZeroColumns<T, C>;
}>;

export {
  tableToZero,
  type ColumnsConfig,
  type TableToZeroResult,
  type ZeroColumns,
};

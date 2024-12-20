import { getTableColumns, getTableName, type Table } from "drizzle-orm";
import {
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

const drizzleToZero = <
  T extends Table,
  C extends ColumnsConfig<T, FindPrimaryKeyFromTable<T>>,
>(
  table: T,
  columns: C,
): DrizzleToZeroResult<T, C> => {
  const tableColumns = getTableColumns(table);

  let primaryKey: FindPrimaryKeyFromTable<T> = null as any;

  const columnsMapped = typedEntries(tableColumns).reduce(
    (acc, [key, column]) => {
      if (!columns[key as keyof C]) {
        return acc;
      }

      const type =
        drizzleDataTypeToZeroType[
          column.dataType as keyof DrizzleDataTypeToZeroType
        ];
      const schemaValue = {
        optional: !column.notNull,
        type,
        customType: null as unknown as ZeroTypeToTypescriptType[typeof type],
      };

      if (column.primary) {
        primaryKey = key as FindPrimaryKeyFromTable<T>;
      }

      if (!schemaValue) {
        throw new Error(`Unsupported column type: ${column.dataType}`);
      }

      return {
        ...acc,
        [key]: schemaValue,
      };
    },
    {} as ZeroColumns<T, C>,
  );

  const tableName = getTableName(table);

  if (!primaryKey) {
    throw new Error("No primary key found in table");
  }

  return { tableName, columns: columnsMapped, primaryKey } as const;
};

type DrizzleToZeroResult<
  T extends Table,
  C extends ColumnsConfig<T, FindPrimaryKeyFromTable<T>>,
> = Flatten<{
  readonly tableName: T["_"]["name"];
  readonly primaryKey: FindPrimaryKeyFromTable<T>;
  readonly columns: ZeroColumns<T, C>;
}>;

export {
  drizzleToZero,
  type DrizzleToZeroResult,
  type ColumnsConfig,
  type ZeroColumns,
};

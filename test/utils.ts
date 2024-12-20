import type { TableSchema } from "@rocicorp/zero";
import { Table } from "drizzle-orm";
import { expect } from "vitest";
import type { ColumnsConfig, DrizzleToZeroResult } from "../src";
import { FindPrimaryKeyFromTable } from "../src/types";

export type ZeroTableSchema = TableSchema;

export function expectDeepEqual<
  S extends ZeroTableSchema,
  T extends Table,
  C extends ColumnsConfig<T, FindPrimaryKeyFromTable<T>>
>(actual: DrizzleToZeroResult<T, C>) {
  return {
    toEqual(expected: S) {
      expect(Object.keys(actual.columns)).toStrictEqual(
        Object.keys(expected.columns)
      );

      for (const key of Object.keys(actual.columns)) {
        expect(actual.columns[key]).toStrictEqual(expected.columns[key]);
      }

      expect(actual.primaryKey).toStrictEqual(expected.primaryKey);
      expect(actual.tableName).toStrictEqual(expected.tableName);
    },
  };
}
export function Expect<T extends true>() {}

export type Equal<X, Y extends X> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? true
  : false;

export type NotEqual<X, Y extends X> = Equal<X, Y> extends true ? false : true;

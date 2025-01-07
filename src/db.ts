import type { Table } from "drizzle-orm";
import { getTableName, is } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";

export const getTableConfigForDatabase = <T extends Table>(table: T) => {
  if (is(table, PgTable)) {
    return getTableConfig(table);
  }

  throw new Error(
    `Unsupported table type: ${getTableName(table)}. Only Postgres tables are supported.`,
  );
};

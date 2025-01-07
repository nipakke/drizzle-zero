import { boolean, integer, pgSchema } from "drizzle-orm/pg-core";

/**
 * The PostgreSQL Zero Schema is a schema that is used to store schema metadata.
 * This separate schema helps isolate Zero's internal tables from application tables.
 */
export const zeroSchema = pgSchema("zero");

/**
 * The PostgreSQL Zero schema versions table.
 * This table maintains only a single row tracking the range of supported schema versions.
 *
 * Zero has first-class support for robust schema migrations through a versioning system
 * stored in PostgreSQL. When zero-cache first runs against an upstream Postgres database,
 * it adds a schemaVersions table to track supported schema versions.
 *
 * The schemaVersions table contains only one row with three columns:
 * - minSupportedVersion: The minimum schema version currently supported
 * - maxSupportedVersion: The maximum schema version currently supported
 * - lock: A boolean flag that is always true (used for row locking)
 *
 * Example query result:
 * ```sql
 * select * from zero."schemaVersions";
 * +---------------------+---------------------+------+
 * | minSupportedVersion | maxSupportedVersion | lock |
 * |---------------------+---------------------+------|
 * | 1                   | 1                   | True |
 * +---------------------+---------------------+------+
 * ```
 */
export const zeroSchemaVersions = zeroSchema.table("schemaVersions", {
  minSupportedVersion: integer("minSupportedVersion"),
  maxSupportedVersion: integer("maxSupportedVersion"),
  lock: boolean("lock").notNull().default(true),
});

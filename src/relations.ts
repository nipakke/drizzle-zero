import {
  createTableRelationsHelpers,
  getTableName,
  is,
  Many,
  One,
  Relations,
  Table,
} from "drizzle-orm";
import { getTableConfigForDatabase } from "./db";
import { createZeroTableSchema, type CreateZeroTableSchema } from "./tables";
import type {
  AtLeastOne,
  ColumnName,
  Columns,
  ColumnsConfig,
  FindPrimaryKeyFromTable,
  Flatten,
  TableName,
  ZeroColumns,
} from "./types";
import { typedEntries } from "./util";

/**
 * Represents a Zero schema with optional relationships.
 * @template TTable - The Drizzle table type
 * @template TColumnConfig - Configuration for the table's columns
 * @template TRelations - Type of relationships (if any)
 */
type ZeroSchemaWithRelations<
  TTable extends Table,
  TColumnConfig extends ColumnsConfig<TTable>,
  TRelations extends Record<string, unknown> | never,
> = Readonly<
  CreateZeroTableSchema<TTable, TColumnConfig> &
    (keyof TRelations extends never
      ? {}
      : [TRelations] extends [never]
        ? {}
        : {
            readonly relationships: TRelations;
          })
>;

/**
 * Finds relations defined for a specific table in the Drizzle schema.
 * @template TDrizzleSchema - The complete Drizzle schema
 * @template TTable - The table to find relations for
 */
type FindRelationsForTable<
  TDrizzleSchema extends Record<string, unknown>,
  TTable extends Table,
> = Extract<
  TDrizzleSchema[{
    [P in keyof TDrizzleSchema]: TDrizzleSchema[P] extends Relations<
      TableName<TTable>
    >
      ? P
      : never;
  }[keyof TDrizzleSchema]],
  Relations<TableName<TTable>>
>;

/**
 * Configuration type for specifying which tables and columns to include in the Zero schema.
 * @template TDrizzleSchema - The complete Drizzle schema
 */
type TableColumnsConfig<TDrizzleSchema extends Record<string, unknown>> = {
  /**
   * The columns to include in the Zero schema.
   */
  readonly [K in keyof TDrizzleSchema as TDrizzleSchema[K] extends Table<any>
    ? TableName<TDrizzleSchema[K]>
    : never]?: TDrizzleSchema[K] extends Table<any>
    ? ColumnsConfig<TDrizzleSchema[K]>
    : never;
};

/**
 * Extracts the configuration type from a Relations type.
 * @template T - The Relations type to extract config from
 */
type RelationsConfig<T extends Relations> = ReturnType<T["config"]>;

/**
 * Gets the keys of columns that can be used as indexes (string or number types).
 * @template TTable - The table to get index keys from
 */
type ColumnIndexKeys<TTable extends Table> = {
  [K in keyof Columns<TTable>]: Columns<TTable>[K] extends {
    dataType: "string" | "number";
  }
    ? ColumnName<Columns<TTable>[K]>
    : never;
}[keyof Columns<TTable>];

/**
 * Type guard that checks if a type is a Table with a specific name.
 * @template T - The type to check
 * @template Name - The name to check for
 */
type IsTableWithName<T, Name extends string> = T extends { _: { name: Name } }
  ? T extends Table<any>
    ? true
    : false
  : false;

type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
  x: infer I,
) => void
  ? I
  : never;

type LastOf<U> =
  UnionToIntersection<U extends any ? (x: U) => void : never> extends (
    x: infer LAST,
  ) => void
    ? LAST
    : never;

type HasExactlyTwo<U> = [U] extends [never]
  ? false
  : Exclude<U, LastOf<U>> extends infer R
    ? [R] extends [never]
      ? false
      : Exclude<R, LastOf<R>> extends never
        ? true
        : false
    : false;

type RelationConfigHasExactlyTwoOnes<TRelations extends Relations> =
  RelationsConfig<TRelations> extends infer R
    ? R extends Record<string, One>
      ? HasExactlyTwo<keyof R>
      : false
    : false;

/**
 * Finds a table in the schema by its name.
 * @template TDrizzleSchema - The complete Drizzle schema
 * @template Name - The name of the table to find
 */
type FindTableByName<
  TDrizzleSchema extends Record<string, unknown>,
  Name extends string,
> = Extract<
  {
    [P in keyof TDrizzleSchema]: IsTableWithName<
      TDrizzleSchema[P],
      Name
    > extends true
      ? TDrizzleSchema[P]
      : never;
  }[keyof TDrizzleSchema],
  Table<any>
>;

/**
 * Gets the valid relation keys for a table that have corresponding table configurations.
 * @template TDrizzleSchema - The complete Drizzle schema
 * @template TColumnConfig - Configuration for the tables
 * @template TCurrentTableRelations - Relations defined for the current table
 */
type ValidRelationKeys<
  TDrizzleSchema extends Record<string, unknown>,
  TColumnConfig extends TableColumnsConfig<TDrizzleSchema>,
  TCurrentTableRelations extends Relations,
> = keyof RelationsConfig<TCurrentTableRelations> &
  {
    [K in keyof RelationsConfig<TCurrentTableRelations>]: FindTableByName<
      TDrizzleSchema,
      RelationsConfig<TCurrentTableRelations>[K]["referencedTableName"]
    > extends Table<any>
      ? TColumnConfig[TableName<
          FindTableByName<
            TDrizzleSchema,
            RelationsConfig<TCurrentTableRelations>[K]["referencedTableName"]
          >
        >] extends object
        ? K
        : never
      : never;
  }[keyof RelationsConfig<TCurrentTableRelations>];

/**
 * Builds the relationship schema for referenced tables in a Zero schema.
 * @template TDrizzleSchema - The complete Drizzle schema
 * @template TColumnConfig - Configuration for the tables
 * @template TCurrentTable - The current table being processed
 * @template TCurrentTableRelations - Relations defined for the current table
 */
type ReferencedZeroSchemas<
  TDrizzleSchema extends Record<string, unknown>,
  TColumnConfig extends TableColumnsConfig<TDrizzleSchema>,
  TCurrentTable extends Table,
  TCurrentTableRelations extends FindRelationsForTable<
    TDrizzleSchema,
    TCurrentTable
  > = FindRelationsForTable<TDrizzleSchema, TCurrentTable>,
> = TCurrentTableRelations extends never
  ? never
  : {
      readonly [K in ValidRelationKeys<
        TDrizzleSchema,
        TColumnConfig,
        TCurrentTableRelations
      >]: {
        readonly sourceField: AtLeastOne<
          Readonly<ColumnIndexKeys<TCurrentTable>>
        >;
        readonly destField: AtLeastOne<
          Readonly<
            ColumnIndexKeys<
              FindTableByName<
                TDrizzleSchema,
                RelationsConfig<TCurrentTableRelations>[K]["referencedTableName"]
              >
            >
          >
        >;
        readonly destSchema: () => ZeroSchemaWithRelations<
          FindTableByName<
            TDrizzleSchema,
            RelationsConfig<TCurrentTableRelations>[K]["referencedTableName"]
          >,
          TColumnConfig[TableName<
            FindTableByName<
              TDrizzleSchema,
              RelationsConfig<TCurrentTableRelations>[K]["referencedTableName"]
            >
          >],
          ReferencedZeroSchemas<
            TDrizzleSchema,
            TColumnConfig,
            FindTableByName<
              TDrizzleSchema,
              RelationsConfig<TCurrentTableRelations>[K]["referencedTableName"]
            >
          >
        >;
      };
    };

/**
 * The complete Zero schema type with version and tables.
 * @template TSchemaVersion - The schema version number
 * @template TDrizzleSchema - The complete Drizzle schema
 * @template TColumnConfig - Configuration for the tables
 */
type CreateZeroSchema<
  TSchemaVersion extends number,
  TDrizzleSchema extends Record<string, unknown>,
  TColumnConfig extends TableColumnsConfig<TDrizzleSchema>,
> = {
  readonly version: TSchemaVersion;
  readonly tables: {
    readonly [K in keyof TDrizzleSchema as TDrizzleSchema[K] extends Table<any>
      ? TColumnConfig[TableName<TDrizzleSchema[K]>] extends object
        ? TableName<TDrizzleSchema[K]>
        : never
      : never]: TDrizzleSchema[K] extends Table<any>
      ? ZeroSchemaWithRelations<
          TDrizzleSchema[K],
          TColumnConfig[TableName<TDrizzleSchema[K]>],
          ReferencedZeroSchemas<
            TDrizzleSchema,
            TColumnConfig,
            TDrizzleSchema[K]
          >
        >
      : never;
  };
};

/**
 * Create a Zero schema from a Drizzle schema.
 *
 * @param schema - The Drizzle schema to create a Zero schema from.
 * @param schemaConfig - The configuration for the Zero schema.
 * @returns The generated Zero schema.
 */
const createZeroSchema = <
  const TSchemaVersion extends number,
  const TDrizzleSchema extends Record<string, unknown>,
  const TColumnConfig extends
    TableColumnsConfig<TDrizzleSchema> = TableColumnsConfig<TDrizzleSchema>,
>(
  /**
   * The Drizzle schema to create a Zero schema from.
   */
  schema: TDrizzleSchema,
  /**
   * The configuration for the Zero schema.
   *
   * @param schemaConfig.version - The version of the schema.
   * @param schemaConfig.tables - The tables to include in the Zero schema.
   */
  schemaConfig: {
    /**
     * The version of the schema, used for schema migrations.
     */
    readonly version: TSchemaVersion;
    /**
     * Specify the tables to include in the Zero schema.
     * This can include type overrides for columns, using `column.json()` for example.
     *
     * @example
     * ```ts
     * {
     *   user: {
     *     id: true,
     *     name: true,
     *   },
     *   profile_info: {
     *     id: true,
     *     user_id: true,
     *     metadata: column.json(),
     *   },
     * }
     * ```
     */
    readonly tables: TColumnConfig;
  },
): Flatten<CreateZeroSchema<TSchemaVersion, TDrizzleSchema, TColumnConfig>> => {
  let relationships = {} as Record<
    keyof typeof schemaConfig.tables,
    Record<string, unknown>
  >;

  for (const tableOrRelations of Object.values(schema)) {
    if (is(tableOrRelations, Relations)) {
      const tableName = getTableName(tableOrRelations.table);
      const relationsConfig = getRelationsConfig(tableOrRelations);

      Object.values(relationsConfig).forEach((relation) => {
        let sourceFieldNames: string[] = [];
        let destFieldNames: string[] = [];

        if (is(relation, One)) {
          sourceFieldNames =
            relation?.config?.fields?.map((f) => f?.name) ?? [];
          destFieldNames =
            relation?.config?.references?.map((f) => f?.name) ?? [];
        }

        if (!sourceFieldNames.length || !destFieldNames.length) {
          if (relation.relationName) {
            const sourceAndDestFields = findNamedSourceAndDestFields(
              schema,
              relation,
            );

            sourceFieldNames = sourceAndDestFields.sourceFieldNames;
            destFieldNames = sourceAndDestFields.destFieldNames;
          } else {
            const sourceAndDestFields = findForeignKeySourceAndDestFields(
              schema,
              relation,
            );

            sourceFieldNames = sourceAndDestFields.sourceFieldNames;
            destFieldNames = sourceAndDestFields.destFieldNames;
          }
        }

        if (!sourceFieldNames.length || !destFieldNames.length) {
          throw new Error(
            `No relationship found for: ${relation.fieldName} (${is(relation, One) ? "One" : "Many"} from ${tableName} to ${relation.referencedTableName}). Did you forget to define foreign keys${relation.relationName ? ` for named relation "${relation.relationName}"` : ""}?`,
          );
        }

        relationships[tableName as keyof typeof relationships] = {
          ...(relationships?.[tableName as keyof typeof relationships] ?? {}),
          [relation.fieldName]: {
            sourceField: sourceFieldNames,
            destField: destFieldNames,
            destSchemaTableName: relation.referencedTableName,
          },
        } as unknown as (typeof relationships)[keyof typeof relationships];
      });
    }
  }

  let tablesWithoutDestSchema: Record<
    string,
    {
      tableName: string;
      columns: ZeroColumns<Table, ColumnsConfig<Table>>;
      primaryKey: FindPrimaryKeyFromTable<Table>;
      relationships?: Record<
        string,
        {
          sourceField: string;
          destField: string;
          destSchemaTableName: string;
        }
      >;
    }
  > = {};

  for (const tableOrRelations of Object.values(schema)) {
    if (is(tableOrRelations, Table)) {
      const table = tableOrRelations;

      const tableName = getTableName(table);

      const tableConfig = schemaConfig.tables[tableName as keyof TColumnConfig];

      // skip tables that don't have a config
      if (!tableConfig) {
        continue;
      }

      const tableSchema = createZeroTableSchema(table, tableConfig);

      const relations = relationships[tableName as keyof typeof relationships];

      tablesWithoutDestSchema[
        tableName as keyof typeof tablesWithoutDestSchema
      ] = {
        ...tableSchema,
        ...(relations ? { relationships: relations } : {}),
      } as unknown as (typeof tablesWithoutDestSchema)[keyof typeof tablesWithoutDestSchema];
    }
  }

  let tables: Record<string, unknown> = {};

  for (const tableWithoutDestSchema of Object.values(tablesWithoutDestSchema)) {
    const tableName = tableWithoutDestSchema.tableName;

    const relationships = typedEntries(
      tableWithoutDestSchema.relationships ?? {},
    )
      // filter out relationships that don't have a corresponding table
      .filter(([_key, relationship]) =>
        Boolean(tablesWithoutDestSchema[relationship.destSchemaTableName]),
      )
      .reduce(
        (acc, [key, relationship]) => {
          acc[key] = {
            sourceField: relationship.sourceField,
            destField: relationship.destField,
            destSchema: () => tables[relationship.destSchemaTableName],
          };

          return acc;
        },
        {} as Record<string, unknown>,
      );

    tables[tableName as keyof typeof tables] = {
      tableName: tableWithoutDestSchema.tableName,
      columns: tableWithoutDestSchema.columns,
      primaryKey: tableWithoutDestSchema.primaryKey,
      ...(Object.keys(relationships).length ? { relationships } : {}),
    } as unknown as (typeof tables)[keyof typeof tables];
  }

  return {
    version: schemaConfig.version,
    tables,
  } as CreateZeroSchema<TSchemaVersion, TDrizzleSchema, TColumnConfig>;
};

const findForeignKeySourceAndDestFields = (
  schema: Record<string, unknown>,
  relation: One | Many<any>,
) => {
  for (const tableOrRelations of Object.values(schema)) {
    if (is(tableOrRelations, Table)) {
      const tableName = getTableName(tableOrRelations);

      if (tableName === relation.referencedTableName) {
        const tableConfig = getTableConfigForDatabase(tableOrRelations);

        for (const foreignKey of tableConfig.foreignKeys) {
          const reference = foreignKey.reference();

          const foreignTableName = getTableName(reference.foreignTable);
          const sourceTableName = getTableName(relation.sourceTable);

          if (foreignTableName === sourceTableName) {
            return {
              sourceFieldNames: reference.foreignColumns.map((c) => c.name),
              destFieldNames: reference.columns.map((c) => c.name),
            };
          }
        }
      }
    }
  }

  return {
    sourceFieldNames: [],
    destFieldNames: [],
  };
};

const findNamedSourceAndDestFields = (
  schema: Record<string, unknown>,
  relation: One | Many<any>,
) => {
  for (const tableOrRelations of Object.values(schema)) {
    if (is(tableOrRelations, Relations)) {
      const relationsConfig = getRelationsConfig(tableOrRelations);

      for (const relationConfig of Object.values(relationsConfig)) {
        if (
          is(relationConfig, One) &&
          relationConfig.relationName === relation.relationName
        ) {
          return {
            destFieldNames:
              relationConfig.config?.fields?.map((f) => f.name) ?? [],
            sourceFieldNames:
              relationConfig.config?.references?.map((f) => f.name) ?? [],
          };
        }
      }
    }
  }

  return {
    sourceFieldNames: [],
    destFieldNames: [],
  };
};

const getRelationsConfig = (relations: Relations) => {
  return relations.config(
    createTableRelationsHelpers(relations.table),
  ) as Record<string, One | Many<any>>;
};

export { createZeroSchema, type CreateZeroSchema };

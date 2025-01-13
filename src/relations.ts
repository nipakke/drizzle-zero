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
import {
  createZeroTableSchema,
  type ColumnsConfig,
  type CreateZeroTableSchema,
  type ZeroColumns,
} from "./tables";
import type {
  AtLeastOne,
  ColumnName,
  Columns,
  FindPrimaryKeyFromTable,
  FindRelationsForTable,
  FindTableByName,
  Flatten,
  RelationsConfig,
  TableName,
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
 * Gets the keys of columns that can be used as indexes (string or number types).
 * @template TTable - The table to get index keys from
 */
type ColumnIndexKeys<TTable extends Table> = Readonly<
  {
    [K in keyof Columns<TTable>]: Columns<TTable>[K] extends {
      dataType: "string" | "number";
    }
      ? ColumnName<Columns<TTable>[K]>
      : never;
  }[keyof Columns<TTable>]
>;

/**
 * Represents the structure of a many-to-many relationship through a junction table.
 * @template TDrizzleSchema - The complete Drizzle schema
 * @template TColumnConfig - Configuration for the tables
 * @template TManyConfig - Configuration for many-to-many relationships
 * @template TCurrentTable - The current table being processed
 */
type ManyToManyRelationship<
  TDrizzleSchema extends Record<string, unknown>,
  TColumnConfig extends TableColumnsConfig<TDrizzleSchema>,
  TManyConfig extends ManyConfig<TDrizzleSchema, TColumnConfig>,
  TCurrentTable extends Table,
> =
  TableName<TCurrentTable> extends keyof TColumnConfig & keyof TManyConfig
    ? TManyConfig[TableName<TCurrentTable>] extends ManyTableConfig<
        TDrizzleSchema,
        TColumnConfig,
        TableName<TCurrentTable>
      >
      ? {
          readonly [K in keyof TManyConfig[TableName<TCurrentTable>]]: Readonly<
            [
              {
                readonly sourceField: AtLeastOne<
                  ColumnIndexKeys<TCurrentTable>
                >;
                readonly destField: AtLeastOne<
                  ColumnIndexKeys<
                    FindTableByName<
                      TDrizzleSchema,
                      Extract<
                        TManyConfig[TableName<TCurrentTable>][K][0],
                        string
                      >
                    >
                  >
                >;
                readonly destSchema: () => ZeroSchemaWithRelations<
                  FindTableByName<
                    TDrizzleSchema,
                    Extract<TManyConfig[TableName<TCurrentTable>][K][0], string>
                  >,
                  ResolveColumnConfig<
                    TDrizzleSchema,
                    TColumnConfig,
                    FindTableByName<
                      TDrizzleSchema,
                      Extract<
                        TManyConfig[TableName<TCurrentTable>][K][0],
                        string
                      >
                    >
                  >,
                  ReferencedZeroSchemas<
                    TDrizzleSchema,
                    TColumnConfig,
                    TManyConfig,
                    FindTableByName<
                      TDrizzleSchema,
                      Extract<
                        TManyConfig[TableName<TCurrentTable>][K][0],
                        string
                      >
                    >
                  >
                >;
              },
              {
                readonly sourceField: AtLeastOne<
                  ColumnIndexKeys<
                    FindTableByName<
                      TDrizzleSchema,
                      Extract<
                        TManyConfig[TableName<TCurrentTable>][K][0],
                        string
                      >
                    >
                  >
                >;
                readonly destField: AtLeastOne<
                  ColumnIndexKeys<
                    FindTableByName<
                      TDrizzleSchema,
                      Extract<
                        TManyConfig[TableName<TCurrentTable>][K][1],
                        string
                      >
                    >
                  >
                >;
                readonly destSchema: () => ZeroSchemaWithRelations<
                  FindTableByName<
                    TDrizzleSchema,
                    Extract<TManyConfig[TableName<TCurrentTable>][K][1], string>
                  >,
                  ResolveColumnConfig<
                    TDrizzleSchema,
                    TColumnConfig,
                    FindTableByName<
                      TDrizzleSchema,
                      Extract<
                        TManyConfig[TableName<TCurrentTable>][K][1],
                        string
                      >
                    >
                  >,
                  ReferencedZeroSchemas<
                    TDrizzleSchema,
                    TColumnConfig,
                    TManyConfig,
                    FindTableByName<
                      TDrizzleSchema,
                      Extract<
                        TManyConfig[TableName<TCurrentTable>][K][1],
                        string
                      >
                    >
                  >
                >;
              },
            ]
          >;
        }
      : {}
    : {};

/**
 * Gets the valid direct relation keys for a table that have corresponding table configurations.
 * @template TDrizzleSchema - The complete Drizzle schema
 * @template TColumnConfig - Configuration for the tables
 * @template TCurrentTableRelations - Relations defined for the current table
 */
type ValidDirectRelationKeys<
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
 * Helper type to safely resolve column config for a table.
 * @template TDrizzleSchema - The complete Drizzle schema
 * @template TColumnConfig - Configuration for the tables
 * @template TTable - The table to resolve column config for
 */
type ResolveColumnConfig<
  TDrizzleSchema extends Record<string, unknown>,
  TColumnConfig extends TableColumnsConfig<TDrizzleSchema>,
  TTable extends Table,
> =
  TableName<TTable> extends keyof TColumnConfig
    ? TColumnConfig[TableName<TTable>] extends ColumnsConfig<TTable>
      ? TColumnConfig[TableName<TTable>]
      : never
    : never;

/**
 * Represents a direct relationship between tables.
 * @template TDrizzleSchema - The complete Drizzle schema
 * @template TColumnConfig - Configuration for the tables
 * @template TManyConfig - Configuration for many-to-many relationships
 * @template TCurrentTable - The current table being processed
 * @template TCurrentTableRelations - Relations defined for the current table
 */
type DirectRelationships<
  TDrizzleSchema extends Record<string, unknown>,
  TColumnConfig extends TableColumnsConfig<TDrizzleSchema>,
  TManyConfig extends ManyConfig<TDrizzleSchema, TColumnConfig>,
  TCurrentTable extends Table,
  TCurrentTableRelations extends Relations,
> = TCurrentTableRelations extends never
  ? never
  : {
      readonly [K in ValidDirectRelationKeys<
        TDrizzleSchema,
        TColumnConfig,
        TCurrentTableRelations
      >]: {
        readonly sourceField: AtLeastOne<ColumnIndexKeys<TCurrentTable>>;
        readonly destField: AtLeastOne<
          ColumnIndexKeys<
            FindTableByName<
              TDrizzleSchema,
              RelationsConfig<TCurrentTableRelations>[K]["referencedTableName"]
            >
          >
        >;
        readonly destSchema: () => ZeroSchemaWithRelations<
          FindTableByName<
            TDrizzleSchema,
            RelationsConfig<TCurrentTableRelations>[K]["referencedTableName"]
          >,
          ResolveColumnConfig<
            TDrizzleSchema,
            TColumnConfig,
            FindTableByName<
              TDrizzleSchema,
              RelationsConfig<TCurrentTableRelations>[K]["referencedTableName"]
            >
          >,
          ReferencedZeroSchemas<
            TDrizzleSchema,
            TColumnConfig,
            TManyConfig,
            FindTableByName<
              TDrizzleSchema,
              RelationsConfig<TCurrentTableRelations>[K]["referencedTableName"]
            >
          >
        >;
      };
    };

/**
 * Configuration type for many-to-many relationships for a specific table.
 * @template TDrizzleSchema - The complete Drizzle schema
 * @template TColumnConfig - Configuration for the tables
 * @template TSourceTableName - The name of the source table
 */
type ManyTableConfig<
  TDrizzleSchema extends Record<string, unknown>,
  TColumnConfig extends TableColumnsConfig<TDrizzleSchema>,
  TSourceTableName extends keyof TColumnConfig,
> = {
  readonly [TRelationName: string]: {
    [K in Exclude<keyof TColumnConfig, TSourceTableName>]: [
      K,
      Exclude<keyof TColumnConfig, TSourceTableName | K>,
    ];
  }[Exclude<keyof TColumnConfig, TSourceTableName>];
};

/**
 * Configuration for many-to-many relationships across all tables.
 * Organized by source table, with each relationship specifying a tuple of [junction table name, destination table name].
 * The junction table and destination table must be different from the source table and each other.
 */
type ManyConfig<
  TDrizzleSchema extends Record<string, unknown>,
  TColumnConfig extends TableColumnsConfig<TDrizzleSchema>,
> = [keyof TColumnConfig] extends [never]
  ? never
  : {
      readonly [TSourceTableName in keyof TColumnConfig]?: ManyTableConfig<
        TDrizzleSchema,
        TColumnConfig,
        TSourceTableName
      >;
    };

/**
 * Represents all referenced Zero schemas for a table, including both direct and many-to-many relationships.
 * @template TDrizzleSchema - The complete Drizzle schema
 * @template TColumnConfig - Configuration for the tables
 * @template TManyConfig - Configuration for many-to-many relationships
 * @template TCurrentTable - The current table being processed
 * @template TCurrentTableRelations - Relations defined for the current table
 */
type ReferencedZeroSchemas<
  TDrizzleSchema extends Record<string, unknown>,
  TColumnConfig extends TableColumnsConfig<TDrizzleSchema>,
  TManyConfig extends ManyConfig<TDrizzleSchema, TColumnConfig>,
  TCurrentTable extends Table,
> = Readonly<
  DirectRelationships<
    TDrizzleSchema,
    TColumnConfig,
    TManyConfig,
    TCurrentTable,
    FindRelationsForTable<TDrizzleSchema, TCurrentTable>
  > &
    ManyToManyRelationship<
      TDrizzleSchema,
      TColumnConfig,
      TManyConfig,
      TCurrentTable
    >
>;

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
  TManyConfig extends ManyConfig<TDrizzleSchema, TColumnConfig>,
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
            TManyConfig,
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
  const TManyConfig extends ManyConfig<
    TDrizzleSchema,
    TColumnConfig
  > = ManyConfig<TDrizzleSchema, TColumnConfig>,
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
   * @param schemaConfig.many - Configuration for many-to-many relationships.
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
    /**
     * Configuration for many-to-many relationships.
     * Organized by source table, with each relationship specifying a tuple of [junction table name, destination table name].
     *
     * @example
     * ```ts
     * {
     *   user: {
     *     comments: ['message', 'comment']
     *   }
     * }
     * ```
     */
    readonly manyToMany?: TManyConfig;
  },
): Flatten<
  CreateZeroSchema<TSchemaVersion, TDrizzleSchema, TColumnConfig, TManyConfig>
> => {
  let relationships = {} as Record<
    keyof typeof schemaConfig.tables,
    Record<string, unknown>
  >;

  for (const tableOrRelations of Object.values(schema)) {
    if (is(tableOrRelations, Table)) {
      const tableName = getTableName(tableOrRelations);

      relationships[tableName as keyof typeof relationships] =
        relationships[tableName as keyof typeof relationships] || {};
    }
  }

  // Map many-to-many relationships
  if (schemaConfig.manyToMany) {
    for (const [sourceTableName, manyConfig] of Object.entries(
      schemaConfig.manyToMany,
    )) {
      if (!manyConfig) continue;

      for (const [
        relationName,
        [junctionTableName, destTableName],
      ] of Object.entries(manyConfig)) {
        const sourceTable = Object.values(schema).find(
          (t): t is Table =>
            is(t, Table) && getTableName(t) === sourceTableName,
        );
        const destTable = Object.values(schema).find(
          (t): t is Table => is(t, Table) && getTableName(t) === destTableName,
        );

        if (!sourceTable || !destTable) {
          throw new Error(
            `Invalid many-to-many configuration for ${String(sourceTableName)}.${relationName}: Could not find ${!sourceTable ? "source" : !destTable ? "destination" : "junction"} table`,
          );
        }

        // Find source->junction and junction->dest relationships
        const sourceJunctionFields = findForeignKeySourceAndDestFields(schema, {
          sourceTable: sourceTable,
          referencedTableName: junctionTableName,
        });

        const junctionDestFields = findForeignKeySourceAndDestFields(schema, {
          sourceTable: destTable,
          referencedTableName: junctionTableName,
        });

        if (
          !sourceJunctionFields.sourceFieldNames.length ||
          !junctionDestFields.sourceFieldNames.length ||
          !junctionDestFields.destFieldNames.length ||
          !sourceJunctionFields.destFieldNames.length
        ) {
          throw new Error(
            `Invalid many-to-many configuration for ${String(sourceTableName)}.${relationName}: Could not find foreign key relationships in junction table ${junctionTableName}`,
          );
        }

        (
          relationships[
            sourceTableName as keyof typeof relationships
          ] as Record<string, unknown>
        )[relationName] = [
          {
            sourceField: sourceJunctionFields.sourceFieldNames,
            destField: sourceJunctionFields.destFieldNames,
            destSchemaTableName: junctionTableName,
          },
          {
            sourceField: junctionDestFields.destFieldNames,
            destField: junctionDestFields.sourceFieldNames,
            destSchemaTableName: destTableName,
          },
        ];
      }
    }
  }

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

        if (
          relationships[tableName as keyof typeof relationships]?.[
            relation.fieldName
          ]
        ) {
          throw new Error(
            `Duplicate relationship found for: ${relation.fieldName} (${is(relation, One) ? "One" : "Many"} from ${tableName} to ${relation.referencedTableName}).`,
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
        | {
            sourceField: string;
            destField: string;
            destSchemaTableName: string;
          }
        | [
            {
              sourceField: string;
              destField: string;
              destSchemaTableName: string;
            },
            {
              sourceField: string;
              destField: string;
              destSchemaTableName: string;
            },
          ]
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
        Boolean(
          Array.isArray(relationship)
            ? relationship.every((r) =>
                Boolean(tablesWithoutDestSchema[r.destSchemaTableName]),
              )
            : Boolean(
                tablesWithoutDestSchema[relationship.destSchemaTableName],
              ),
        ),
      )
      .reduce(
        (acc, [key, relationship]) => {
          acc[key] = Array.isArray(relationship)
            ? relationship.map((r) => ({
                sourceField: r.sourceField,
                destField: r.destField,
                destSchema: () => tables[r.destSchemaTableName],
              }))
            : {
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
  } as CreateZeroSchema<
    TSchemaVersion,
    TDrizzleSchema,
    TColumnConfig,
    TManyConfig
  >;
};

/**
 * Helper function to find source and destination fields for foreign key relationships.
 * @param schema - The complete Drizzle schema
 * @param relation - The minimal relation info needed to find fields
 * @returns Object containing source and destination field names
 */
const findForeignKeySourceAndDestFields = (
  schema: Record<string, unknown>,
  relation: {
    sourceTable: Table;
    referencedTableName: string;
  },
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

/**
 * Helper function to find source and destination fields for named relationships.
 * @param schema - The complete Drizzle schema
 * @param relation - The One or Many relation to find fields for
 * @returns Object containing source and destination field names
 */
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

/**
 * Helper function to get the relations configuration from a Relations object.
 * @param relations - The Relations object to get configuration from
 * @returns Record of relation configurations
 */
const getRelationsConfig = (relations: Relations) => {
  return relations.config(
    createTableRelationsHelpers(relations.table),
  ) as Record<string, One | Many<any>>;
};

export { createZeroSchema, type CreateZeroSchema };

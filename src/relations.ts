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
  createZeroTableBuilder,
  type ColumnsConfig,
  type ZeroColumns,
  type ZeroTableBuilderSchema,
} from "./tables";
import type {
  ColumnName,
  Columns,
  FindPrimaryKeyFromTable,
  FindRelationsForTable,
  FindTableByName,
  RelationsConfig,
  TableColumnsConfig,
  TableName,
} from "./types";

/**
 * Gets the keys of columns that can be used as indexes.
 * @template TTable - The table to get index keys from
 */
type ColumnIndexKeys<TTable extends Table> = {
  [K in keyof Columns<TTable>]: ColumnName<Columns<TTable>[K]>;
}[keyof Columns<TTable>];

/**
 * Extracts the table name from a configuration object or string.
 * @template TTableConfig - The configuration object or string
 */
type ExtractTableConfigName<TTableConfig> = TTableConfig extends {
  readonly destTable: string;
}
  ? TTableConfig["destTable"]
  : TTableConfig extends string
    ? TTableConfig
    : never;

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
          [K in keyof TManyConfig[TableName<TCurrentTable>]]: [
            {
              readonly sourceField: string[];
              readonly destField: ColumnIndexKeys<
                FindTableByName<
                  TDrizzleSchema,
                  ExtractTableConfigName<
                    TManyConfig[TableName<TCurrentTable>][K][0]
                  >
                >
              >[];
              readonly destSchema: ExtractTableConfigName<
                TManyConfig[TableName<TCurrentTable>][K][0]
              >;
              readonly cardinality: "many";
            },
            {
              readonly sourceField: string[];
              readonly destField: ColumnIndexKeys<
                FindTableByName<
                  TDrizzleSchema,
                  ExtractTableConfigName<
                    TManyConfig[TableName<TCurrentTable>][K][1]
                  >
                >
              >[];
              readonly destSchema: ExtractTableConfigName<
                TManyConfig[TableName<TCurrentTable>][K][1]
              >;
              readonly cardinality: "many";
            },
          ];
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
    [K in keyof RelationsConfig<TCurrentTableRelations>]: RelationsConfig<TCurrentTableRelations>[K]["referencedTable"] extends Table<any>
      ? TColumnConfig[TableName<
          RelationsConfig<TCurrentTableRelations>[K]["referencedTable"]
        >] extends object
        ? K
        : never
      : never;
  }[keyof RelationsConfig<TCurrentTableRelations>];

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
  TCurrentTableRelations extends Relations,
> = [TCurrentTableRelations] extends [never]
  ? {}
  : {
      [K in ValidDirectRelationKeys<
        TDrizzleSchema,
        TColumnConfig,
        TCurrentTableRelations
      >]: [
        {
          readonly sourceField: string[];
          readonly destField: ColumnIndexKeys<
            FindTableByName<
              TDrizzleSchema,
              RelationsConfig<TCurrentTableRelations>[K]["referencedTableName"]
            >
          >[];
          readonly destSchema: RelationsConfig<TCurrentTableRelations>[K]["referencedTableName"];
          readonly cardinality: RelationsConfig<TCurrentTableRelations>[K] extends One
            ? "one"
            : "many";
        },
      ];
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
  readonly [TRelationName: string]:
    | readonly [keyof TColumnConfig, keyof TColumnConfig]
    | {
        [K in keyof TColumnConfig]: {
          [L in keyof TColumnConfig]: readonly [
            {
              readonly destTable: K;
              readonly sourceField: (keyof TColumnConfig[TSourceTableName])[];
              readonly destField: (keyof TColumnConfig[K])[];
            },
            {
              readonly destTable: L;
              readonly sourceField: (keyof TColumnConfig[K])[];
              readonly destField: (keyof TColumnConfig[L])[];
            },
          ];
        }[keyof TColumnConfig];
      }[keyof TColumnConfig];
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
> = DirectRelationships<
  TDrizzleSchema,
  TColumnConfig,
  FindRelationsForTable<TDrizzleSchema, TCurrentTable>
> &
  ManyToManyRelationship<
    TDrizzleSchema,
    TColumnConfig,
    TManyConfig,
    TCurrentTable
  >;

/**
 * The complete Zero schema type with version and tables.
 * @template TDrizzleSchema - The complete Drizzle schema
 * @template TColumnConfig - Configuration for the tables
 */
type CreateZeroSchema<
  TDrizzleSchema extends Record<string, unknown>,
  TColumnConfig extends TableColumnsConfig<TDrizzleSchema>,
  TManyConfig extends ManyConfig<TDrizzleSchema, TColumnConfig>,
> = {
  readonly version: number;
  readonly tables: {
    [K in keyof TDrizzleSchema as TDrizzleSchema[K] extends Table<any>
      ? TColumnConfig[TableName<TDrizzleSchema[K]>] extends object
        ? TableName<TDrizzleSchema[K]>
        : never
      : never]: TDrizzleSchema[K] extends Table<any>
      ? ZeroTableBuilderSchema<
          TDrizzleSchema[K],
          TColumnConfig[TableName<TDrizzleSchema[K]>]
        >
      : never;
  };
  readonly relationships: {
    [K in keyof TDrizzleSchema as TDrizzleSchema[K] extends Table<any>
      ? TColumnConfig[TableName<TDrizzleSchema[K]>] extends object
        ? [
            ReferencedZeroSchemas<
              TDrizzleSchema,
              TColumnConfig,
              TManyConfig,
              TDrizzleSchema[K]
            >,
          ] extends [never]
          ? never
          : keyof ReferencedZeroSchemas<
                TDrizzleSchema,
                TColumnConfig,
                TManyConfig,
                TDrizzleSchema[K]
              > extends never
            ? never
            : TableName<TDrizzleSchema[K]>
        : never
      : never]: TDrizzleSchema[K] extends Table<any>
      ? ReferencedZeroSchemas<
          TDrizzleSchema,
          TColumnConfig,
          TManyConfig,
          TDrizzleSchema[K]
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
    readonly version: number;
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
): CreateZeroSchema<TDrizzleSchema, TColumnConfig, TManyConfig> => {
  let tables: Record<
    string,
    {
      tableName: string;
      columns: ZeroColumns<Table, ColumnsConfig<Table>>;
      primaryKey: FindPrimaryKeyFromTable<Table>;
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

      const tableSchema = createZeroTableBuilder(table, tableConfig);

      tables[tableName] =
        tableSchema.build() as unknown as (typeof tables)[keyof typeof tables];
    }
  }

  let relationships = {} as Record<
    keyof typeof schemaConfig.tables,
    Record<string, unknown>
  >;

  // Map many-to-many relationships
  if (schemaConfig.manyToMany) {
    for (const [sourceTableName, manyConfig] of Object.entries(
      schemaConfig.manyToMany,
    )) {
      if (!manyConfig) continue;

      for (const [
        relationName,
        [junctionTableNameOrObject, destTableNameOrObject],
      ] of Object.entries(manyConfig)) {
        if (
          typeof junctionTableNameOrObject === "string" &&
          typeof destTableNameOrObject === "string"
        ) {
          const junctionTableName = junctionTableNameOrObject;

          const destTableName = destTableNameOrObject;

          const sourceTable = Object.values(schema).find(
            (t): t is Table =>
              is(t, Table) && getTableName(t) === sourceTableName,
          );
          const destTable = Object.values(schema).find(
            (t): t is Table =>
              is(t, Table) && getTableName(t) === destTableName,
          );

          if (!sourceTable || !destTable) {
            throw new Error(
              `drizzle-zero: Invalid many-to-many configuration for ${String(sourceTableName)}.${relationName}: Could not find ${!sourceTable ? "source" : !destTable ? "destination" : "junction"} table`,
            );
          }

          // Find source->junction and junction->dest relationships
          const sourceJunctionFields = findForeignKeySourceAndDestFields(
            schema,
            {
              sourceTable: sourceTable,
              referencedTableName: junctionTableName,
            },
          );

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
              `drizzle-zero: Invalid many-to-many configuration for ${String(sourceTableName)}.${relationName}: Could not find foreign key relationships in junction table ${junctionTableName}`,
            );
          }

          if (
            !schemaConfig.tables[
              junctionTableName as keyof typeof schemaConfig.tables
            ] ||
            !schemaConfig.tables[
              sourceTableName as keyof typeof schemaConfig.tables
            ] ||
            !schemaConfig.tables[
              destTableName as keyof typeof schemaConfig.tables
            ]
          ) {
            // skip if any of the tables are not defined in the schema config
            continue;
          }

          relationships[sourceTableName as keyof typeof relationships] = {
            ...(relationships?.[
              sourceTableName as keyof typeof relationships
            ] ?? {}),
            [relationName]: [
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
            ],
          };
        } else {
          const junctionTableName =
            junctionTableNameOrObject?.destTable ?? null;
          const junctionSourceField =
            junctionTableNameOrObject?.sourceField ?? null;
          const junctionDestField =
            junctionTableNameOrObject?.destField ?? null;

          const destTableName = destTableNameOrObject?.destTable ?? null;
          const destSourceField = destTableNameOrObject?.sourceField ?? null;
          const destDestField = destTableNameOrObject?.destField ?? null;

          if (
            !junctionSourceField ||
            !junctionDestField ||
            !destSourceField ||
            !destDestField ||
            !junctionTableName ||
            !destTableName
          ) {
            throw new Error(
              `drizzle-zero: Invalid many-to-many configuration for ${String(sourceTableName)}.${relationName}: Not all required fields were provided.`,
            );
          }

          if (
            !schemaConfig.tables[
              junctionTableName as keyof typeof schemaConfig.tables
            ] ||
            !schemaConfig.tables[
              sourceTableName as keyof typeof schemaConfig.tables
            ] ||
            !schemaConfig.tables[
              destTableName as keyof typeof schemaConfig.tables
            ]
          ) {
            // skip if any of the tables are not defined in the schema config
            continue;
          }

          relationships[sourceTableName as keyof typeof relationships] = {
            ...(relationships?.[
              sourceTableName as keyof typeof relationships
            ] ?? {}),
            [relationName]: [
              {
                sourceField: junctionSourceField,
                destField: junctionDestField,
                destSchemaTableName: junctionTableName,
              },
              {
                sourceField: destSourceField,
                destField: destDestField,
                destSchemaTableName: destTableName,
              },
            ],
          };
        }
      }
    }
  }

  // get relationships from relations
  for (const tableOrRelations of Object.values(schema)) {
    if (is(tableOrRelations, Relations)) {
      const tableName = getTableName(tableOrRelations.table);
      const relationsConfig = getRelationsConfig(tableOrRelations);

      for (const relation of Object.values(relationsConfig)) {
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
            `drizzle-zero: No relationship found for: ${relation.fieldName} (${is(relation, One) ? "One" : "Many"} from ${tableName} to ${relation.referencedTableName}). Did you forget to define foreign keys${relation.relationName ? ` for named relation "${relation.relationName}"` : ""}?`,
          );
        }

        if (
          !schemaConfig.tables[tableName as keyof typeof schemaConfig.tables] ||
          !schemaConfig.tables[
            relation.referencedTableName as keyof typeof schemaConfig.tables
          ]
        ) {
          // skip if any of the tables are not defined in the schema config
          continue;
        }

        if (
          relationships[tableName as keyof typeof relationships]?.[
            relation.fieldName
          ]
        ) {
          throw new Error(
            `drizzle-zero: Duplicate relationship found for: ${relation.fieldName} (from ${tableName} to ${relation.referencedTableName}).`,
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
      }
    }
  }

  return {
    version: schemaConfig.version,
    tables,
    relationships,
  } as unknown as CreateZeroSchema<TDrizzleSchema, TColumnConfig, TManyConfig>;
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

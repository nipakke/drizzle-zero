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

type ZeroSchemaWithRelations<
  T extends Table<any>,
  C extends ColumnsConfig<T>,
  R extends Record<string, unknown> | never,
> = Readonly<
  CreateZeroTableSchema<T, C> &
    (keyof R extends never
      ? {}
      : [R] extends [never]
        ? {}
        : {
            readonly relationships: R;
          })
>;

type FindRelationsForTable<
  TDrizzleSchema extends Record<string, unknown>,
  TTable extends Table,
> = Extract<
  TDrizzleSchema[{
    [P in keyof TDrizzleSchema]: TDrizzleSchema[P] extends Relations<TableName<TTable>>
      ? P
      : never;
  }[keyof TDrizzleSchema]],
  Relations<TableName<TTable>>
>;

/**
 * The configuration for the tables to include in the Zero schema.
 */
type TableColumnsConfig<
  TDrizzleSchema extends Record<string, unknown>,
> = {
  /**
   * The columns to include in the Zero schema.
   */
  readonly [K in keyof TDrizzleSchema as TDrizzleSchema[K] extends Table<any>
    ? TableName<TDrizzleSchema[K]>
    : never]?: TDrizzleSchema[K] extends Table<any>
    ? ColumnsConfig<TDrizzleSchema[K]>
    : never;
};

type RelationsConfig<T extends Relations> = ReturnType<T["config"]>;

type ColumnIndexKeys<TTable extends Table> = {
  [K in keyof Columns<TTable>]: Columns<TTable>[K] extends {
    dataType: "string" | "number";
  }
    ? ColumnName<Columns<TTable>[K]>
    : never;
}[keyof Columns<TTable>];

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
      readonly [K in keyof RelationsConfig<TCurrentTableRelations> as {
        readonly [P in keyof TDrizzleSchema]: TDrizzleSchema[P] extends {
          _: {
            name: RelationsConfig<TCurrentTableRelations>[K]["referencedTableName"];
          };
        }
          ? TDrizzleSchema[P] extends Table<any>
            ? TColumnConfig[TableName<TDrizzleSchema[P]>] extends object
              ? K
              : never
            : never
          : never;
      }[keyof TDrizzleSchema] extends never
        ? never
        : K]: {
        readonly [P in keyof TDrizzleSchema]: TDrizzleSchema[P] extends {
          _: {
            name: RelationsConfig<TCurrentTableRelations>[K]["referencedTableName"];
          };
        }
          ? TDrizzleSchema[P] extends Table<any>
            ? TColumnConfig[TableName<TDrizzleSchema[P]>] extends object
              ? {
                  readonly sourceField: AtLeastOne<
                    Readonly<
                      {
                        [P in keyof TDrizzleSchema]: TDrizzleSchema[P] extends {
                          _: {
                            name: TableName<TCurrentTable>;
                          };
                        }
                          ? TDrizzleSchema[P] extends Table<any>
                            ? ColumnIndexKeys<TDrizzleSchema[P]>
                            : never
                          : never;
                      }[keyof TDrizzleSchema]
                    >
                  >;
                  readonly destField: AtLeastOne<
                    Readonly<
                      {
                        [ColumnName in keyof Columns<
                          TDrizzleSchema[P]
                        >]: Columns<
                          TDrizzleSchema[P]
                        >[ColumnName]["_"] extends {
                          name: string;
                        }
                          ? ColumnIndexKeys<TDrizzleSchema[P]>
                          : never;
                      }[keyof Columns<TDrizzleSchema[P]>]
                    >
                  >;
                  readonly destSchema: () => ZeroSchemaWithRelations<
                    TDrizzleSchema[P],
                    TColumnConfig[TableName<TDrizzleSchema[P]>],
                    ReferencedZeroSchemas<
                      TDrizzleSchema,
                      TColumnConfig,
                      TDrizzleSchema[P]
                    >
                  >;
                }
              : never
            : never
          : never;
      }[keyof TDrizzleSchema];
    };

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

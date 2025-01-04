import {
  createTableRelationsHelpers,
  getTableColumns,
  getTableName,
  Many,
  One,
  Relations,
  Table,
} from "drizzle-orm";
import { ForeignKey, getTableConfig } from "drizzle-orm/pg-core";
import {
  type DrizzleColumnTypeToZeroType,
  drizzleColumnTypeToZeroType,
  type DrizzleDataTypeToZeroType,
  drizzleDataTypeToZeroType,
} from "./drizzle-to-zero";
import type {
  AtLeastOne,
  ColumnNames,
  ColumnsConfig,
  FindPrimaryKeyFromTable,
  Flatten,
  RelationsForTable,
  TableName,
  ZeroColumns,
  ZeroTypeToTypescriptType,
} from "./types";

function typedEntries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

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

      if (!name) {
        throw new Error(`Column name is required`);
      }

      if (!columns[name as keyof C]) {
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

      if (column.primary) {
        primaryKeysFromColumns.push(name);
      }

      const schemaValue = {
        type,
        optional: !column.notNull,
        customType: null as unknown as ZeroTypeToTypescriptType[typeof type],
        ...(column.enumValues ? { kind: "enum" } : {}),
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

type TableColumnsConfig<TSchema extends Record<string, unknown>> = {
  [K in keyof TSchema as TSchema[K] extends Table<any>
    ? TableName<TSchema[K]>
    : never]: TSchema[K] extends Table<any> ? ColumnsConfig<TSchema[K]> : never;
};

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
  TSchema extends Record<string, unknown>,
  TableName extends string,
> = Extract<
  TSchema[{
    [P in keyof TSchema]: TSchema[P] extends Relations<TableName> ? P : never;
  }[keyof TSchema]],
  Relations<TableName>
>;

type ReferencedZeroSchemas<
  TSchema extends Record<string, unknown>,
  TColumns extends TableColumnsConfig<TSchema>,
  TRelations extends Relations,
  TTableName extends keyof TSchema,
> = TRelations extends never
  ? never
  : {
      readonly [K in keyof ReturnType<TRelations["config"]>]: {
        readonly [P in keyof TSchema]: TSchema[P] extends {
          _: {
            name: ReturnType<TRelations["config"]>[K]["referencedTableName"];
          };
        }
          ? TSchema[P] extends Table<any>
            ? {
                readonly sourceField: AtLeastOne<
                  {
                    [P in keyof TSchema]: TSchema[P] extends {
                      _: {
                        name: TTableName;
                      };
                    }
                      ? TSchema[P] extends Table<any>
                        ? ColumnNames<TSchema[P]>
                        : never
                      : never;
                  }[keyof TSchema]
                >;
                readonly destField: AtLeastOne<
                  {
                    [ColumnName in keyof TSchema[P]["_"]["columns"]]: TSchema[P]["_"]["columns"][ColumnName]["_"] extends {
                      name: string;
                    }
                      ? TSchema[P]["_"]["columns"][ColumnName]["_"]["name"]
                      : never;
                  }[keyof TSchema[P]["_"]["columns"]]
                >;
                readonly destSchema: () => ZeroSchemaWithRelations<
                  TSchema[P],
                  TColumns[TableName<TSchema[P]>],
                  ReferencedZeroSchemas<
                    TSchema,
                    TColumns,
                    FindRelationsForTable<TSchema, TableName<TSchema[P]>>,
                    TableName<TSchema[P]>
                  >
                >;
              }
            : never
          : never;
      }[keyof TSchema];
    };

type CreateZeroSchema<
  TVersion extends number,
  TSchema extends Record<string, unknown>,
  TColumns extends TableColumnsConfig<TSchema>,
> = {
  readonly version: TVersion;
  readonly tables: {
    readonly [K in keyof TSchema as TSchema[K] extends Table<any>
      ? TableName<TSchema[K]>
      : never]: TSchema[K] extends Table<any>
      ? ZeroSchemaWithRelations<
          TSchema[K],
          TColumns[TableName<TSchema[K]>],
          ReferencedZeroSchemas<
            TSchema,
            TColumns,
            FindRelationsForTable<TSchema, TableName<TSchema[K]>>,
            TableName<TSchema[K]>
          >
        >
      : never;
  };
};

const createZeroSchema = <
  const TVersion extends number,
  const TSchema extends Record<string, unknown>,
  const TColumns extends
    TableColumnsConfig<TSchema> = TableColumnsConfig<TSchema>,
>(
  schema: TSchema,
  schemaConfig: {
    readonly version: TVersion;
    readonly tables: TColumns;
  },
): Flatten<CreateZeroSchema<TVersion, TSchema, TColumns>> => {
  let relationships = {} as Record<
    keyof typeof schemaConfig.tables,
    Record<string, unknown>
  >;

  for (const maybeRelations of Object.values(schema)) {
    if (maybeRelations instanceof Relations) {
      const relations = maybeRelations;

      const tableName = getTableName(relations.table);

      const relationsConfig = relations.config(
        createTableRelationsHelpers(relations.table),
      ) as Record<string, One | Many<any>>;

      Object.values(relationsConfig).forEach((relation) => {
        let sourceFieldNames: string[] = [];
        let destFieldNames: string[] = [];

        if (relation instanceof One) {
          sourceFieldNames =
            relation?.config?.fields?.map((f) => f?.name) ?? [];
          destFieldNames =
            relation?.config?.references?.map((f) => f?.name) ?? [];
        }

        if (!sourceFieldNames.length || !destFieldNames.length) {
          for (const tableOrRelations of Object.values(schema)) {
            if (tableOrRelations instanceof Table) {
              const tableName = getTableName(tableOrRelations);

              if (tableName === relation.referencedTableName) {
                const foreignKeys = (tableOrRelations as any)?.[
                  Symbol.for("drizzle:PgInlineForeignKeys")
                ] as ForeignKey[];

                for (const foreignKey of foreignKeys) {
                  const reference = foreignKey.reference();

                  const foreignTableName = getTableName(reference.foreignTable);
                  const sourceTableName = getTableName(relation.sourceTable);

                  if (foreignTableName === sourceTableName) {
                    sourceFieldNames = reference.foreignColumns.map(
                      (c) => c.name,
                    );
                    destFieldNames = reference.columns.map((c) => c.name);
                  }
                }
              }
            }
          }
        }

        if (!sourceFieldNames.length || !destFieldNames.length) {
          throw new Error(
            `No source or dest field names found for: ${relation.fieldName}`,
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
    if (tableOrRelations instanceof Table) {
      const table = tableOrRelations;

      const tableName = getTableName(table);

      const tableSchema = createZeroTableSchema(
        table,
        schemaConfig.tables[tableName as keyof TColumns],
      );

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

    tables[tableName as keyof typeof tables] = {
      tableName: tableWithoutDestSchema.tableName,
      columns: tableWithoutDestSchema.columns,
      primaryKey: tableWithoutDestSchema.primaryKey,
      ...(tableWithoutDestSchema?.relationships
        ? {
            relationships: typedEntries(
              tableWithoutDestSchema.relationships,
            ).reduce(
              (acc, [key, relationship]) => {
                acc[key] = {
                  sourceField: relationship.sourceField,
                  destField: relationship.destField,
                  destSchema: () =>
                    tables[
                      relationship.destSchemaTableName as keyof typeof tables
                    ],
                };

                return acc;
              },
              {} as Record<string, unknown>,
            ),
          }
        : {}),
    } as unknown as (typeof tables)[keyof typeof tables];
  }

  return {
    version: schemaConfig.version,
    tables,
  } as CreateZeroSchema<TVersion, TSchema, TColumns>;
};

export {
  createZeroSchema,
  createZeroTableSchema,
  type ColumnsConfig,
  type CreateZeroSchema,
  type CreateZeroTableSchema,
  type RelationsForTable,
  type ZeroColumns,
};

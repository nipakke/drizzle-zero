import { Command } from "commander";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import {
  IndentationText,
  NewLineKind,
  Project,
  QuoteKind,
  type ts,
  TypeNode,
  VariableDeclarationKind,
} from "ts-morph";
import { tsImport } from "tsx/esm/api";

const defaultConfigFile = "drizzle-zero.config.ts";
const defaultOutputFile = "zero-schema.gen.ts";
const defaultTsConfigFile = "tsconfig.json";

async function findConfigFile() {
  const files = await fs.readdir(process.cwd());

  const configFile = files.find((file) => file.endsWith(defaultConfigFile));
  if (!configFile) {
    console.error("❌  drizzle-zero: No configuration file found");
    process.exit(1);
  }

  return configFile;
}

async function getZeroSchemaDefsFromConfig({
  configPath,
  tsConfigPath,
}: {
  configPath: string;
  tsConfigPath: string;
}) {
  const drizzleZeroConfigProject = new Project({
    tsConfigFilePath: tsConfigPath,
    compilerOptions: {
      emitDeclarationOnly: true,
      declaration: true,
      noEmit: false,
      declarationMap: false,
      sourceMap: false,
    },
  });

  const fileName = configPath.slice(configPath.lastIndexOf("/") + 1);
  const resolvedOutputFileName = fileName.replace(".ts", ".d.ts");

  const emittedFiles = await drizzleZeroConfigProject.emitToMemory();

  // load into a new project to get the type
  const emitProject = new Project({
    tsConfigFilePath: tsConfigPath,
    skipAddingFilesFromTsConfig: true,
  });
  for (const file of emittedFiles.getFiles()) {
    emitProject.createSourceFile(file.filePath, file.text, {
      overwrite: true,
    });
  }

  const sourceFile = emitProject.getSourceFile(resolvedOutputFileName);

  if (!sourceFile) {
    throw new Error(
      `❌ drizzle-zero: Failed to find type definitions for ${resolvedOutputFileName}`,
    );
  }

  const zeroSchemaTypeDecl =
    sourceFile.getVariableDeclaration("_default") ??
    sourceFile.getVariableDeclaration("schema");

  if (!zeroSchemaTypeDecl) {
    throw new Error(
      "❌ drizzle-zero: No config type found in the config file - did you export `default` or `schema`?",
    );
  }

  const zeroSchemaType = zeroSchemaTypeDecl.getTypeNode();

  if (!zeroSchemaType) {
    throw new Error(
      "❌ drizzle-zero: No config type found in the config file.",
    );
  }

  // format the type node
  zeroSchemaType.formatText();

  return zeroSchemaType;
}

async function getGeneratedSchema({
  zeroSchema,
  zeroSchemaTypeNode,
  tsConfigPath,
}: {
  zeroSchema: unknown;
  zeroSchemaTypeNode: TypeNode<ts.TypeNode>;
  tsConfigPath: string;
}) {
  const inMemoryOutputFile = "zero.ts";

  const typename = "Schema";

  const drizzleZeroOutputProject = new Project({
    tsConfigFilePath: tsConfigPath,
    skipAddingFilesFromTsConfig: true,
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      newLineKind: NewLineKind.LineFeed,
      quoteKind: QuoteKind.Single,
    },
  });

  const zeroSchemaGenerated = drizzleZeroOutputProject.createSourceFile(
    inMemoryOutputFile,
    "",
    { overwrite: true },
  );

  const originalZeroSchemaTypeText = zeroSchemaTypeNode.getText();

  const containsReadonlyJSONValue = originalZeroSchemaTypeText.includes(
    'import("drizzle-zero").ReadonlyJSONValue',
  );
  const containsCustomJsonType = originalZeroSchemaTypeText.includes(
    "customType: import(",
  );

  const replacedReadonlyJSONValue = containsReadonlyJSONValue
    ? originalZeroSchemaTypeText.replaceAll(
        'import("drizzle-zero").ReadonlyJSONValue',
        "ReadonlyJSONValue",
      )
    : originalZeroSchemaTypeText;

  const zeroSchemaTypeText = containsCustomJsonType
    ? replacedReadonlyJSONValue.replace(
        /customType: (import\(.*?\)[^;]*);/g,
        "customType: Simplify<$1>;",
      )
    : replacedReadonlyJSONValue;

  // add import for ReadonlyJSONValue type from zero
  if (containsReadonlyJSONValue) {
    zeroSchemaGenerated.addImportDeclaration({
      isTypeOnly: true,
      namedImports: ["ReadonlyJSONValue"],
      moduleSpecifier: "@rocicorp/zero",
    });
  }

  // add import for ReadonlyJSONValue type from zero
  if (containsCustomJsonType) {
    zeroSchemaGenerated.addTypeAlias({
      name: "Simplify",
      typeParameters: ["T"],
      isExported: true,
      type: "{ [K in keyof T]: T[K] } & {}",
    });
  }

  zeroSchemaGenerated.addTypeAlias({
    name: typename,
    isExported: true,
    type: zeroSchemaTypeText,
  });

  const stringifiedSchema = JSON.stringify(zeroSchema, null, 2).replaceAll(
    `"customType": null`,
    `"customType": null as unknown`,
  );

  zeroSchemaGenerated.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    isExported: true,
    declarations: [
      {
        name: "schema",
        initializer: `${stringifiedSchema} as ${typename}`,
      },
    ],
  });

  zeroSchemaGenerated.formatText();

  const organizedFile = zeroSchemaGenerated.organizeImports();

  const file = organizedFile.getText();

  return `/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
// noinspection JSUnusedGlobalSymbols
// biome-ignore-all
/*
 * ------------------------------------------------------------
 * ## This file was automatically generated by drizzle-zero  ##
 * ## Any changes you make to this file will be overwritten. ##
 * ##                                                        ##
 * ## Additionally, you should also exclude this file from   ##
 * ## your linter and/or formatter to prevent it from being  ##
 * ## checked or modified.                                   ##
 * ##                                                        ##
 * ## SOURCE: https://github.com/BriefHQ/drizzle-zero        ##
 * ------------------------------------------------------------
 */

${file}`;
}

export async function loadPrettier() {
  try {
    return await import("prettier");
  } catch (_) {}

  try {
    const path = require.resolve("prettier", { paths: [process.cwd()] });
    return await import(pathToFileURL(path).href);
  } catch {
    throw new Error(
      "⚠️  prettier could not be found. Install it locally with\n  npm i -D prettier",
    );
  }
}

async function formatSchema(schema: string): Promise<string> {
  try {
    const prettier = await loadPrettier();
    return prettier.format(schema, {
      parser: "typescript",
    });
  } catch (error) {
    console.warn("⚠️  prettier not found, skipping formatting");
    return schema;
  }
}

export interface GeneratorOptions {
  config?: string;
  tsConfigPath?: string;
  format?: boolean;
}

async function main(opts: GeneratorOptions = {}) {
  const { config, tsConfigPath, format } = { ...opts };

  const configFilePath = config ?? (await findConfigFile());
  const resolvedTsConfigPath = tsConfigPath ?? defaultTsConfigFile;

  const fullConfigPath = path.resolve(process.cwd(), configFilePath);

  try {
    await fs.access(fullConfigPath);
  } catch (error) {
    console.error(
      `❌ drizzle-zero: config file not found at ${fullConfigPath}`,
    );
    process.exit(1);
  }

  const zeroConfigImport = await tsImport(fullConfigPath, __filename);
  const zeroConfig = zeroConfigImport?.default ?? zeroConfigImport?.schema;

  if (!zeroConfig) {
    console.error(
      "❌ drizzle-zero: No config found in the config file - did you export `default` or `schema`?",
    );
    process.exit(1);
  }

  const zeroSchemaTypeNode = await getZeroSchemaDefsFromConfig({
    configPath: fullConfigPath,
    tsConfigPath: resolvedTsConfigPath,
  });

  let zeroSchemaGenerated = await getGeneratedSchema({
    zeroSchema: zeroConfig,
    zeroSchemaTypeNode,
    tsConfigPath: resolvedTsConfigPath,
  });

  if (format) {
    zeroSchemaGenerated = await formatSchema(zeroSchemaGenerated);
  }

  return zeroSchemaGenerated;
}

async function cli() {
  const program = new Command();
  program
    .name("drizzle-zero")
    .description("The CLI for converting Drizzle ORM schemas to Zero schemas");

  program
    .command("generate")
    .option(
      "-c, --config <input-file>",
      `Path to the ${defaultConfigFile} configuration file`,
      defaultConfigFile,
    )
    .option(
      "-o, --output <output-file>",
      `Path to the generated output file`,
      defaultOutputFile,
    )
    .option(
      "-t, --tsconfig <tsconfig-file>",
      `Path to the custom tsconfig file`,
      defaultTsConfigFile,
    )
    .option("-f, --format", `Format the generated schema`, false)
    .action(async (command) => {
      console.log(`⚙️  Generating zero schema from ${command.config}...`);

      const zeroSchema = await main({
        config: command.config,
        tsConfigPath: command.tsconfig,
        format: command.format,
      });

      if (command.output) {
        await fs.writeFile(
          path.resolve(process.cwd(), command.output),
          zeroSchema,
        );
        console.log(
          `✅ drizzle-zero: Zero schema written to ${command.output}`,
        );
      } else {
        console.log({
          schema: zeroSchema,
        });
      }
    });

  program.parse();
}

// Run the main function
cli().catch((error) => {
  console.error("❌ drizzle-zero error:", error);
  process.exit(1);
});

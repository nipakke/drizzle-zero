import { Command } from "commander";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { Project } from "ts-morph";
import { tsImport } from "tsx/esm/api";
import { getGeneratedSchema, getZeroSchemaDefsFromConfig } from "./cli";

const defaultConfigFile = "./drizzle-zero.config.ts";
const defaultOutputFile = "./zero-schema.gen.ts";
const defaultTsConfigFile = "./tsconfig.json";

export async function findConfigFile({
  configFilePath,
}: {
  configFilePath: string;
}) {
  const files = await fs.readdir(process.cwd());

  const configFile = files.find((file) => file.endsWith(configFilePath));
  if (!configFile) {
    console.error("❌  drizzle-zero: No configuration file found");
    process.exit(1);
  }

  return configFile;
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

export async function formatSchema(schema: string): Promise<string> {
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
  outputFilePath?: string;
}

async function main(opts: GeneratorOptions = {}) {
  const { config, tsConfigPath, format, outputFilePath } = { ...opts };

  const configFilePath =
    config ??
    (await findConfigFile({ configFilePath: config ?? defaultConfigFile }));
  const resolvedTsConfigPath = tsConfigPath ?? defaultTsConfigFile;
  const resolvedOutputFilePath = outputFilePath ?? defaultOutputFile;

  const fullConfigPath = path.resolve(process.cwd(), configFilePath);

  try {
    await fs.access(fullConfigPath);
  } catch (error) {
    console.error(
      `❌ drizzle-zero: config file not found at ${fullConfigPath}`,
    );
    process.exit(1);
  }

  const fullConfigUrl = pathToFileURL(fullConfigPath)
  const zeroConfigImport = await tsImport(fullConfigUrl.href, {
    parentURL: import.meta.url,
  });
  const exportName = zeroConfigImport?.default ? "default" : "schema";
  const zeroConfig = zeroConfigImport?.default ?? zeroConfigImport?.schema;

  if (!zeroConfig) {
    console.error(
      "❌ drizzle-zero: No config found in the config file - did you export `default` or `schema`?",
    );
    process.exit(1);
  }

  const tsProject = new Project({
    tsConfigFilePath: resolvedTsConfigPath,
  });

  const zeroSchemaTypeDecl = await getZeroSchemaDefsFromConfig({
    tsProject,
    configPath: fullConfigPath,
    exportName,
  });

  let zeroSchemaGenerated = await getGeneratedSchema({
    tsProject,
    zeroSchema: zeroConfig,
    zeroSchemaTypeDecl,
    outputFilePath: resolvedOutputFilePath,
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
        outputFilePath: command.output,
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

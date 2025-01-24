import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { test, describe } from "vitest";

const runZeroBuildSchema = async (testName: string) => {
  const schemaPath = path.join(
    process.cwd(),
    "tests",
    "schemas",
    `${testName}.zero.ts`,
  );
  const tmpDir = path.join(os.tmpdir(), "zero-build-schema-test", testName);

  try {
    fs.mkdirSync(tmpDir, { recursive: true });

    const outputPath = path.join(tmpDir, "schema.json");

    execSync(`pnpm exec zero-build-schema -p ${schemaPath} -o ${outputPath}`, {
      encoding: "utf-8",
    });

    const output = fs.readFileSync(outputPath, { encoding: "utf-8" });

    return JSON.parse(output);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Command execution failed:", error.message);
    }
    throw error;
  } finally {
    // Clean up temporary files
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
};

describe.concurrent("compile", () => {
  test("compile - no-relations", async ({ expect }) => {
    const result = await runZeroBuildSchema("no-relations");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot( `
      [
        "profile_info",
        "user",
      ]
    `);
  });

  test("compile - one-to-one-2", async ({ expect }) => {
    const result = await runZeroBuildSchema("one-to-one-2");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot( `
      [
        "medium",
        "message",
        "user",
      ]
    `);
  });

  test("compile - one-to-one", async ({ expect }) => {
    const result = await runZeroBuildSchema("one-to-one");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot( `
      [
        "profile_info",
        "user",
      ]
    `);
  });

  test("compile - one-to-one-subset", async ({ expect }) => {
    const result = await runZeroBuildSchema("one-to-one-subset");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "user",
      ]
    `);
    expect(Object.keys(result.schema.relationships)).toMatchInlineSnapshot(`[]`);
    expect(result.schema.tables.user.primaryKey).toMatchInlineSnapshot(`
      [
        "id",
      ]
    `);
    expect(Object.keys(result.schema.tables.user.columns)).toMatchInlineSnapshot(`
      [
        "id",
        "name",
      ]
    `);
  });

  test("compile - one-to-one-foreign-key", async ({ expect }) => {
    const result = await runZeroBuildSchema("one-to-one-foreign-key");
    expect(result.schema.tables.users).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "posts",
        "users",
      ]
    `);
  });

  test("compile - one-to-one-self", async ({ expect }) => {
    const result = await runZeroBuildSchema("one-to-one-self");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "user",
      ]
    `);
  });

  test("compile - one-to-many", async ({ expect }) => {
    const result = await runZeroBuildSchema("one-to-many");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "comment",
        "post",
        "user",
      ]
    `);
  });

  test("compile - one-to-many-named", async ({ expect }) => {
    const result = await runZeroBuildSchema("one-to-many-named");
    expect(result.schema.tables.users).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "posts",
        "users",
      ]
    `);
  });

  test("compile - many-to-many", async ({ expect }) => {
    const result = await runZeroBuildSchema("many-to-many");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "group",
        "user",
        "users_to_group",
      ]
    `);
  });

  test("compile - many-to-many-subset", async ({ expect }) => {
    const result = await runZeroBuildSchema("many-to-many-subset");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "user",
      ]
    `);
  });

  test("compile - many-to-many-subset-2", async ({ expect }) => {
    const result = await runZeroBuildSchema("many-to-many-subset-2");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "user",
        "users_to_group",
      ]
    `);
  });

  test("compile - many-to-many-self-referential", async ({ expect }) => {
    const result = await runZeroBuildSchema("many-to-many-self-referential");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "friendship",
        "user",
      ]
    `);
    expect(Object.keys(result.schema.relationships)).toMatchInlineSnapshot(`
      [
        "user",
      ]
    `);
    expect(Object.keys(result.schema.relationships.user))
      .toMatchInlineSnapshot(`
      [
        "friends",
      ]
    `);
  });

  test("compile - custom-schema", async ({ expect }) => {
    const result = await runZeroBuildSchema("custom-schema");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "user",
      ]
    `);
  });
});

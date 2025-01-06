import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect, test, describe } from "vitest";

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
  test("compile - no-relations", async () => {
    const result = await runZeroBuildSchema("no-relations");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toEqual(["profile_info", "user"]);
  });

  test("compile - one-to-one", async () => {
    const result = await runZeroBuildSchema("one-to-one");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toEqual(["profile_info", "user"]);
  });

  test("compile - one-to-one-2", async () => {
    const result = await runZeroBuildSchema("one-to-one-2");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toEqual([
      "medium",
      "message",
      "user",
    ]);
  });

  test("compile - one-to-one-subset", async () => {
    const result = await runZeroBuildSchema("one-to-one-subset");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toEqual(["user"]);
  });

  test("compile - one-to-one-foreign-key", async () => {
    const result = await runZeroBuildSchema("one-to-one-foreign-key");
    expect(result.schema.tables.users).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toEqual(["posts", "users"]);
  });

  test("compile - one-to-one-self", async () => {
    const result = await runZeroBuildSchema("one-to-one-self");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toEqual(["user"]);
  });

  test("compile - one-to-many", async () => {
    const result = await runZeroBuildSchema("one-to-many");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toEqual([
      "comment",
      "post",
      "user",
    ]);
  });

  test("compile - one-to-many-named", async () => {
    const result = await runZeroBuildSchema("one-to-many-named");
    expect(result.schema.tables.users).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toEqual(["posts", "users"]);
  });

  test("compile - many-to-many", async () => {
    const result = await runZeroBuildSchema("many-to-many");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toEqual([
      "group",
      "user",
      "users_to_group",
    ]);
  });

  test("compile - many-to-many-subset", async () => {
    const result = await runZeroBuildSchema("many-to-many-subset");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toEqual(["user"]);
  });

  test("compile - many-to-many-subset-2", async () => {
    const result = await runZeroBuildSchema("many-to-many-subset-2");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toEqual([
      "user",
      "users_to_group",
    ]);
  });
});

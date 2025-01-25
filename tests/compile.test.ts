import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { test, describe, TestAPI } from "vitest";

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
  test("compile - no-relations", async ({ expect }: TestAPI) => {
    const result = await runZeroBuildSchema("no-relations");
    expect(result).toMatchInlineSnapshot( `
      {
        "permissions": {
          "profile_info": {
            "row": {
              "update": {},
            },
          },
          "user": {
            "row": {
              "update": {},
            },
          },
        },
        "schema": {
          "relationships": {},
          "tables": {
            "profile_info": {
              "columns": {
                "id": {
                  "customType": null,
                  "optional": false,
                  "type": "string",
                },
                "metadata": {
                  "customType": null,
                  "optional": true,
                  "type": "json",
                },
                "user_id": {
                  "customType": null,
                  "optional": true,
                  "type": "string",
                },
              },
              "name": "profile_info",
              "primaryKey": [
                "id",
              ],
            },
            "user": {
              "columns": {
                "id": {
                  "customType": null,
                  "optional": false,
                  "type": "string",
                },
                "name": {
                  "customType": null,
                  "optional": true,
                  "type": "string",
                },
              },
              "name": "user",
              "primaryKey": [
                "id",
              ],
            },
          },
          "version": 1,
        },
      }
    `);
  });

  test("compile - one-to-one-2", async ({ expect }: TestAPI) => {
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

  test("compile - one-to-one", async ({ expect }: TestAPI) => {
    const result = await runZeroBuildSchema("one-to-one");
    expect(result).toMatchInlineSnapshot( `
      {
        "permissions": {
          "profile_info": {
            "row": {
              "update": {},
            },
          },
          "user": {
            "row": {
              "update": {},
            },
          },
        },
        "schema": {
          "relationships": {
            "profile_info": {
              "user": [
                {
                  "cardinality": "one",
                  "destField": [
                    "id",
                  ],
                  "destSchema": "user",
                  "sourceField": [
                    "user_id",
                  ],
                },
              ],
            },
            "user": {
              "profileInfo": [
                {
                  "cardinality": "one",
                  "destField": [
                    "user_id",
                  ],
                  "destSchema": "profile_info",
                  "sourceField": [
                    "id",
                  ],
                },
              ],
            },
          },
          "tables": {
            "profile_info": {
              "columns": {
                "id": {
                  "customType": null,
                  "optional": false,
                  "type": "string",
                },
                "metadata": {
                  "customType": null,
                  "optional": true,
                  "type": "json",
                },
                "user_id": {
                  "customType": null,
                  "optional": true,
                  "type": "string",
                },
              },
              "name": "profile_info",
              "primaryKey": [
                "id",
              ],
            },
            "user": {
              "columns": {
                "id": {
                  "customType": null,
                  "optional": false,
                  "type": "string",
                },
                "name": {
                  "customType": null,
                  "optional": true,
                  "type": "string",
                },
              },
              "name": "user",
              "primaryKey": [
                "id",
              ],
            },
          },
          "version": 1,
        },
      }
    `);
  });

  test("compile - one-to-one-subset", async ({ expect }: TestAPI) => {
    const result = await runZeroBuildSchema("one-to-one-subset");
    expect(result).toMatchInlineSnapshot(`
      {
        "permissions": {
          "user": {
            "row": {
              "update": {},
            },
          },
        },
        "schema": {
          "relationships": {},
          "tables": {
            "user": {
              "columns": {
                "id": {
                  "customType": null,
                  "optional": false,
                  "type": "string",
                },
                "name": {
                  "customType": null,
                  "optional": true,
                  "type": "string",
                },
              },
              "name": "user",
              "primaryKey": [
                "id",
              ],
            },
          },
          "version": 1,
        },
      }
    `);
  });

  test("compile - one-to-one-foreign-key", async ({ expect }: TestAPI) => {
    const result = await runZeroBuildSchema("one-to-one-foreign-key");
    expect(result.schema.tables.users).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "posts",
        "users",
      ]
    `);
  });

  test("compile - one-to-one-self", async ({ expect }: TestAPI) => {
    const result = await runZeroBuildSchema("one-to-one-self");
    expect(result).toMatchInlineSnapshot(`
      {
        "permissions": {
          "user": {
            "row": {
              "update": {},
            },
          },
        },
        "schema": {
          "relationships": {
            "user": {
              "invitee": [
                {
                  "cardinality": "one",
                  "destField": [
                    "id",
                  ],
                  "destSchema": "user",
                  "sourceField": [
                    "invited_by",
                  ],
                },
              ],
            },
          },
          "tables": {
            "user": {
              "columns": {
                "id": {
                  "customType": null,
                  "optional": false,
                  "type": "string",
                },
                "invited_by": {
                  "customType": null,
                  "optional": true,
                  "type": "string",
                },
                "name": {
                  "customType": null,
                  "optional": true,
                  "type": "string",
                },
              },
              "name": "user",
              "primaryKey": [
                "id",
              ],
            },
          },
          "version": 1,
        },
      }
    `);
  });

  test("compile - one-to-many", async ({ expect }: TestAPI) => {
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

  test("compile - one-to-many-named", async ({ expect }: TestAPI) => {
    const result = await runZeroBuildSchema("one-to-many-named");
    expect(result.schema.tables.users).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "posts",
        "users",
      ]
    `);
  });

  test("compile - many-to-many", async ({ expect }: TestAPI) => {
    const result = await runZeroBuildSchema("many-to-many");
    expect(result).toMatchInlineSnapshot(`
      {
        "permissions": {
          "group": {
            "row": {
              "update": {},
            },
          },
          "user": {
            "row": {
              "update": {},
            },
          },
          "users_to_group": {
            "row": {
              "update": {},
            },
          },
        },
        "schema": {
          "relationships": {
            "group": {
              "usersToGroups": [
                {
                  "cardinality": "many",
                  "destField": [
                    "group_id",
                  ],
                  "destSchema": "users_to_group",
                  "sourceField": [
                    "id",
                  ],
                },
              ],
            },
            "user": {
              "groups": [
                {
                  "cardinality": "many",
                  "destField": [
                    "user_id",
                  ],
                  "destSchema": "users_to_group",
                  "sourceField": [
                    "id",
                  ],
                },
                {
                  "cardinality": "many",
                  "destField": [
                    "id",
                  ],
                  "destSchema": "group",
                  "sourceField": [
                    "group_id",
                  ],
                },
              ],
              "usersToGroups": [
                {
                  "cardinality": "many",
                  "destField": [
                    "user_id",
                  ],
                  "destSchema": "users_to_group",
                  "sourceField": [
                    "id",
                  ],
                },
              ],
            },
            "users_to_group": {
              "group": [
                {
                  "cardinality": "one",
                  "destField": [
                    "id",
                  ],
                  "destSchema": "group",
                  "sourceField": [
                    "group_id",
                  ],
                },
              ],
              "user": [
                {
                  "cardinality": "one",
                  "destField": [
                    "id",
                  ],
                  "destSchema": "user",
                  "sourceField": [
                    "user_id",
                  ],
                },
              ],
            },
          },
          "tables": {
            "group": {
              "columns": {
                "id": {
                  "customType": null,
                  "optional": false,
                  "type": "string",
                },
                "name": {
                  "customType": null,
                  "optional": true,
                  "type": "string",
                },
              },
              "name": "group",
              "primaryKey": [
                "id",
              ],
            },
            "user": {
              "columns": {
                "id": {
                  "customType": null,
                  "optional": false,
                  "type": "string",
                },
                "name": {
                  "customType": null,
                  "optional": true,
                  "type": "string",
                },
              },
              "name": "user",
              "primaryKey": [
                "id",
              ],
            },
            "users_to_group": {
              "columns": {
                "group_id": {
                  "customType": null,
                  "optional": false,
                  "type": "string",
                },
                "user_id": {
                  "customType": null,
                  "optional": false,
                  "type": "string",
                },
              },
              "name": "users_to_group",
              "primaryKey": [
                "user_id",
                "group_id",
              ],
            },
          },
          "version": 1,
        },
      }
    `);
  });

  test("compile - many-to-many-subset", async ({ expect }: TestAPI) => {
    const result = await runZeroBuildSchema("many-to-many-subset");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "user",
      ]
    `);
  });

  test("compile - many-to-many-subset-2", async ({ expect }: TestAPI) => {
    const result = await runZeroBuildSchema("many-to-many-subset-2");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "user",
        "users_to_group",
      ]
    `);
  });

  test("compile - many-to-many-self-referential", async ({ expect }: TestAPI) => {
    const result = await runZeroBuildSchema("many-to-many-self-referential");
    expect(result)
      .toMatchInlineSnapshot(`
        {
          "permissions": {
            "friendship": {
              "row": {
                "update": {},
              },
            },
            "user": {
              "row": {
                "update": {},
              },
            },
          },
          "schema": {
            "relationships": {
              "user": {
                "friends": [
                  {
                    "cardinality": "many",
                    "destField": [
                      "requesting_id",
                    ],
                    "destSchema": "friendship",
                    "sourceField": [
                      "id",
                    ],
                  },
                  {
                    "cardinality": "many",
                    "destField": [
                      "id",
                    ],
                    "destSchema": "user",
                    "sourceField": [
                      "accepting_id",
                    ],
                  },
                ],
              },
            },
            "tables": {
              "friendship": {
                "columns": {
                  "accepted": {
                    "customType": null,
                    "optional": false,
                    "type": "boolean",
                  },
                  "accepting_id": {
                    "customType": null,
                    "optional": false,
                    "type": "string",
                  },
                  "requesting_id": {
                    "customType": null,
                    "optional": false,
                    "type": "string",
                  },
                },
                "name": "friendship",
                "primaryKey": [
                  "requesting_id",
                  "accepting_id",
                ],
              },
              "user": {
                "columns": {
                  "id": {
                    "customType": null,
                    "optional": false,
                    "type": "string",
                  },
                  "name": {
                    "customType": null,
                    "optional": false,
                    "type": "string",
                  },
                },
                "name": "user",
                "primaryKey": [
                  "id",
                ],
              },
            },
            "version": 1,
          },
        }
      `);
  });

  test("compile - custom-schema", async ({ expect }: TestAPI) => {
    const result = await runZeroBuildSchema("custom-schema");
    expect(result.schema.tables.user).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "user",
      ]
    `);
  });
});

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
    expect(result).toMatchInlineSnapshot(`
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
            "profileInfo": {
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
                "userId": {
                  "customType": null,
                  "optional": true,
                  "serverName": "user_id",
                  "type": "string",
                },
              },
              "name": "profileInfo",
              "primaryKey": [
                "id",
              ],
              "serverName": "profile_info",
            },
            "users": {
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
              "name": "users",
              "primaryKey": [
                "id",
              ],
              "serverName": "user",
            },
          },
          "version": 1,
        },
      }
    `);
  });

  test("compile - one-to-one-2", async ({ expect }: TestAPI) => {
    const result = await runZeroBuildSchema("one-to-one-2");
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "mediumTable",
        "messageTable",
        "userTable",
      ]
    `);
  });

  test("compile - one-to-one", async ({ expect }: TestAPI) => {
    const result = await runZeroBuildSchema("one-to-one");
    expect(result).toMatchInlineSnapshot(`
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
            "profileInfo": {
              "user": [
                {
                  "cardinality": "one",
                  "destField": [
                    "id",
                  ],
                  "destSchema": "users",
                  "sourceField": [
                    "userId",
                  ],
                },
              ],
            },
            "users": {
              "profileInfo": [
                {
                  "cardinality": "one",
                  "destField": [
                    "userId",
                  ],
                  "destSchema": "profileInfo",
                  "sourceField": [
                    "id",
                  ],
                },
              ],
            },
          },
          "tables": {
            "profileInfo": {
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
                "userId": {
                  "customType": null,
                  "optional": true,
                  "serverName": "user_id",
                  "type": "string",
                },
              },
              "name": "profileInfo",
              "primaryKey": [
                "id",
              ],
              "serverName": "profile_info",
            },
            "users": {
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
              "name": "users",
              "primaryKey": [
                "id",
              ],
              "serverName": "user",
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
            "users": {
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
              "name": "users",
              "primaryKey": [
                "id",
              ],
              "serverName": "user",
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
            "users": {
              "invitee": [
                {
                  "cardinality": "one",
                  "destField": [
                    "id",
                  ],
                  "destSchema": "users",
                  "sourceField": [
                    "invitedBy",
                  ],
                },
              ],
            },
          },
          "tables": {
            "users": {
              "columns": {
                "id": {
                  "customType": null,
                  "optional": false,
                  "type": "string",
                },
                "invitedBy": {
                  "customType": null,
                  "optional": true,
                  "serverName": "invited_by",
                  "type": "string",
                },
                "name": {
                  "customType": null,
                  "optional": true,
                  "type": "string",
                },
              },
              "name": "users",
              "primaryKey": [
                "id",
              ],
              "serverName": "user",
            },
          },
          "version": 1,
        },
      }
    `);
  });

  test("compile - one-to-many", async ({ expect }: TestAPI) => {
    const result = await runZeroBuildSchema("one-to-many");
    expect(result.schema.tables.users).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "comments",
        "posts",
        "users",
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
            "groups": {
              "usersToGroups": [
                {
                  "cardinality": "many",
                  "destField": [
                    "groupId",
                  ],
                  "destSchema": "usersToGroups",
                  "sourceField": [
                    "id",
                  ],
                },
              ],
            },
            "users": {
              "groups": [
                {
                  "cardinality": "many",
                  "destField": [
                    "userId",
                  ],
                  "destSchema": "usersToGroups",
                  "sourceField": [
                    "id",
                  ],
                },
                {
                  "cardinality": "many",
                  "destField": [
                    "id",
                  ],
                  "destSchema": "groups",
                  "sourceField": [
                    "groupId",
                  ],
                },
              ],
              "usersToGroups": [
                {
                  "cardinality": "many",
                  "destField": [
                    "userId",
                  ],
                  "destSchema": "usersToGroups",
                  "sourceField": [
                    "id",
                  ],
                },
              ],
            },
            "usersToGroups": {
              "group": [
                {
                  "cardinality": "one",
                  "destField": [
                    "id",
                  ],
                  "destSchema": "groups",
                  "sourceField": [
                    "groupId",
                  ],
                },
              ],
              "user": [
                {
                  "cardinality": "one",
                  "destField": [
                    "id",
                  ],
                  "destSchema": "users",
                  "sourceField": [
                    "userId",
                  ],
                },
              ],
            },
          },
          "tables": {
            "groups": {
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
              "name": "groups",
              "primaryKey": [
                "id",
              ],
              "serverName": "group",
            },
            "users": {
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
              "name": "users",
              "primaryKey": [
                "id",
              ],
              "serverName": "user",
            },
            "usersToGroups": {
              "columns": {
                "groupId": {
                  "customType": null,
                  "optional": false,
                  "serverName": "group_id",
                  "type": "string",
                },
                "userId": {
                  "customType": null,
                  "optional": false,
                  "serverName": "user_id",
                  "type": "string",
                },
              },
              "name": "usersToGroups",
              "primaryKey": [
                "userId",
                "groupId",
              ],
              "serverName": "users_to_group",
            },
          },
          "version": 1,
        },
      }
    `);
  });

  test("compile - many-to-many-subset", async ({ expect }: TestAPI) => {
    const result = await runZeroBuildSchema("many-to-many-subset");
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "users",
      ]
    `);
  });

  test("compile - many-to-many-subset-2", async ({ expect }: TestAPI) => {
    const result = await runZeroBuildSchema("many-to-many-subset-2");
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "users",
        "usersToGroups",
      ]
    `);
  });

  test("compile - many-to-many-self-referential", async ({
    expect,
  }: TestAPI) => {
    const result = await runZeroBuildSchema("many-to-many-self-referential");
    expect(result).toMatchInlineSnapshot(`
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
                      "requestingId",
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
                      "acceptingId",
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
                  "acceptingId": {
                    "customType": null,
                    "optional": false,
                    "serverName": "accepting_id",
                    "type": "string",
                  },
                  "requestingId": {
                    "customType": null,
                    "optional": false,
                    "serverName": "requesting_id",
                    "type": "string",
                  },
                },
                "name": "friendship",
                "primaryKey": [
                  "requestingId",
                  "acceptingId",
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
    expect(result.schema.tables.users).toBeTruthy();
    expect(Object.keys(result.schema.tables)).toMatchInlineSnapshot(`
      [
        "users",
      ]
    `);
  });
});

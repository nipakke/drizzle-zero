import {
  ANYONE_CAN,
  createSchema,
  definePermissions,
  type Schema,
} from "@rocicorp/zero";
import { createZeroSchema } from "../../src";
import * as oneToOneMissingForeignKey from "./one-to-one-missing-foreign-key.schema";

export const schema = createSchema(
  createZeroSchema(oneToOneMissingForeignKey, {
    version: 1,
    tables: {
      users: {
        id: true,
        name: true,
      },
      posts: {
        id: true,
        name: true,
        author: true,
      },
    },
  }),
);

export const permissions = definePermissions<{}, Schema>(schema, () => {
  return {
    user: {
      row: {
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
    posts: {
      row: {
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
  };
});

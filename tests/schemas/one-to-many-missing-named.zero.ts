import {
  ANYONE_CAN,
  createSchema,
  definePermissions,
  type Schema,
} from "@rocicorp/zero";
import { createZeroSchema } from "../../src";
import * as oneToManyMissingNamed from "./one-to-many-missing-named.schema";

export const schema = createSchema(
  createZeroSchema(oneToManyMissingNamed, {
    version: 1,
    tables: {
      users: {
        id: true,
        name: true,
      },
      posts: {
        id: true,
        content: true,
        author_id: true,
        reviewer_id: true,
      },
    },
  }),
);

export const permissions = definePermissions<{}, Schema>(schema, () => {
  return {
    post: {
      row: {
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
    comment: {
      row: {
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
    user: {
      row: {
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
  };
});

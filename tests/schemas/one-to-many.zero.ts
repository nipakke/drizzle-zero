import {
  ANYONE_CAN,
  createSchema,
  definePermissions,
  type Schema,
} from "@rocicorp/zero";
import { createZeroSchema } from "../../src";
import * as oneToMany from "./one-to-many.schema";

export const schema = createSchema(
  createZeroSchema(oneToMany, {
    version: 1,
    tables: {
      user: {
        id: true,
        name: true,
      },
      post: {
        id: true,
        content: true,
        author_id: true,
      },
      comment: {
        id: true,
        text: true,
        post_id: true,
        author_id: true,
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

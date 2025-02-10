import { ANYONE_CAN, definePermissions, type Schema } from "@rocicorp/zero";
import { createZeroSchema } from "../../src";
import * as oneToMany from "./one-to-many.schema";

export const schema = createZeroSchema(oneToMany, {
  version: 1,
  tables: {
    users: {
      id: true,
      name: true,
    },
    posts: {
      id: true,
      content: true,
      authorId: true,
    },
    comments: {
      id: true,
      text: true,
      postId: true,
      authorId: true,
    },
  },
});

export const permissions = definePermissions<{}, Schema>(schema, () => {
  return {
    posts: {
      row: {
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
    comments: {
      row: {
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
    users: {
      row: {
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
  };
});

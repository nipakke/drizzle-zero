import { ANYONE_CAN, definePermissions, type Schema } from "@rocicorp/zero";
import { drizzleZeroConfig } from "../../src";
import * as oneToManyMissingOne from "./one-to-many-missing-one.schema";

export const schema = drizzleZeroConfig(oneToManyMissingOne, {
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
  },
});

export const permissions = definePermissions<{}, Schema>(schema, () => {
  return {
    posts: {
      row: {
        select: ANYONE_CAN,
        insert: ANYONE_CAN,
        update: {
          preMutation: ANYONE_CAN,
          postMutation: ANYONE_CAN,
        },
        delete: ANYONE_CAN,
      },
    },
    users: {
      row: {
        select: ANYONE_CAN,
        insert: ANYONE_CAN,
        update: {
          preMutation: ANYONE_CAN,
          postMutation: ANYONE_CAN,
        },
        delete: ANYONE_CAN,
      },
    },
  };
});

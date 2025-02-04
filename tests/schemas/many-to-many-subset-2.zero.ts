import { ANYONE_CAN, definePermissions, type Schema } from "@rocicorp/zero";
import { createZeroSchema } from "../../src";
import * as manyToMany from "./many-to-many.schema";

export const schema = createZeroSchema(manyToMany, {
  version: 1,
  tables: {
    user: {
      id: true,
      name: true,
    },
    users_to_group: {
      user_id: true,
      group_id: true,
    },
    group: false,
  },
});

export const permissions = definePermissions<{}, Schema>(schema, () => {
  return {
    user: {
      row: {
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
    users_to_group: {
      row: {
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
  };
});

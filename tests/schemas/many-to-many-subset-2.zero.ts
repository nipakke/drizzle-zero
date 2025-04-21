import { ANYONE_CAN, definePermissions, type Schema } from "@rocicorp/zero";
import { drizzleZeroConfig } from "../../src";
import * as manyToMany from "./many-to-many.schema";

export const schema = drizzleZeroConfig(manyToMany, {
  tables: {
    users: {
      id: true,
      name: true,
    },
    usersToGroups: {
      userId: true,
      groupId: true,
    },
    groups: false,
  },
});

export const permissions = definePermissions<{}, Schema>(schema, () => {
  return {
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
    usersToGroups: {
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

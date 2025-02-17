import { ANYONE_CAN, definePermissions, type Schema } from "@rocicorp/zero";
import { createZeroSchema } from "../../src";
import * as manyToMany from "./many-to-many.schema";

export const schema = createZeroSchema(manyToMany, {
  version: 1,
  tables: {
    users: {
      id: true,
      name: true,
    },
    groups: {
      id: true,
      name: true,
    },
    usersToGroups: {
      userId: true,
      groupId: true,
    },
  },
  manyToMany: {
    users: {
      usersToGroups: ["usersToGroups", "groups"],
    },
  },
});

export const permissions = definePermissions<{}, Schema>(schema, () => {
  return {
    groups: {
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

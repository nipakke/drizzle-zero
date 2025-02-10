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
      groups: [
        {
          sourceField: ["id"],
          destTable: "usersToGroups",
          destField: ["userId"],
        },
        {
          sourceField: ["groupId"],
          destTable: "groups",
          destField: ["id"],
        },
      ],
    },
  },
});

export const permissions = definePermissions<{}, Schema>(schema, () => {
  return {
    groups: {
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
    usersToGroups: {
      row: {
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
  };
});

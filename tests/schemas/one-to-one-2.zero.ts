import { ANYONE_CAN, definePermissions, type Schema } from "@rocicorp/zero";
import { createZeroSchema } from "../../src";
import * as oneToOne2 from "./one-to-one-2.schema";

export const schema = createZeroSchema(oneToOne2, {
  version: 2.1,
  tables: {
    user: {
      id: true,
      name: true,
      partner: true,
    },
    medium: {
      id: true,
      name: true,
    },
    message: {
      id: true,
      senderId: true,
      mediumId: true,
      body: true,
    },
  },
  manyToMany: {
    user: {
      mediums: ["message", "medium"],
    },
  },
});

export const permissions = definePermissions<{}, Schema>(schema, () => {
  return {
    medium: {
      row: {
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
    message: {
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

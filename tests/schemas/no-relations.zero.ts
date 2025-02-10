import { ANYONE_CAN, definePermissions, type Schema } from "@rocicorp/zero";
import { createZeroSchema } from "../../src";
import * as noRelations from "./no-relations.schema";

export const schema = createZeroSchema(noRelations, {
  version: 1,
  tables: {
    users: {
      id: true,
      name: true,
    },
    profileInfo: {
      id: true,
      userId: true,
      metadata: true,
    },
  },
});

export const permissions = definePermissions<{}, Schema>(schema, () => {
  return {
    users: {
      row: {
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
    profileInfo: {
      row: {
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
  };
});

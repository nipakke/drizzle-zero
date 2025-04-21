import { ANYONE_CAN, definePermissions, type Schema } from "@rocicorp/zero";
import { drizzleZeroConfig } from "../../src";
import * as customSchema from "./custom-schema.schema";

export const schema = drizzleZeroConfig(customSchema, {
  tables: {
    users: {
      id: true,
      name: true,
      invitedBy: true,
    },
  },
  debug: true,
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
  };
});

import { ANYONE_CAN, definePermissions, type Schema } from "@rocicorp/zero";
import { createZeroSchema } from "../../src";
import * as customSchema from "./custom-schema.schema";

export const schema = createZeroSchema(customSchema, {
  version: 1,
  tables: {
    user: {
      id: true,
      name: true,
      invited_by: true,
    },
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
  };
});

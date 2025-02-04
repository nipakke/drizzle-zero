import {
  ANYONE_CAN,
  definePermissions,
  type Schema
} from "@rocicorp/zero";
import { createZeroSchema } from "../../src";
import * as oneToOne from "./one-to-one.schema";

export const schema = createZeroSchema(oneToOne, {
  version: 1,
  tables: {
    user: {
      id: true,
      name: true,
    },
    profile_info: false,
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

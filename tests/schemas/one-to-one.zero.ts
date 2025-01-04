import {
  ANYONE_CAN,
  createSchema,
  definePermissions,
  type Schema
} from "@rocicorp/zero";
import { createZeroSchema } from "../../src";
import * as oneToOne from "./one-to-one.schema";

export const schema = createSchema(
  createZeroSchema(oneToOne, {
    version: 1,
    tables: {
      user: {
        id: true,
        name: true,
      },
      profile_info: {
        id: true,
        user_id: true,
        metadata: true,
      },
    },
  }),
);

export const permissions = definePermissions<{}, Schema>(schema, () => {
  return {
    user: {
      row: {
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
    profile_info: {
      row: {
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
  };
});

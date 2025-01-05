import {
  ANYONE_CAN,
  createSchema,
  definePermissions,
  type Schema,
} from "@rocicorp/zero";
import { createZeroSchema } from "../../src";
import * as oneToOneSelf from "./one-to-one-self.schema";

export const schema = createSchema(
  createZeroSchema(oneToOneSelf, {
    version: 1,
    tables: {
      user: {
        id: true,
        name: true,
        invited_by: true,
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

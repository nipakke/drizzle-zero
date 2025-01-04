import {
  ANYONE_CAN,
  createSchema,
  definePermissions,
  type ExpressionBuilder,
  type Row,
} from "@rocicorp/zero";
import { createZeroSchema } from "drizzle-zero";
import * as drizzleSchema from "./drizzle/schema";

const zeroSchema = createZeroSchema(drizzleSchema, {
  version: 1,
  tables: {
    user: {
      id: true,
      name: true,
      partner: false,
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
});

export const schema = createSchema(zeroSchema);

export type Schema = typeof schema;
export type Message = Row<typeof schema.tables.message>;
export type Medium = Row<typeof schema.tables.medium>;
export type User = Row<typeof schema.tables.user>;

// The contents of your decoded JWT.
type AuthData = {
  sub: string | null;
};

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  const allowIfSender1 = (
    _authData: AuthData,
    { cmp }: ExpressionBuilder<typeof schema.tables.message>,
  ) => cmp("senderId", "=", "1");

  return {
    medium: {
      row: {
        select: ANYONE_CAN,
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
    user: {
      row: {
        select: ANYONE_CAN,
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
    message: {
      row: {
        select: [allowIfSender1],
        insert: ANYONE_CAN,
        update: {
          preMutation: [allowIfSender1],
        },
        delete: [allowIfSender1],
      },
    },
  };
});

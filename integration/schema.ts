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
      createdAt: true,
      updatedAt: true,
      id: true,
      name: true,
      partner: false,
    },
    medium: {
      createdAt: true,
      updatedAt: true,
      id: true,
      name: true,
    },
    message: {
      createdAt: true,
      updatedAt: true,
      id: true,
      senderId: true,
      mediumId: true,
      body: true,
      metadata: true,
    },
    all_types: {
      id: true,
      smallint: true,
      integer: true,
      bigint: true,
      bigint_number: true,
      smallserial: true,
      serial: true,
      bigserial: true,
      numeric: true,
      decimal: true,
      real: true,
      double_precision: true,
      text: true,
      char: true,
      uuid: true,
      varchar: true,
      boolean: true,
      timestamp: true,
      timestamp_tz: true,
      timestamp_mode_date: true,
      timestamp_mode_string: true,
      date: true,
      json: true,
      jsonb: true,
      typed_json: true,
      status: true,
      optional_smallint: true,
      optional_integer: true,
      optional_bigint: true,
      optional_numeric: true,
      optional_real: true,
      optional_double_precision: true,
      optional_text: true,
      optional_boolean: true,
      optional_timestamp: true,
      optional_json: true,
      optional_enum: true,
      optional_varchar: true,
      optional_uuid: true,
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
  const allowIfSenderIs1 = (
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
        select: [allowIfSenderIs1],
        insert: ANYONE_CAN,
        update: {
          preMutation: [allowIfSenderIs1],
        },
        delete: [allowIfSenderIs1],
      },
    },
    all_types: {
      row: {
        select: ANYONE_CAN,
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
  };
});

import {
  ANYONE_CAN,
  definePermissions,
  type ExpressionBuilder,
  type Row,
} from "@rocicorp/zero";
import { createZeroSchema } from "drizzle-zero";
import * as drizzleSchema from "./drizzle/schema";

const zeroSchema = createZeroSchema(drizzleSchema, {
  casing: "snake_case",
  tables: {
    zeroSchemaVersions: {
      maxSupportedVersion: true,
      minSupportedVersion: true,
      lock: true,
    },
    user: {
      createdAt: true,
      updatedAt: true,
      id: true,
      name: true,
      partner: true,
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
    allTypes: {
      id: true,
      createdAt: true,
      updatedAt: true,
      smallintField: true,
      integerField: true,
      bigintField: true,
      bigintNumberField: true,
      smallSerialField: true,
      serialField: true,
      bigSerialField: true,
      numericField: true,
      decimalField: true,
      realField: true,
      doublePrecisionField: true,
      textField: true,
      charField: true,
      uuidField: true,
      varcharField: true,
      booleanField: true,
      timestampField: true,
      timestampTzField: true,
      timestampModeDate: true,
      timestampModeString: true,
      dateField: true,
      jsonField: true,
      jsonbField: true,
      typedJsonField: true,
      statusField: true,
      optionalSmallint: true,
      optionalInteger: true,
      optionalBigint: true,
      optionalNumeric: true,
      optionalReal: true,
      optionalDoublePrecision: true,
      optionalText: true,
      optionalBoolean: true,
      optionalTimestamp: true,
      optionalJson: true,
      optionalEnum: true,
      optionalVarchar: true,
      optionalUuid: true,
    },
    friendship: {
      acceptingId: true,
      requestingId: true,
      accepted: true,
    },
  },
  manyToMany: {
    user: {
      mediums: ["message", "medium"],
      friends: [
        {
          sourceField: ["id"],
          destTable: "friendship",
          destField: ["requestingId"],
        },
        {
          sourceField: ["acceptingId"],
          destTable: "user",
          destField: ["id"],
        },
      ],
    },
  },
});

export const schema = zeroSchema;

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
    { cmp }: ExpressionBuilder<Schema, "message">,
  ) => cmp("senderId", "=", "1");

  return {
    medium: {
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
    user: {
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
    message: {
      row: {
        select: [allowIfSenderIs1],
        insert: ANYONE_CAN,
        update: {
          preMutation: [allowIfSenderIs1],
          postMutation: ANYONE_CAN,
        },
        delete: [allowIfSenderIs1],
      },
    },
    allTypes: {
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
    friendship: {
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

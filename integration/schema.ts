import {
  ANYONE_CAN,
  createSchema,
  createTableSchema,
  definePermissions,
  NOBODY_CAN,
  type ExpressionBuilder,
  type Row,
  type TableSchema,
} from "@rocicorp/zero";
import { createZeroSchema } from "drizzle-zero";
import { user } from "./drizzle/schema";

const userSchema = createZeroSchema(user, {
  id: true,
  name: true,
  partner: false,
});

const mediumSchema = createTableSchema({
  tableName: "medium",
  columns: {
    id: "string",
    name: "string",
  },
  primaryKey: "id",
});

const messageSchema = createTableSchema({
  tableName: "message",
  columns: {
    id: "string",
    senderId: "string",
    mediumId: "string",
    body: "string",
  },
  primaryKey: "id",
  relationships: {
    sender: {
      sourceField: "senderId",
      destSchema: userSchema,
      destField: "id",
    },
    medium: {
      sourceField: "mediumId",
      destSchema: mediumSchema,
      destField: "id",
    },
  },
});

export const schema = createSchema({
  version: 1,
  tables: {
    user: userSchema,
    medium: mediumSchema,
    message: messageSchema,
  },
});

export type Schema = typeof schema;
export type Message = Row<typeof messageSchema>;
export type Medium = Row<typeof mediumSchema>;
export type User = Row<typeof schema.tables.user>;

// The contents of your decoded JWT.
type AuthData = {
  sub: string | null;
};

export const permissions = definePermissions<AuthData, Schema>(schema, () => {
  const allowIfLoggedIn = (
    authData: AuthData,
    { cmpLit }: ExpressionBuilder<TableSchema>,
  ) => cmpLit(authData.sub, "IS NOT", null);

  const allowIfMessageSender = (
    authData: AuthData,
    { cmp }: ExpressionBuilder<typeof messageSchema>,
  ) => cmp("senderId", "=", authData.sub ?? "");

  return {
    medium: {
      row: {
        insert: NOBODY_CAN,
        update: {
          preMutation: NOBODY_CAN,
        },
        delete: NOBODY_CAN,
      },
    },
    user: {
      row: {
        insert: NOBODY_CAN,
        update: {
          preMutation: NOBODY_CAN,
        },
        delete: NOBODY_CAN,
      },
    },
    message: {
      row: {
        // anyone can insert
        insert: ANYONE_CAN,
        // only sender can edit their own messages
        update: {
          preMutation: [allowIfMessageSender],
        },
        // must be logged in to delete
        delete: [allowIfLoggedIn],
      },
    },
  };
});

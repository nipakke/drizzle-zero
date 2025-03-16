import { ANYONE_CAN, definePermissions, type Schema } from "@rocicorp/zero";
import { createZeroSchema } from "../../src";
import * as manyToManySelfReferential from "./many-to-many-self-referential.schema";

export const schema = createZeroSchema(manyToManySelfReferential, {
  tables: {
    user: {
      id: true,
      name: true,
    },
    friendship: {
      requestingId: true,
      acceptingId: true,
      accepted: true,
    },
  },
  manyToMany: {
    user: {
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

export const permissions = definePermissions<{}, Schema>(schema, () => {
  return {
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

import { ANYONE_CAN, definePermissions, type Schema } from "@rocicorp/zero";
import { createZeroSchema } from "../../src";
import * as manyToManySelfReferential from "./many-to-many-self-referential.schema";

export const schema = createZeroSchema(manyToManySelfReferential, {
  version: 1,
  tables: {
    user: {
      id: true,
      name: true,
    },
    friendship: {
      requesting_id: true,
      accepting_id: true,
      accepted: true,
    },
  },
  manyToMany: {
    user: {
      friends: [
        {
          sourceField: ["id"],
          destTable: "friendship",
          destField: ["requesting_id"],
        },
        {
          sourceField: ["accepting_id"],
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
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
    friendship: {
      row: {
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
  };
});

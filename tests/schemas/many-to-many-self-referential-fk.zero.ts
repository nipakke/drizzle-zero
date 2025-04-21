import { ANYONE_CAN, definePermissions, type Schema } from "@rocicorp/zero";
import { drizzleZeroConfig } from "../../src";
import * as manyToManySelfReferentialFk from "./many-to-many-self-referential-fk.schema";

export const schema = drizzleZeroConfig(manyToManySelfReferentialFk, {
  tables: {
    doc: {
      id: true,
      title: true,
    },
    related: {
      fk_from_doc: true,
      fk_to_doc: true,
    },
  },
  manyToMany: {
    doc: {
      related_docs: [
        {
          sourceField: ["id"],
          destTable: "related",
          destField: ["fk_from_doc"],
        },
        {
          sourceField: ["fk_to_doc"],
          destTable: "doc",
          destField: ["id"],
        },
      ],
    },
  },
});

export const permissions = definePermissions<{}, Schema>(schema, () => {
  return {
    doc: {
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
    related: {
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

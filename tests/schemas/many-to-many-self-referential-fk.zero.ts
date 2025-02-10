import { ANYONE_CAN, definePermissions, type Schema } from "@rocicorp/zero";
import { createZeroSchema } from "../../src";
import * as manyToManySelfReferentialFk from "./many-to-many-self-referential-fk.schema";

export const schema = createZeroSchema(manyToManySelfReferentialFk, {
  version: 1,
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
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
    related: {
      row: {
        insert: ANYONE_CAN,
        update: ANYONE_CAN,
        delete: ANYONE_CAN,
      },
    },
  };
});

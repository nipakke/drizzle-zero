import * as drizzleSchema from "./drizzle-schema";
import { createZeroSchema } from "../../src/index";

export default createZeroSchema(drizzleSchema, {
  tables: {
    User: {
      id: true,
      email: true,
      name: true,
      password: false,
    },
  },
});

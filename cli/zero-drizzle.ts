import * as drizzleSchema from "./drizzle-schema";
import { createZeroSchema } from "../src/index";

export const schema = createZeroSchema(drizzleSchema, {
  tables: {
    User: {
      id: true,
      email: true,
      name: true,
      password: false,
    },
    Account: {
      id: true,
      userId: true,
      provider: true,
    }
  }
}); 
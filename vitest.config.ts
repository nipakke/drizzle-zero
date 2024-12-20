import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    typecheck: {
      tsconfig: "tsconfig.json",
      include: ["tests/**/*.test.ts"],
    },
  },
  plugins: [tsconfigPaths()],
});

import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    typecheck: {
      tsconfig: "tsconfig.json",
      include: ["tests/**/*.test.ts"],
    },
    coverage: {
      include: ["src/**/*.ts"],
      thresholds: {
        lines: 100,
        statements: 100,
        functions: 100,
        branches: 90,
      },
    },
  },
  plugins: [tsconfigPaths()],
});

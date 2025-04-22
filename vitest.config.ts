import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 15000,
    include: ["tests/**/*.test.ts"],
    typecheck: {
      enabled: true,
      tsconfig: "tsconfig.json",
      include: ["tests/**/*.test.ts"],
    },
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/cli/index.ts"],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
        branches: 85,
      },
    },
  },
  plugins: [tsconfigPaths()],
});

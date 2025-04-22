import * as esbuild from "esbuild";
import * as tsup from "tsup";

const main = async () => {
  await tsup.build({
    outDir: "./dist",
    splitting: false,
    dts: true,
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
  });

  esbuild.buildSync({
    entryPoints: ["./src/cli/index.ts"],
    bundle: true,
    outfile: "dist/bin.cjs",
    format: "cjs",
    target: "node16",
    platform: "node",
    external: ["esbuild", "tsx", "prettier", "typescript"],
    banner: {
      js: `#!/usr/bin/env node`,
    },
  });
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

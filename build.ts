import * as esbuild from "esbuild";
import * as tsup from "tsup";
import pkg from "./package.json";

const main = async () => {
  await tsup.build({
    entry: ["src/index.ts"],
    outDir: "./dist",
    splitting: false,
    dts: true,
    format: ["cjs", "esm"],
  });

  await tsup.build({
    entry: ["src/cli.ts"],
    outDir: "./dist",
    splitting: false,
    format: ["cjs"],
    esbuildOptions: (opts) => {
      opts.banner ??= {};
      opts.banner.js = "#!/usr/bin/env node";
    },
  });
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import * as esbuild from "esbuild";
import * as tsup from "tsup";
import pkg from "./package.json";

const main = async () => {
  await tsup.build({
    entryPoints: ["./src/index.ts"],
    outDir: "./dist",
    splitting: false,
    dts: true,
    entry: ["src/index.ts"],
    format: ["cjs", "esm"],
  });

  esbuild.buildSync({
    entryPoints: ["./src/cli.ts"],
    bundle: true,
    outfile: "dist/bin.cjs",
    format: "cjs",
    target: "node16",
    platform: "node",
    external: ["esbuild", "tsx"],
    define: {
      "process.env.DRIZZLE_ZERO_VERSION": `"${pkg.version}"`,
    },
    banner: {
      js: `#!/usr/bin/env node`,
    },
  });
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

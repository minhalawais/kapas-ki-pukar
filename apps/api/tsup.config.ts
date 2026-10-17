import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/main.ts"],
  format: ["esm"],
  platform: "node",
  target: "node24",
  outDir: "dist",
  clean: true,
  sourcemap: false,
  splitting: false,
  skipNodeModulesBundle: true,
  noExternal: [/^@kapas\//, "zod"],
});

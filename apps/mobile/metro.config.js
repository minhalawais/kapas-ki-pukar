const fs = require("node:fs");
const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

/** @kapas/* workspace packages (Metro must resolve these when bundling package src). */
function kapasWorkspaceExtraNodeModules(root) {
  const packagesDir = path.join(root, "packages");
  const modules = {};
  if (!fs.existsSync(packagesDir)) return modules;
  for (const entry of fs.readdirSync(packagesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pkgRoot = path.join(packagesDir, entry.name);
    const pkgJsonPath = path.join(pkgRoot, "package.json");
    if (!fs.existsSync(pkgJsonPath)) continue;
    const { name } = require(pkgJsonPath);
    if (typeof name === "string" && name.startsWith("@kapas/")) {
      modules[name] = pkgRoot;
    }
  }
  return modules;
}

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.extraNodeModules = {
  ...kapasWorkspaceExtraNodeModules(workspaceRoot),
  "@react-native/js-polyfills": path.resolve(
    workspaceRoot,
    "node_modules/@react-native/js-polyfills",
  ),
};
if (!config.resolver.assetExts.includes("wasm")) config.resolver.assetExts.push("wasm");

module.exports = config;

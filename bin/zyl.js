#!/usr/bin/env node
import { spawn, spawnSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const [cmd, subcmd, name] = process.argv.slice(2);

function log(msg) {
  console.log(chalk.green("» " + msg));
}

/** ----------------- Watcher ----------------- */
function runWatcher() {
  const watcherPath = path.join(__dirname, "../lib/watcher/watch-routes.js");
  if (!fs.existsSync(watcherPath)) {
    console.error(chalk.red("❌ Watcher file not found inside package:", watcherPath));
    process.exit(1);
  }

  log("Starting watcher...");
  const watcher = spawn("node", [watcherPath], { stdio: "inherit" });
  watcher.on("close", (code) => {
    console.log(chalk.red(`Watcher stopped with code ${code}`));
  });
}

/** ----------------- Global zyl-next handling ----------------- */
function getGlobalZylNextPath() {
  try {
    const globalRoot = execSync("npm root -g", { encoding: "utf-8" }).trim();
    const globalPath = path.join(globalRoot, "zyl-next");
    if (fs.existsSync(globalPath)) return globalPath;
    return null;
  } catch {
    return null;
  }
}

function installZylNextInProject() {
  const projectRoot = process.cwd();
  const pm = fs.existsSync(path.join(projectRoot, "pnpm-lock.yaml")) ? "pnpm" : "npm";

  log(`⚡ Installing zyl-next in project using ${pm}...`);
  const res = spawnSync(pm, ["install", "zyl-next"], {
    cwd: projectRoot,
    stdio: "inherit",
  });

  if (res.status !== 0) {
    console.error(chalk.red("❌ Failed to install zyl-next in project."));
    process.exit(1);
  }
  log("✅ zyl-next installed successfully!");
}

/** ----------------- Server check ----------------- */
function isServerInitialized() {
  const projectRoot = process.cwd();
  const serverDir = path.join(projectRoot, "server");
  const modulesDir = path.join(serverDir, "modules");
  const zylNextPath = path.join(projectRoot, "node_modules", "zyl-next");

  if (!fs.existsSync(zylNextPath)) {
    log("⚠️ zyl-next not found in project node_modules...");

    const globalPath = getGlobalZylNextPath();
    if (globalPath) {
      log(`📦 Copying zyl-next from global modules: ${globalPath}`);
      fs.copySync(globalPath, zylNextPath);
      log("✅ zyl-next copied to project node_modules");
    } else {
      installZylNextInProject();
    }
  }

  return fs.existsSync(serverDir) && fs.existsSync(modulesDir);
}

/** ----------------- Server structure ----------------- */
async function createServerStructure() {
  const projectRoot = process.cwd();
  const name = "base";

  log("Creating server structure...");
  const dirs = [
    path.join(projectRoot, "server/lib"),
    path.join(projectRoot, "server/modules"),
  ];
  const TEMPLATES = path.resolve(__dirname, "../lib/templates");
  const libDir = path.join(projectRoot, "server/lib");

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirpSync(dir);
  });

  const render = (tpl) => tpl.replace(/__NAME__/g, "").replace(/__CNAME__/g, "");

  const guardFile = path.join(libDir, "guard.ts");
  if (!fs.existsSync(guardFile)) {
    const guardTpl = fs.readFileSync(path.join(TEMPLATES, "guard.ts.tpl"), "utf8");
    fs.writeFileSync(guardFile, render(guardTpl));
  }

  const baseCoreDir = path.join(projectRoot, `server/core/${name}`);
  const baseModuleDir = path.join(projectRoot, `server/modules/${name}`);
  if (!fs.existsSync(baseCoreDir)) generateCore(name, "boilerPlate");
  if (!fs.existsSync(baseModuleDir)) generateModule(name, "boilerPlate");

  log("✅ Server base structure ready!");
  addWatcherToPackageJson(projectRoot);
}

/** ----------------- Add watcher/dev scripts ----------------- */
function addWatcherToPackageJson(projectRoot) {
  const packageJsonPath = path.join(projectRoot, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    console.error(chalk.red("❌ package.json not found in project root"));
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  if (!pkg.scripts) pkg.scripts = {};
  pkg.scripts["watch"] = "zyl watch";
  pkg.scripts["dev"] = 'concurrently "zyl watch" "next dev"';

  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
  log("✅ Added watcher and dev scripts to package.json");
}

/** ----------------- Generate module ----------------- */
async function generateModule(name, type) {
  const projectRoot = process.cwd();
  const TEMPLATES = path.join(__dirname, "../lib/templates");

  const srcDir = path.join(projectRoot, `server/modules/${name}`);
  const dtoDir = path.join(srcDir, "Dto");
  const apiDir = path.join(projectRoot, `app/api/${name}`);

  if (fs.existsSync(apiDir) || fs.existsSync(srcDir) || fs.existsSync(dtoDir)) {
    console.error(chalk.red("❌ Module already exists."));
    process.exit(1);
  } else {
    fs.mkdirpSync(apiDir);
    fs.mkdirpSync(srcDir);
    fs.mkdirpSync(dtoDir);
  }

  const CName = name.charAt(0).toUpperCase() + name.slice(1);
  const render = (tpl) => tpl.replace(/__NAME__/g, name).replace(/__CNAME__/g, CName);

const files = [
  ["controller." + type + ".ts.tpl", path.join(srcDir, name + ".controller.ts")],
  ["service." + type + ".ts.tpl", path.join(srcDir, name + ".service.ts")],
  ["route." + type + ".ts.tpl", path.join(srcDir, name + ".route.ts")],
  ["module." + type + ".ts.tpl", path.join(srcDir, name + ".module.ts")],
  ["dto." + type + ".ts.tpl", path.join(dtoDir, name + ".dto.ts")],
  ["baseroute.ts.tpl", path.join(apiDir, "route.ts")],
];

  for (const [tplName, outFile] of files) {

    const targetPath = outFile.includes("/") ? outFile : path.join(srcDir, outFile);
    const tpl = fs.readFileSync(path.join(TEMPLATES, tplName), "utf8");
    fs.writeFileSync(targetPath, render(tpl));

  }

  log(`✅ Generated '${name}' module files`);
}

/** ----------------- Generate core ----------------- */
async function generateCore(name, type) {
  const projectRoot = process.cwd();
  const TEMPLATES = path.join(__dirname, "../lib/templates");
  const srcDir = path.join(projectRoot, `server/core/${name}`);

  if (fs.existsSync(srcDir)) {
    console.error(chalk.red("❌ Core already exists."));
    process.exit(1);
  } else {
    fs.mkdirpSync(srcDir);
  }

  const CName = name.charAt(0).toUpperCase() + name.slice(1);
  const render = (tpl) => tpl.replace(/__NAME__/g, name).replace(/__CNAME__/g, CName);

  fs.writeFileSync(path.join(srcDir, name + ".core.ts"), render(fs.readFileSync(path.join(TEMPLATES, "core." + type + ".ts.tpl"), "utf8")));
  log(`✅ Generated '${name}' core file`);
}

/** ----------------- CLI commands ----------------- */
if (cmd === "server" && subcmd === "init") {
  if (isServerInitialized()) {
    log("✅ Server has already been initialized!");
  } else {
    createServerStructure();
    log("✅ Server initialized successfully!");
  }
} else if ((cmd === "g" && subcmd === "module" && name) || (cmd === "g" && subcmd === "core" && name)) {
  if (!isServerInitialized()) {
    console.error(chalk.red("❌ Server is not initialized yet! Run `zyl server init` first."));
    process.exit(1);
  }

  if (cmd === "g" && subcmd === "module") generateModule(name, "new");
  else if (cmd === "g" && subcmd === "core") generateCore(name, "new");
} else if (cmd === "watch") {
  if (!isServerInitialized()) {
    console.error(chalk.red("❌ Server is not initialized yet! Cannot start watcher."));
    process.exit(1);
  }
  runWatcher();
} else {
  console.log(chalk.yellow("Usage:"));
  console.log("  zyl server init");
  console.log("  zyl g module <name>");
  console.log("  zyl g core <name>");
  console.log("  zyl watch");
}

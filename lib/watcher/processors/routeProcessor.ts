import fs from "fs";
import path from "path";
import ts from "typescript";
import { WATCHER_CONFIG } from "../config.js";
import { log } from "../../../functions/log.js";

/**
 * Processes a .route.ts file and mirrors it into the API directory.
 * Safely rebuilds routes whenever a module changes.
 */
export function processRouteFile(filePath: string) {
  if (!filePath.endsWith(".route.ts")) return;

  const moduleName = path.basename(path.dirname(filePath));

  try {
    const source = fs.readFileSync(filePath, "utf8");
    const sourceFile = ts.createSourceFile(
      filePath,
      source,
      ts.ScriptTarget.Latest,
      true
    );

    const routes: { exportName: string; route: string; method: string }[] = [];

    // --- Parse source for exported wrapHandler() calls ---
    ts.forEachChild(sourceFile, (node) => {
      if (!ts.isVariableStatement(node)) return;

      const isExported = node.modifiers?.some(
        (m) => m.kind === ts.SyntaxKind.ExportKeyword
      );
      if (!isExported) return;

      for (const decl of node.declarationList.declarations) {
        if (!decl.initializer || !ts.isCallExpression(decl.initializer))
          continue;

        const callExpr = decl.initializer;
        const exprName = callExpr.expression.getText(sourceFile);

        if (!exprName.endsWith("wrapHandler")) continue;

        const configArg = callExpr.arguments[1];
        if (!configArg || !ts.isObjectLiteralExpression(configArg)) continue;

        let route = "";
        let method = "";

        for (const prop of configArg.properties) {
          if (!ts.isPropertyAssignment(prop)) continue;
          const key = prop.name.getText(sourceFile);
          const val = prop.initializer
            .getText(sourceFile)
            .replace(/['"`]/g, "");
          if (key === "route") route = val;
          if (key === "method") method = val;
        }

        if (route && method) {
          routes.push({
            exportName: decl.name.getText(sourceFile),
            route,
            method,
          });
        }
      }
    });

    if (!routes.length) {
      log.info(`No routes found in: ${moduleName}`);
      return;
    }

    // --- Group routes by their API path (excluding method-specific segments) ---
    const routesByPath = new Map<string, typeof routes>();

    for (const route of routes) {
      // Normalize route: remove leading/trailing slashes and /api prefix
      const normalizedRoute = route.route
        .replace(/^\/?api\/?/, "")
        .replace(/^\/+|\/+$/g, "");

      // Convert to file system path: /students/:id → students/[id]
      const routePath = normalizedRoute
        .split("/")
        .filter(Boolean)
        .map((seg) => (seg.startsWith(":") ? `[${seg.slice(1)}]` : seg))
        .join("/");

      if (!routesByPath.has(routePath)) {
        routesByPath.set(routePath, []);
      }
      routesByPath.get(routePath)!.push(route);
    }

    // --- Clean old API output for this module ---
    const moduleApiDir = path.join(WATCHER_CONFIG.API_DIR, moduleName);
    if (fs.existsSync(moduleApiDir)) {
      fs.rmSync(moduleApiDir, { recursive: true, force: true });
      log.info(` ♻️  Cleaned old routes for module: ${moduleName}`);
    }

    // --- Rebuild new API files ---
    for (const [routePath, routeGroup] of routesByPath) {
      const apiDir = path.join(WATCHER_CONFIG.API_DIR, routePath);
      fs.mkdirSync(apiDir, { recursive: true });

      // Compute relative import path from API dir to module route file
      const moduleRoutePath = path.join(
        WATCHER_CONFIG.MODULES_DIR,
        moduleName,
        `${moduleName}.route`
      );

      const relPath = path.relative(apiDir, moduleRoutePath);
      const importPath = relPath.replace(/\\/g, "/");
      const safeImport = importPath.startsWith(".")
        ? importPath
        : `./${importPath}`;

      // Create single route.ts with all HTTP methods for this path
      const apiFile = path.join(apiDir, "route.ts");
      const exports = routeGroup
        .map(
          (r) =>
            `export { ${r.exportName} as ${r.method.toUpperCase()} } from "${safeImport}";`
        )
        .join("\n");

      fs.writeFileSync(apiFile, exports + "\n", "utf8");
      log.success(
        `✓ Created ${routePath}/route.ts with ${routeGroup.length} method(s)`
      );
    }

    log.success(
      `Processed ${routes.length} route(s) for module: ${moduleName}`
    );
  } catch (err) {
    log.error(
      `Failed to process ${filePath}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }
}
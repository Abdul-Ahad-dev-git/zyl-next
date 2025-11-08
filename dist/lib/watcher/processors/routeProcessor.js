import fs from "fs";
import path from "path";
import ts from "typescript";
import { WATCHER_CONFIG } from "../config.js";
import { log } from "../../../functions/log.js";
export function processRouteFile(filePath) {
    if (!filePath.endsWith(".route.ts"))
        return;
    const moduleName = path.basename(path.dirname(filePath));
    try {
        const source = fs.readFileSync(filePath, "utf8");
        const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
        const routes = [];
        ts.forEachChild(sourceFile, (node) => {
            if (ts.isVariableStatement(node)) {
                const decl = node.declarationList.declarations[0];
                if (decl?.initializer?.getText().includes("wrapHandler")) {
                    const text = decl.initializer.getText();
                    const routeMatch = text.match(/route:\s*["'`](.*?)["'`]/);
                    const methodMatch = text.match(/method:\s*["'`](.*?)["'`]/);
                    if (routeMatch && methodMatch) {
                        routes.push({
                            exportName: decl.name.getText(),
                            route: routeMatch[1],
                            method: methodMatch[1]
                        });
                    }
                }
            }
        });
        if (!routes.length)
            return;
        const moduleApiDir = path.join(WATCHER_CONFIG.API_DIR, moduleName);
        if (fs.existsSync(moduleApiDir))
            fs.rmSync(moduleApiDir, { recursive: true, force: true });
        routes.forEach((route) => {
            const routePath = route.route.replace(/^\/?api\/?/, "").split("/").map(seg => seg.startsWith(":") ? `[${seg.slice(1)}]` : seg);
            const apiDir = path.join(WATCHER_CONFIG.API_DIR, ...routePath);
            fs.mkdirSync(apiDir, { recursive: true });
            const importPath = path.relative(apiDir, path.join(WATCHER_CONFIG.MODULES_DIR, moduleName, `${moduleName}.route`)).replace(/\\/g, "/");
            const apiFile = path.join(apiDir, "route.ts");
            const content = `export { ${route.exportName} as ${route.method.toUpperCase()} } from "${importPath.startsWith(".") ? importPath : "./" + importPath}";\n`;
            fs.writeFileSync(apiFile, content, "utf8");
        });
        log.success(`Processed routes for module: ${moduleName}`);
    }
    catch (err) {
        log.error(err);
    }
}

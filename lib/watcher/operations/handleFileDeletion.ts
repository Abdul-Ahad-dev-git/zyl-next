import fs from "fs";
import path from "path";
import { WATCHER_CONFIG } from "../config.js";
import { log} from "../../../functions/log.js"
const modulesMap: Record<string, { routes: Set<string>; dtos: Set<string> }> = {};

export function handleFileDeletion(filePath: string) {
  const moduleName = path.basename(path.dirname(filePath));
  const generatedDir = path.join(WATCHER_CONFIG.API_DIR, moduleName);

  if (fs.existsSync(generatedDir)) {
    fs.rmSync(generatedDir, { recursive: true, force: true });
    log.warn(` Cleaned generated files for module: ${moduleName}`);
  }

  if (modulesMap[moduleName]) {
    modulesMap[moduleName].routes.delete(filePath);
    modulesMap[moduleName].dtos.delete(filePath);
  }
}

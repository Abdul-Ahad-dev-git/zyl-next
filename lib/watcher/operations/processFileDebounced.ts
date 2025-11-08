import debounce from "lodash/debounce.js";
import fs from "fs";
import path from "path";
import { processRouteFile } from "../processors/routeProcessor.js";
import { hasChanged } from "./hasChanged.js";
import { log} from "../../../functions/log.js"
const modulesMap: Record<string, { routes: Set<string>; dtos: Set<string> }> = {};

export const processFileDebounced = debounce((filePath: string) => {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    
    if (!hasChanged(filePath, content)) return;
     
    const moduleName = path.basename(path.dirname(filePath));
    if (!modulesMap[moduleName]) modulesMap[moduleName] = { routes: new Set(), dtos: new Set() };
     
    if (filePath.endsWith(".route.ts")) {
      processRouteFile(filePath);
      modulesMap[moduleName].routes.add(filePath);
    }
  } catch (err) {
    log.error(err);
  }
}, 100);

import chokidar from "chokidar";
import { WATCHER_CONFIG } from "./config.js";
import { processFileDebounced } from "./operations/processFileDebounced.js";
import { log} from "../../functions/log.js"
export function startWatcher() {
  if (!WATCHER_CONFIG.DEV_ONLY) return;

  log.info(`Watcher running in dev mode for modules in ${WATCHER_CONFIG.MODULES_DIR}`);

  const watcher = chokidar.watch(WATCHER_CONFIG.MODULES_DIR, {
    persistent: true,
    usePolling: true,
    interval: WATCHER_CONFIG.POLL_INTERVAL || 500
  });

  watcher
    .on("add", processFileDebounced)
    .on("change", processFileDebounced)
}

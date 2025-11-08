import path from "path";

export const WATCHER_CONFIG = {
  MODULES_DIR: path.resolve("server/modules"),
  
  API_DIR: path.resolve("app/api"),
  WATCH_EXTENSIONS: [".route.ts"],
  POLL_INTERVAL: 500,
  DEV_ONLY: process.env.NODE_ENV === "development"
};

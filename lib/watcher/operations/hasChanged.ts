import crypto from "crypto";

const fileHashes: Record<string, string> = {};

function computeHash(content: string) {
  return crypto.createHash("md5").update(content).digest("hex");
}

export function hasChanged(filePath: string, content: string) {
  const hash = computeHash(content);
  if (fileHashes[filePath] === hash) return false;
  fileHashes[filePath] = hash;
  return true;
}

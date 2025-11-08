import crypto from "crypto";
const fileHashes = {};
function computeHash(content) {
    return crypto.createHash("md5").update(content).digest("hex");
}
export function hasChanged(filePath, content) {
    const hash = computeHash(content);
    if (fileHashes[filePath] === hash)
        return false;
    fileHashes[filePath] = hash;
    return true;
}

function stamp() {
    return new Date().toISOString();
}
export function logInfo(message, meta = {}) {
    console.log(`[INFO] ${stamp()} ${message}`, meta);
}
export function logWarn(message, meta = {}) {
    console.warn(`[WARN] ${stamp()} ${message}`, meta);
}
export function logError(message, meta = {}) {
    console.error(`[ERROR] ${stamp()} ${message}`, meta);
}

function stamp() {
  return new Date().toISOString();
}

export function logInfo(message: string, meta: unknown = {}) {
  console.log(`[INFO] ${stamp()} ${message}`, meta);
}

export function logWarn(message: string, meta: unknown = {}) {
  console.warn(`[WARN] ${stamp()} ${message}`, meta);
}

export function logError(message: string, meta: unknown = {}) {
  console.error(`[ERROR] ${stamp()} ${message}`, meta);
}

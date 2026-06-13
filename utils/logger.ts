export const logger = {
  info: (msg: string, ...args: any[]) => __DEV__ && console.info(`[INFO] ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) => __DEV__ && console.warn(`[WARN] ${msg}`, ...args),
  error: (msg: string, ...args: any[]) => __DEV__ && console.error(`[ERROR] ${msg}`, ...args),
  debug: (msg: string, ...args: any[]) => __DEV__ && console.debug(`[DEBUG] ${msg}`, ...args),
};

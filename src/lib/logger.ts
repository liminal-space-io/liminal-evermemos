/** Stub logger — pino-compatible interface */
import type { Logger as PinoLogger } from 'pino'

interface LogFn {
  (obj: Record<string, unknown>, msg?: string): void
  (msg: string): void
}

interface Logger {
  info: LogFn
  warn: LogFn
  error: LogFn
  debug: LogFn
  child: (bindings: Record<string, unknown>) => Logger
}

// Re-export as pino-compatible for event handlers that import pino.Logger
export type { PinoLogger }

function createLogFn(): LogFn {
  return (() => {}) as unknown as LogFn
}

function createLogger(): Logger {
  const l: Logger = {
    info: createLogFn(),
    warn: createLogFn(),
    error: createLogFn(),
    debug: createLogFn(),
    child: () => l,
  }
  return l
}

export const logger = createLogger()

export function createModuleLogger(_module: string): Logger {
  return createLogger()
}

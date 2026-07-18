// utils/logger.ts
// Environment-aware logging utility. This is the single legitimate `console.*`
// site in vellum — audit-logging-errors (S11) blocks live console calls
// elsewhere and treats this file as the source of truth.

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext =
  | 'api'
  | 'auth'
  | 'data'
  | 'ui'
  | 'validation'
  | 'general'
  | 'mutations'
  | 'queries'
  | 'offlineQueue'
  | 'env'
  | 'debug'
  | 'error'
  | 'account'
  | 'repository';

declare global {
  // eslint-disable-next-line no-var
  var currentLogLevel: LogLevel | undefined;
}

const isDev =
  typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV === 'development';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const INITIAL_LOG_LEVEL: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) || (isDev ? 'debug' : 'warn');
if (typeof globalThis !== 'undefined' && globalThis.currentLogLevel === undefined) {
  globalThis.currentLogLevel = INITIAL_LOG_LEVEL;
}

function shouldLog(level: LogLevel): boolean {
  const effective: LogLevel =
    (typeof globalThis !== 'undefined' && globalThis.currentLogLevel) || INITIAL_LOG_LEVEL;
  return LOG_LEVELS[level] >= LOG_LEVELS[effective];
}

function formatMessage(context: LogContext, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${context.toUpperCase()}] ${message}`;
}

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function isTerminal(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.stdout &&
    typeof process.stdout.isTTY === 'boolean' &&
    process.stdout.isTTY
  );
}

function colorize(message: string, color: keyof typeof colors): string {
  if (!isDev || !isTerminal()) return message;
  return `${colors[color]}${message}${colors.reset}`;
}

export const logger = {
  debug: (context: LogContext, message: string, ...args: unknown[]) => {
    if (!shouldLog('debug')) return;
    const formatted = formatMessage(context, message);
    console.log(colorize(formatted, 'cyan'), ...args);
  },

  info: (context: LogContext, message: string, ...args: unknown[]) => {
    if (!shouldLog('info')) return;
    const formatted = formatMessage(context, message);
    console.info(colorize(formatted, 'blue'), ...args);
  },

  warn: (context: LogContext, message: string, ...args: unknown[]) => {
    if (!shouldLog('warn')) return;
    const formatted = formatMessage(context, message);
    console.warn(colorize(formatted, 'yellow'), ...args);
  },

  error: (
    context: LogContext,
    message: string,
    error?: Error | unknown,
    ...args: unknown[]
  ) => {
    if (!shouldLog('error')) return;
    const formatted = formatMessage(context, message);
    if (error instanceof Error) {
      console.error(colorize(formatted, 'red'), error.message, error.stack, ...args);
    } else {
      console.error(colorize(formatted, 'red'), error, ...args);
    }
  },

  api: {
    request: (endpoint: string, method: string, ...args: unknown[]) => {
      logger.debug('api', `${method} ${endpoint}`, ...args);
    },
    response: (endpoint: string, duration: number, ...args: unknown[]) => {
      logger.debug('api', `${endpoint} - ${duration}ms`, ...args);
    },
    error: (endpoint: string, error: Error | unknown, ...args: unknown[]) => {
      logger.error('api', `API Error: ${endpoint}`, error, ...args);
    },
  },

  auth: {
    login: (userId: string, ...args: unknown[]) => {
      logger.debug('auth', `User logged in: ${userId}`, ...args);
    },
    logout: (userId: string, ...args: unknown[]) => {
      logger.debug('auth', `User logged out: ${userId}`, ...args);
    },
    error: (action: string, error: Error | unknown, ...args: unknown[]) => {
      logger.error('auth', `Auth Error: ${action}`, error, ...args);
    },
  },

  data: {
    load: (source: string, count: number, ...args: unknown[]) => {
      logger.debug('data', `Loaded ${count} items from ${source}`, ...args);
    },
    save: (source: string, ...args: unknown[]) => {
      logger.debug('data', `Saved data to ${source}`, ...args);
    },
    error: (operation: string, error: Error | unknown, ...args: unknown[]) => {
      logger.error('data', `Data Error: ${operation}`, error, ...args);
    },
  },

  validation: {
    success: (field: string, ...args: unknown[]) => {
      logger.debug('validation', `Validation passed: ${field}`, ...args);
    },
    error: (field: string, reason: string, ...args: unknown[]) => {
      logger.warn('validation', `Validation failed: ${field} - ${reason}`, ...args);
    },
  },

  ui: {
    navigation: (from: string, to: string, ...args: unknown[]) => {
      logger.debug('ui', `Navigation: ${from} -> ${to}`, ...args);
    },
    action: (component: string, action: string, ...args: unknown[]) => {
      logger.debug('ui', `${component}: ${action}`, ...args);
    },
  },

  setLogLevel: (level: LogLevel) => {
    globalThis.currentLogLevel = level;
  },

  isDebugEnabled: () => shouldLog('debug'),

  isInfoEnabled: () => shouldLog('info'),
};

export default logger;

export type { LogLevel, LogContext };

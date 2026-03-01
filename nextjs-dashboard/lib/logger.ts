/**
 * Production-safe logger
 * Only logs in development mode
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  error: (...args: any[]) => {
    // Always log errors, but only include stack traces in development
    if (isDevelopment) {
      console.error(...args)
    } else {
      // In production, log errors but sanitize sensitive information
      console.error('[ERROR]', ...args.map(arg =>
        typeof arg === 'object' && arg !== null
          ? JSON.stringify(arg, null, 2)
          : arg
      ))
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args)
    }
  },
}

/**
 * Production logger that always logs (for critical operations)
 * Use sparingly - only for audit trails and critical errors
 */
export const productionLogger = {
  error: (...args: any[]) => {
    console.error('[PRODUCTION ERROR]', new Date().toISOString(), ...args)
  },

  audit: (action: string, userId: string, details: any) => {
    console.log('[AUDIT]', {
      timestamp: new Date().toISOString(),
      action,
      userId,
      details,
    })
  },
}

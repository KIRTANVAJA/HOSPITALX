const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'authorization',
  'jwt',
  'secret',
  'cookie',
  'session',
  'ssn',
  'creditcard',
  'apikey',
]);

function sanitize(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item));
  }

  const sanitizedObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitizedObj[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      sanitizedObj[key] = sanitize(value);
    } else {
      sanitizedObj[key] = value;
    }
  }
  return sanitizedObj;
}

export const logger = {
  info: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    if (meta) {
      console.log(`[${timestamp}] [INFO] ${message}`, JSON.stringify(sanitize(meta)));
    } else {
      console.log(`[${timestamp}] [INFO] ${message}`);
    }
  },
  warn: (message: string, meta?: any) => {
    const timestamp = new Date().toISOString();
    if (meta) {
      console.warn(`[${timestamp}] [WARN] ${message}`, JSON.stringify(sanitize(meta)));
    } else {
      console.warn(`[${timestamp}] [WARN] ${message}`);
    }
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    const safeError = error instanceof Error ? { message: error.message, stack: error.stack } : sanitize(error);
    console.error(`[${timestamp}] [ERROR] ${message}`, safeError ? JSON.stringify(safeError) : '');
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      if (meta) {
        console.debug(`[${timestamp}] [DEBUG] ${message}`, JSON.stringify(sanitize(meta)));
      } else {
        console.debug(`[${timestamp}] [DEBUG] ${message}`);
      }
    }
  },
};

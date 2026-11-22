import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  redact: {
    paths: [
      'password',
      'pass',
      'token',
      'authorization',
      'secret',
      'cookie',
      'apiKey',
      '*.password',
      '*.pass',
      '*.token',
      '*.authorization',
    ],
    censor: '[REDACTED]',
  },
  base: {
    env: process.env.NODE_ENV || 'development',
  },
})

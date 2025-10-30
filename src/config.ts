import * as dotenv from 'dotenv';
dotenv.config();

export const config = {
  baseUrl: process.env.BASE_URL || 'https://opusrec.vinci-autoroutes.com/GRC/Error/SiteCommercial#',
  headless: (process.env.HEADLESS || 'false').toLowerCase() === 'true',
  slowMo: Number(process.env.SLOWMO || 0),
  timeoutMs: Number(process.env.TIMEOUT || 30000),
  navigationTimeoutMs: Number(process.env.NAVIGATION_TIMEOUT || 60000),
  screenshots: {
    enabled: (process.env.SCREENSHOTS_ENABLED || 'false').toLowerCase() === 'true',
    path: process.env.SCREENSHOTS_PATH || 'screenshots',
    onFailure: (process.env.SCREENSHOTS_ON_FAILURE || 'true').toLowerCase() === 'true',
    onSuccess: (process.env.SCREENSHOTS_ON_SUCCESS || 'false').toLowerCase() === 'true'
  },
  retry: {
    maxAttempts: Number(process.env.RETRY_MAX_ATTEMPTS || 3),
    delayMs: Number(process.env.RETRY_DELAY_MS || 1000),
    backoffMultiplier: Number(process.env.RETRY_BACKOFF_MULTIPLIER || 2)
  },
  logging: {
    enabled: (process.env.LOGGING_ENABLED || 'true').toLowerCase() === 'true',
    level: process.env.LOG_LEVEL || 'INFO',
    directory: process.env.LOG_DIRECTORY || 'logs'
  },
  testData: {
    defaultSociete: process.env.DEFAULT_SOCIETE || 'TO DO',
    defaultFormule: process.env.DEFAULT_FORMULE || 'TO DO'
  },
  database: {
    path: process.env.DATABASE_PATH || 'Data/tnr.db'
  }
};



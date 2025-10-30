import * as dotenv from 'dotenv';
dotenv.config();

function isBooleanLike(value: string): boolean {
  const v = value.trim().toLowerCase();
  return ['true', '1', 'yes', 'on', 'false', '0', 'no', 'off'].includes(v);
}

function toBoolean(value: string): boolean {
  const v = value.trim().toLowerCase();
  return ['true', '1', 'yes', 'on'].includes(v);
}

function toNumber(value: string): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export type AppConfig = Readonly<{
  baseUrl: string;
  headless: boolean;
  slowMo: number;
  timeoutMs: number;
  navigationTimeoutMs: number;
  screenshots: Readonly<{
    enabled: boolean;
    path: string;
    onFailure: boolean;
    onSuccess: boolean;
  }>;
  retry: Readonly<{
    maxAttempts: number;
    delayMs: number;
    backoffMultiplier: number;
  }>;
  logging: Readonly<{
    enabled: boolean;
    level: string;
    directory: string;
  }>;
  database: Readonly<{
    path: string;
  }>;
}>;

const errors: string[] = [];

function requireEnv(name: string): string | undefined {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') {
    errors.push(`Missing ${name}`);
    return undefined;
  }
  return value;
}

function requireBoolean(name: string): boolean | undefined {
  const raw = requireEnv(name);
  if (raw === undefined) return undefined;
  if (!isBooleanLike(raw)) {
    errors.push(`Invalid ${name}: expected boolean-like (true/false)`);
    return undefined;
  }
  return toBoolean(raw);
}

function requireNumber(name: string): number | undefined {
  const raw = requireEnv(name);
  if (raw === undefined) return undefined;
  const n = toNumber(raw);
  if (n === null) {
    errors.push(`Invalid ${name}: expected finite number`);
    return undefined;
  }
  return n;
}

const baseUrl = requireEnv('BASE_URL')?.trim();
const headless = requireBoolean('HEADLESS');
const slowMo = requireNumber('SLOWMO');
const timeoutMs = requireNumber('TIMEOUT');
const navigationTimeoutMs = requireNumber('NAVIGATION_TIMEOUT');

const screenshotsEnabled = requireBoolean('SCREENSHOTS_ENABLED');
const screenshotsPath = requireEnv('SCREENSHOTS_PATH');
const screenshotsOnFailure = requireBoolean('SCREENSHOTS_ON_FAILURE');
const screenshotsOnSuccess = requireBoolean('SCREENSHOTS_ON_SUCCESS');

const retryMaxAttempts = requireNumber('RETRY_MAX_ATTEMPTS');
const retryDelayMs = requireNumber('RETRY_DELAY_MS');
const retryBackoffMultiplier = requireNumber('RETRY_BACKOFF_MULTIPLIER');

const loggingEnabled = requireBoolean('LOGGING_ENABLED');
const logLevel = requireEnv('LOG_LEVEL');
const logDirectory = requireEnv('LOG_DIRECTORY');

const databasePath = requireEnv('DATABASE_PATH');

if (errors.length > 0) {
  const message = ['Configuration error:', ...errors.map(e => ` - ${e}`)].join('\n');
  throw new Error(message);
}

export const config: AppConfig = Object.freeze({
  baseUrl: baseUrl!,
  headless: headless!,
  slowMo: slowMo!,
  timeoutMs: timeoutMs!,
  navigationTimeoutMs: navigationTimeoutMs!,
  screenshots: Object.freeze({
    enabled: screenshotsEnabled!,
    path: screenshotsPath!,
    onFailure: screenshotsOnFailure!,
    onSuccess: screenshotsOnSuccess!
  }),
  retry: Object.freeze({
    maxAttempts: retryMaxAttempts!,
    delayMs: retryDelayMs!,
    backoffMultiplier: retryBackoffMultiplier!
  }),
  logging: Object.freeze({
    enabled: loggingEnabled!,
    level: logLevel!,
    directory: logDirectory!
  }),
  database: Object.freeze({
    path: databasePath!
  })
});



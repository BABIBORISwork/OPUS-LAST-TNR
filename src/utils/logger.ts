import { config } from '../config';
import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private logFile?: string;

  private constructor() {
    this.logLevel = LogLevel.INFO;
    this.initializeLogFile();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private initializeLogFile(): void {
    if (config.logging?.enabled) {
      const logDir = config.logging.directory || 'logs';
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      this.logFile = path.join(logDir, `test-${timestamp}.log`);
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: any): string {
    const timestamp = new Date().toISOString();
    const levelStr = LogLevel[level];
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${levelStr}] ${message}${contextStr}`;
  }

  private writeLog(level: LogLevel, message: string, context?: any): void {
    if (level < this.logLevel) return;

    const formattedMessage = this.formatMessage(level, message, context);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }

    if (this.logFile) {
      try {
        fs.appendFileSync(this.logFile, formattedMessage + '\n');
      } catch (error) {
        console.error('Erreur lors de l\'écriture du log:', error);
      }
    }
  }

  public debug(message: string, context?: any): void {
    this.writeLog(LogLevel.DEBUG, message, context);
  }

  public info(message: string, context?: any): void {
    this.writeLog(LogLevel.INFO, message, context);
  }

  public warn(message: string, context?: any): void {
    this.writeLog(LogLevel.WARN, message, context);
  }

  public error(message: string, context?: any): void {
    this.writeLog(LogLevel.ERROR, message, context);
  }

  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public logTestStart(testName: string, context?: any): void {
    this.info(`🚀 Début du test: ${testName}`, context);
  }

  public logTestSuccess(testName: string, duration: number, context?: any): void {
    this.info(`✅ Test réussi: ${testName} (${duration}ms)`, context);
  }

  public logTestFailure(testName: string, error: string, duration: number, context?: any): void {
    this.error(`❌ Test échoué: ${testName} (${duration}ms) - ${error}`, context);
  }

  public logRetry(operation: string, attempt: number, maxAttempts: number, error?: string): void {
    this.warn(`🔄 Retry ${attempt}/${maxAttempts} pour: ${operation}${error ? ` - ${error}` : ''}`);
  }

  public logScreenshot(path: string): void {
    this.info(`📸 Screenshot sauvegardé: ${path}`);
  }
}

export const logger = Logger.getInstance();

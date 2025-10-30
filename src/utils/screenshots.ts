import { Page } from '@playwright/test';
import { config } from '../config';
import { logger } from './logger';
import * as fs from 'fs';
import * as path from 'path';

export class ScreenshotManager {
  private static ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.debug(`Répertoire de screenshots créé: ${dirPath}`);
    }
  }

  public static async takeScreenshot(
    page: Page, 
    testName: string, 
    type: 'success' | 'failure' | 'info' = 'info'
  ): Promise<string | null> {
    if (!config.screenshots.enabled) {
      return null;
    }

    // Vérifier si on doit prendre un screenshot selon le type
    if (type === 'success' && !config.screenshots.onSuccess) {
      return null;
    }
    if (type === 'failure' && !config.screenshots.onFailure) {
      return null;
    }

    try {
      const screenshotDir = config.screenshots.path;
      this.ensureDirectoryExists(screenshotDir);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${testName}_${type}_${timestamp}.png`;
      const fullPath = path.join(screenshotDir, fileName);

      await page.screenshot({
        path: fullPath,
        fullPage: true
      });

      logger.logScreenshot(fullPath);
      return fullPath;
    } catch (error) {
      logger.error('Erreur lors de la prise de screenshot', { 
        error: error.message, 
        testName, 
        type 
      });
      return null;
    }
  }

  public static async takeScreenshotOnFailure(
    page: Page, 
    testName: string
  ): Promise<string | null> {
    return this.takeScreenshot(page, testName, 'failure');
  }

  public static async takeScreenshotOnSuccess(
    page: Page, 
    testName: string
  ): Promise<string | null> {
    return this.takeScreenshot(page, testName, 'success');
  }

  public static async takeScreenshotInfo(
    page: Page, 
    testName: string
  ): Promise<string | null> {
    return this.takeScreenshot(page, testName, 'info');
  }

  public static cleanupOldScreenshots(maxAgeDays: number = 7): void {
    if (!config.screenshots.enabled) return;

    try {
      const screenshotDir = config.screenshots.path;
      if (!fs.existsSync(screenshotDir)) return;

      const files = fs.readdirSync(screenshotDir);
      const now = Date.now();
      const maxAge = maxAgeDays * 24 * 60 * 60 * 1000; // Convertir en millisecondes

      let deletedCount = 0;
      for (const file of files) {
        const filePath = path.join(screenshotDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      if (deletedCount > 0) {
        logger.info(`Nettoyage des screenshots: ${deletedCount} fichiers supprimés`);
      }
    } catch (error) {
      logger.error('Erreur lors du nettoyage des screenshots', { error: error.message });
    }
  }
}

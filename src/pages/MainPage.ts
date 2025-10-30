import { Page, expect } from '@playwright/test';
import { config } from '../config';

export class MainPage {
  constructor(private readonly page: Page) {}

  async naviguerVersOpus(): Promise<void> {
    const base = new URL(config.baseUrl);
    const baseUrl = `${base.origin}${base.pathname}`.replace(/#$/, '');
    await this.page.goto(baseUrl);
    await this.page.getByRole('link', { name: 'Site' }).click();
    await this.page.getByRole('link', { name: 'Emetteur VINCI Autoroutes' }).click();
  }
}



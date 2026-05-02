import { Page } from '@playwright/test';

export class AppPage {
  constructor(public readonly page: Page) {}

  goto = (path: string = '/today') => this.page.goto(path);
  toast = () => this.page.getByTestId('app-toast');
  healthBanner = () => this.page.getByTestId('health-banner');
}

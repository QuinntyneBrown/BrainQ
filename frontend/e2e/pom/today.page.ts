import { Page } from '@playwright/test';

export class TodayPage {
  constructor(private page: Page) {}

  goto = () => this.page.goto('/today');
  greeting = () => this.page.getByTestId('today-greeting');
  capturePrompt = () => this.page.getByTestId('today-capture-prompt');
  commitments = () =>
    this.page.getByTestId('today-commitments').locator('[data-testid^="commitment-cell-"]');
  nudges = () => this.page.getByTestId('today-nudges').locator('[data-testid^="nudge-"]');
  recentlyTouched = () =>
    this.page.getByTestId('today-recent').locator('[data-testid^="brain-row-"]');
  toggleCommitment = (id: string) => this.page.getByTestId(`commitment-cell-${id}-toggle`).click();
  streakOf = (id: string) => this.page.getByTestId(`commitment-cell-${id}-streak`);
}

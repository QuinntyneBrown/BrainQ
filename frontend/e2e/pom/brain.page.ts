import { Page } from '@playwright/test';

type BrainChip = 'All' | 'Person' | 'Project' | 'Commitment' | 'Note' | 'Idea';

export class BrainPage {
  constructor(private page: Page) {}

  goto = () => this.page.goto('/brain');
  search = () => this.page.getByTestId('brain-search');
  chip = (id: BrainChip) => this.page.getByTestId(`brain-chip-${id}`);
  rows = () => this.page.getByTestId('brain-row');
  recallq = {
    band: () => this.page.getByTestId('recallq-band'),
    overdue: () =>
      this.page.getByTestId('recallq-overdue').locator('[data-testid^="recallq-overdue-row-"]'),
    statOrbit: () => this.page.getByTestId('recallq-stat-orbit'),
    statOverdue: () => this.page.getByTestId('recallq-stat-overdue'),
    statClose: () => this.page.getByTestId('recallq-stat-close'),
  };
}

import { Page } from '@playwright/test';

type Mode = 'structured' | 'semantic';

export class SearchPage {
  constructor(private page: Page) {}

  goto = () => this.page.goto('/search');
  input = () => this.page.getByTestId('search-input');
  modeChip = (m: Mode) => this.page.getByTestId(`search-mode-${m}`);
  results = () =>
    this.page.getByTestId('search-results').locator('[data-testid^="brain-row-"]');
  suggestion = (i: number) => this.page.getByTestId(`search-suggestion-${i}`);
  resultsLabel = () => this.page.getByTestId('search-results-label');
}

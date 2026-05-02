import { Page } from '@playwright/test';

type Type = 'auto' | 'Note' | 'Idea' | 'Person' | 'Project' | 'Commitment';

export class CaptureSheetPage {
  constructor(private page: Page) {}

  open = () =>
    this.page
      .getByTestId('capture-button-mobile')
      .or(this.page.getByTestId('capture-button-rail'))
      .first()
      .click();
  textarea = () => this.page.getByTestId('capture-textarea');
  detected = () => this.page.getByTestId('capture-detected-type');
  chip = (t: Type) => this.page.getByTestId(`capture-chip-${t}`);
  suggested = () =>
    this.page.getByTestId('capture-suggested').locator('[data-testid^="capture-suggestion-"]');
  save = () => this.page.getByTestId('capture-save');
  cancel = () => this.page.getByTestId('capture-cancel');
}

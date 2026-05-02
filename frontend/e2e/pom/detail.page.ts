import { Page } from '@playwright/test';

export class DetailPage {
  constructor(private page: Page) {}

  open = (id: string) => this.page.getByTestId(`brain-row-${id}`).click();
  back = () => this.page.getByTestId('detail-back').click();
  title = () => this.page.getByTestId('detail-title');
  connections = () =>
    this.page.getByTestId('detail-connections').locator('[data-testid^="edge-chip-"]');
  mentionedBy = () =>
    this.page.getByTestId('detail-mentioned-by').locator('[data-testid^="brain-row-"]');
  more = () => this.page.getByTestId('detail-more').click();
  delete = () => this.page.getByTestId('detail-delete').click();
  graphNode = (id: string) => this.page.getByTestId(`graph-node-${id}`);
  neighbor = (id: string) => this.page.getByTestId(`neighbor-row-${id}`);
}

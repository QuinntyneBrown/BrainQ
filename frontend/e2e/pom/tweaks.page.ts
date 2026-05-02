import { Page } from '@playwright/test';

type Theme = 'light' | 'sepia' | 'dark';
type Accent = 'terracotta' | 'ink' | 'moss' | 'ochre' | 'rose';
type Density = 'cozy' | 'compact';

export class TweaksPage {
  constructor(private page: Page) {}

  toggle = () => this.page.getByTestId('tweaks-toggle').click();
  theme = (t: Theme) => this.page.getByTestId(`tweaks-theme-${t}`);
  accent = (a: Accent) => this.page.getByTestId(`tweaks-accent-${a}`);
  density = (d: Density) => this.page.getByTestId(`tweaks-density-${d}`);
  rootData = () =>
    this.page.evaluate(() => ({
      theme: document.documentElement.dataset['theme'],
      density: document.documentElement.dataset['density'],
      accent: getComputedStyle(document.documentElement).getPropertyValue('--bq-accent').trim(),
    }));
}

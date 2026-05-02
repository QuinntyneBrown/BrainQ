import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { BqAccent, BqDensity, BqTheme, BQ_TWEAKS } from 'domain';
import { BqIcon } from '../icon/icon';
import { BqIconButton } from '../icon-button/icon-button';

@Component({
  selector: 'bq-tweaks-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BqIcon, BqIconButton],
  templateUrl: './tweaks-panel.html',
  styleUrl: './tweaks-panel.scss',
})
export class BqTweaksPanel {
  private readonly tweaks = inject(BQ_TWEAKS);

  readonly themes: BqTheme[] = ['light', 'sepia', 'dark'];
  readonly accents: BqAccent[] = ['terracotta', 'ink', 'moss', 'ochre', 'rose'];
  readonly densities: BqDensity[] = ['cozy', 'compact'];

  readonly theme = this.tweaks.theme;
  readonly accent = this.tweaks.accent;
  readonly density = this.tweaks.density;
  readonly open = signal(false);

  toggle(): void {
    this.open.update((v) => !v);
  }

  setTheme(t: BqTheme): void {
    this.tweaks.setTheme(t);
  }

  setAccent(a: BqAccent): void {
    this.tweaks.setAccent(a);
  }

  setDensity(d: BqDensity): void {
    this.tweaks.setDensity(d);
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
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
  private readonly wrap = viewChild<ElementRef<HTMLElement>>('wrap');

  constructor() {
    effect((onCleanup) => {
      if (!this.open()) return;
      const el = this.wrap()?.nativeElement;
      const onPointerDown = (e: PointerEvent) => {
        if (el && !el.contains(e.target as Node)) this.open.set(false);
      };
      document.addEventListener('pointerdown', onPointerDown);
      onCleanup(() => document.removeEventListener('pointerdown', onPointerDown));
    });
  }

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

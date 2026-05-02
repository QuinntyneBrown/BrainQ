import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { BqIcon, BqIconName } from '../icon/icon';

export interface BqTabItem {
  id: string;
  icon: BqIconName;
  label: string;
  /** When true, render as a primary capture/action button (filled disc). */
  capture?: boolean;
}

@Component({
  selector: 'bq-tab-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BqIcon],
  templateUrl: './tab-bar.html',
  styleUrl: './tab-bar.scss',
})
export class BqTabBar {
  readonly items = input.required<BqTabItem[]>();
  readonly active = model<string | null>(null);
  readonly capture = output<void>();

  select(id: string) {
    this.active.set(id);
  }
}

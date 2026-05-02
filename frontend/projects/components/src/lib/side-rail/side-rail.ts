import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';
import { BqIcon, BqIconName } from '../icon/icon';

export interface BqRailItem {
  id: string;
  icon: BqIconName;
  label: string;
}

@Component({
  selector: 'bq-side-rail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BqIcon],
  templateUrl: './side-rail.html',
  styleUrl: './side-rail.scss',
})
export class BqSideRail {
  readonly brandMark = input<string>('BQ');
  readonly brandName = input<string>('BrainQ');
  readonly captureLabel = input<string>('Capture');
  readonly captureKbd = input<string>('N');
  readonly items = input.required<BqRailItem[]>();
  readonly active = model<string | null>(null);
  readonly capture = output<void>();

  select(id: string) {
    this.active.set(id);
  }
}

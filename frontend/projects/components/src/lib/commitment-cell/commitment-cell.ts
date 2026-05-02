import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BqIcon } from '../icon/icon';
import { BqRing } from '../ring/ring';

@Component({
  selector: 'bq-commitment-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BqIcon, BqRing],
  templateUrl: './commitment-cell.html',
  styleUrl: './commitment-cell.scss',
})
export class BqCommitmentCell {
  readonly title = input.required<string>();
  readonly streak = input<number>(0);
  readonly cadence = input<string>('');
  readonly value = input<number>(0.32);
  readonly done = input<boolean>(false);
  readonly open = output<void>();
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface BqStat {
  value: string | number;
  label: string;
}

@Component({
  selector: 'bq-stat-band',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stat-band.html',
  styleUrl: './stat-band.scss',
})
export class BqStatBand {
  readonly stats = input.required<BqStat[]>();
}

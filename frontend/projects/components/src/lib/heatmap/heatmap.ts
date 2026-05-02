import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BqHeatLevel = 0 | 1 | 2 | 3 | 4;

@Component({
  selector: 'bq-heatmap',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './heatmap.html',
  styleUrl: './heatmap.scss',
})
export class BqHeatmap {
  readonly data = input.required<BqHeatLevel[][]>();
}

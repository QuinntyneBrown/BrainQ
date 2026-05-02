import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { BqTypeGlyph, BqEntityType } from '../type-glyph/type-glyph';

@Component({
  selector: 'bq-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BqTypeGlyph],
  templateUrl: './chip.html',
  styleUrl: './chip.scss',
})
export class BqChip {
  readonly active = input<boolean>(false);
  readonly glyph = input<BqEntityType | null>(null);
  readonly count = input<number | null>(null);
}

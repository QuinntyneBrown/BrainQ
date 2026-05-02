import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BqTypeGlyph, BqEntityType } from '../type-glyph/type-glyph';

@Component({
  selector: 'bq-nudge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BqTypeGlyph],
  templateUrl: './nudge.html',
  styleUrl: './nudge.scss',
})
export class BqNudge {
  readonly text = input.required<string>();
  readonly entityType = input<BqEntityType | null>(null);
  readonly entityTitle = input<string>('');
  readonly open = output<void>();
}

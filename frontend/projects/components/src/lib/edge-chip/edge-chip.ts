import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BqTypeGlyph, BqEntityType } from '../type-glyph/type-glyph';

export type BqEdgeKind = 'mentions' | 'blocks' | 'fulfills' | 'relatesTo';

export const BQ_EDGE_LABEL: Record<BqEdgeKind, string> = {
  mentions: 'mentions',
  blocks: 'blocks',
  fulfills: 'fulfills',
  relatesTo: 'relates to',
};

@Component({
  selector: 'bq-edge-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BqTypeGlyph],
  templateUrl: './edge-chip.html',
  styleUrl: './edge-chip.scss',
})
export class BqEdgeChip {
  readonly kind = input<BqEdgeKind | null>(null);
  readonly targetType = input.required<BqEntityType>();
  readonly targetTitle = input.required<string>();
  readonly isStatic = input<boolean>(false);
  readonly open = output<void>();

  kindLabel(k: BqEdgeKind): string {
    return BQ_EDGE_LABEL[k];
  }
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BqEntityType = 'Person' | 'Project' | 'Commitment' | 'Note' | 'Idea';

export const BQ_TYPE_LABEL: Record<BqEntityType, string> = {
  Person: 'person',
  Project: 'project',
  Commitment: 'commitment',
  Note: 'note',
  Idea: 'idea',
};

@Component({
  selector: 'bq-type-glyph',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './type-glyph.html',
  styleUrl: './type-glyph.scss',
})
export class BqTypeGlyph {
  readonly type = input.required<BqEntityType>();
  readonly size = input<number>(14);
}

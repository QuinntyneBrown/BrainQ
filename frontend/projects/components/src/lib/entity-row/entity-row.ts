import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BqIcon } from '../icon/icon';
import { BqTypeGlyph, BqEntityType, BQ_TYPE_LABEL } from '../type-glyph/type-glyph';

@Component({
  selector: 'bq-entity-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BqIcon, BqTypeGlyph],
  templateUrl: './entity-row.html',
  styleUrl: './entity-row.scss',
})
export class BqEntityRow {
  readonly type = input.required<BqEntityType>();
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly dense = input<boolean>(false);
  readonly open = output<void>();

  readonly typeLabel = () => BQ_TYPE_LABEL[this.type()];
}

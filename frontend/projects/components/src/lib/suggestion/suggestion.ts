import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { BqIcon } from '../icon/icon';

@Component({
  selector: 'bq-suggestion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BqIcon],
  templateUrl: './suggestion.html',
  styleUrl: './suggestion.scss',
})
export class BqSuggestion {
  readonly select = output<void>();
}

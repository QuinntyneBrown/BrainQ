import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'bq-ctx-pane',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ctx-pane.html',
  styleUrl: './ctx-pane.scss',
})
export class BqCtxPane {
  readonly ariaLabel = input<string>('Context');
}

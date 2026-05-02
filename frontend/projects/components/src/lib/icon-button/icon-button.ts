import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'bq-icon-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon-button.html',
  styleUrl: './icon-button.scss',
})
export class BqIconButton {
  readonly ariaLabel = input<string>('');
}

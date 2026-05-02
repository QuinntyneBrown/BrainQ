import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BqButtonVariant = 'primary' | 'ghost';

@Component({
  selector: 'bq-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class BqButton {
  readonly variant = input<BqButtonVariant>('primary');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input<boolean>(false);
}

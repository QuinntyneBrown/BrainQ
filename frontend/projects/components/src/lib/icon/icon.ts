import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BqIconName =
  | 'today'
  | 'capture'
  | 'brain'
  | 'search'
  | 'back'
  | 'close'
  | 'check'
  | 'arrow'
  | 'dot'
  | 'spark'
  | 'link'
  | 'filter'
  | 'more'
  | 'settings';

@Component({
  selector: 'bq-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
})
export class BqIcon {
  readonly name = input.required<BqIconName>();
  readonly size = input<number>(20);
  readonly stroke = input<number>(1.4);
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'bq-meta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './meta.html',
  styleUrl: './meta.scss',
  host: {
    '[class.bq-meta-dim]': 'dim()',
  },
})
export class BqMeta {
  readonly dim = input<boolean>(false);
}

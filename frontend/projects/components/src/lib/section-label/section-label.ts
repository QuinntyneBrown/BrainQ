import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'bq-section-label',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './section-label.html',
  styleUrl: './section-label.scss',
})
export class BqSectionLabel {
  readonly count = input<number | null>(null);
}

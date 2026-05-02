import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'bq-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sheet.html',
  styleUrl: './sheet.scss',
})
export class BqSheet {
  readonly open = input<boolean>(false);
  readonly close = output<void>();

  closeSheet() {
    this.close.emit();
  }
}

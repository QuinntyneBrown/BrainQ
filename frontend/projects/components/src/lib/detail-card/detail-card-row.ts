import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'bq-detail-card-row',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detail-card-row.html',
  styleUrl: './detail-card-row.scss',
})
export class BqDetailCardRow {}

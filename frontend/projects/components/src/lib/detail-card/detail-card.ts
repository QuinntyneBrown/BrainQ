import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'bq-detail-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './detail-card.html',
  styleUrl: './detail-card.scss',
})
export class BqDetailCard {}

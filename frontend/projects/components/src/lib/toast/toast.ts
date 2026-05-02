import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BqIcon } from '../icon/icon';

@Component({
  selector: 'bq-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BqIcon],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class BqToast {}

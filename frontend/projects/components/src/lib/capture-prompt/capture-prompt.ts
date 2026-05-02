import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { BqIcon } from '../icon/icon';

@Component({
  selector: 'bq-capture-prompt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BqIcon],
  templateUrl: './capture-prompt.html',
  styleUrl: './capture-prompt.scss',
})
export class BqCapturePrompt {
  readonly text = input<string>('What’s on your mind?');
  readonly hint = input<string>('tap to capture');
  readonly capture = output<void>();
}

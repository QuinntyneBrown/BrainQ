import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'bq-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.scss',
})
export class BqProgressBar {
  readonly value = input<number>(0);
  readonly percent = computed(() =>
    Math.round(Math.max(0, Math.min(1, this.value())) * 100),
  );
}

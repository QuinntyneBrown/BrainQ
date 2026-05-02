import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type BqNameInitSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'bq-name-init',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './name-init.html',
  styleUrl: './name-init.scss',
})
export class BqNameInit {
  readonly name = input.required<string>();
  readonly size = input<BqNameInitSize>('md');

  readonly initials = computed(() =>
    this.name()
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );
}

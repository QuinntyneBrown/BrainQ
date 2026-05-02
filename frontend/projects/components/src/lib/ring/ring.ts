import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'bq-ring',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ring.html',
  styleUrl: './ring.scss',
})
export class BqRing {
  readonly value = input<number>(0);
  readonly size = input<number>(36);
  readonly stroke = input<number>(2.4);
  readonly accented = input<boolean>(false);

  readonly radius = computed(() => (this.size() - this.stroke()) / 2);
  readonly circumference = computed(() => 2 * Math.PI * this.radius());
  readonly offset = computed(() => {
    const v = Math.max(0, Math.min(1, this.value()));
    return this.circumference() * (1 - v);
  });
}

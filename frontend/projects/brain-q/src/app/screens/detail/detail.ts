import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  BqDetailCard,
  BqDetailCardRow,
  BqEdgeChip,
  BqHeatmap,
  BqIcon,
  BqIconButton,
  BqNameInit,
  BqProgressBar,
  BqSectionLabel,
  BqTypeGlyph,
  BQ_EDGE_LABEL,
  BQ_TYPE_LABEL,
} from 'components';
import { BqEntity, BRAIN_Q_DATA } from 'domain';

@Component({
  selector: 'app-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BqDetailCard,
    BqDetailCardRow,
    BqEdgeChip,
    BqHeatmap,
    BqIcon,
    BqIconButton,
    BqNameInit,
    BqProgressBar,
    BqSectionLabel,
    BqTypeGlyph,
  ],
  templateUrl: './detail.html',
  styleUrl: './detail.scss',
})
export class DetailScreen {
  readonly id = input.required<string>();
  readonly back = output<void>();
  readonly open = output<string>();

  private readonly data = inject(BRAIN_Q_DATA);

  readonly entity = computed<BqEntity | undefined>(() => this.data.byId(this.id()));
  readonly inbound = computed(() =>
    this.data
      .inboundFor(this.id())
      .map((inb) => ({ inb, src: this.data.byId(inb.from) }))
      .filter((x): x is { inb: (typeof x)['inb']; src: BqEntity } => !!x.src),
  );
  readonly heatmap = computed(() => this.data.heatmapFor(this.id()));
  readonly typeLabel = BQ_TYPE_LABEL;
  readonly edgeLabel = BQ_EDGE_LABEL;
  readonly menuOpen = signal(false);

  progressPercent(p: number | undefined): number {
    return Math.round((p ?? 0) * 100);
  }

  edgeTarget(toId: string): BqEntity | undefined {
    return this.data.byId(toId);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  delete(): void {
    this.menuOpen.set(false);
    this.data.removeEntity(this.id());
    this.back.emit();
  }
}

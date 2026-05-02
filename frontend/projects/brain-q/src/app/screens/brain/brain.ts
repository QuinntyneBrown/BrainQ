import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import {
  BqChip,
  BqEntityRow,
  BqEntityType,
  BqIcon,
  BqNameInit,
  BqSearchBar,
  BqSectionLabel,
  BqStat,
  BqStatBand,
  BQ_TYPE_LABEL,
} from 'components';
import { BqEntity, BRAIN_Q_DATA } from 'domain';
import { AppShellState } from '../../app-shell-state';

type Filter = BqEntityType | 'All';

const TYPES: BqEntityType[] = ['Person', 'Project', 'Commitment', 'Note', 'Idea'];

@Component({
  selector: 'app-brain',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BqChip,
    BqEntityRow,
    BqIcon,
    BqNameInit,
    BqSearchBar,
    BqSectionLabel,
    BqStatBand,
  ],
  templateUrl: './brain.html',
  styleUrl: './brain.scss',
})
export class BrainScreen {
  readonly open = output<string>();

  private readonly data = inject(BRAIN_Q_DATA);
  private readonly shell = inject(AppShellState);

  readonly types = TYPES;
  readonly typeLabel = BQ_TYPE_LABEL;

  readonly filter = signal<Filter>('Person');
  readonly query = signal<string>('');

  readonly counts = computed(() => {
    const entities = this.data.entities();
    const c: Record<string, number> = { All: entities.length };
    for (const t of TYPES) {
      c[t] = entities.filter((e) => e.type === t).length;
    }
    return c;
  });

  readonly list = computed<readonly BqEntity[]>(() => {
    const entities = this.data.entities();
    const f = this.filter();
    let xs: readonly BqEntity[] =
      f === 'All' ? entities : entities.filter((e) => e.type === f);
    const q = this.query().trim().toLowerCase();
    if (q) {
      xs = xs.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.body || '').toLowerCase().includes(q) ||
          (e.tags || []).some((t) => t.includes(q)),
      );
    }
    return xs;
  });

  readonly heading = computed(() => {
    const f = this.filter();
    if (f === 'Person') return 'People you know';
    if (f === 'All') return 'Everything';
    return BQ_TYPE_LABEL[f] + 's';
  });

  readonly placeholder = computed(() =>
    this.filter() === 'Person' ? 'Search by name, tag, last seen…' : 'Filter…',
  );

  readonly sortLabel = computed(() =>
    this.filter() === 'All' ? 'All entities' : 'Sorted by recency',
  );

  readonly overdue = computed(() => this.list().filter((p) => p.tags.includes('overdue')));
  readonly close = computed(() =>
    this.list().filter((p) => p.tags.includes('close') || p.tags.includes('family')),
  );

  readonly recallqStats = computed<BqStat[]>(() => [
    { value: this.list().length, label: 'people in orbit' },
    { value: this.overdue().length, label: 'overdue to reach out' },
    { value: this.close().length, label: 'close circle' },
  ]);

  setFilter(f: Filter) {
    this.filter.set(f);
  }

  countOf(key: Filter): number {
    return this.counts()[key] ?? 0;
  }

  requestOpen(id: string) {
    this.open.emit(id);
    this.shell.openEntity(id);
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  output,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { BqChip, BqEntityRow, BqSearchBar, BqSectionLabel, BqSuggestion } from 'components';
import { BqEntity, BqSearchMode, BRAIN_Q_DATA } from 'domain';
import { AppShellState } from '../../app-shell-state';

const SUGGESTIONS = [
  'people I haven’t seen since February',
  'ideas about writing',
  'what Iris said about seams',
  'commitments I missed this week',
];

@Component({
  selector: 'app-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BqChip, BqEntityRow, BqSearchBar, BqSectionLabel, BqSuggestion],
  templateUrl: './search.html',
  styleUrl: './search.scss',
})
export class SearchScreen {
  readonly open = output<string>();

  private readonly data = inject(BRAIN_Q_DATA);
  private readonly shell = inject(AppShellState);

  readonly query = signal<string>('');
  readonly mode = signal<BqSearchMode>('structured');

  /** Semantic mode hits the API; debounce so a fast typist doesn't fire one
   * embedding+vector query per keystroke. Structured mode reads the local
   * cache and stays immediate. */
  private readonly debouncedQuery = toSignal(
    toObservable(this.query).pipe(debounceTime(250)),
    { initialValue: '' },
  );

  readonly suggestions = SUGGESTIONS;

  readonly placeholder = computed(() =>
    this.mode() === 'semantic' ? 'Describe what you’re looking for…' : 'name, word, or tag',
  );

  readonly hint = computed(() =>
    this.mode() === 'semantic' ? 'pgvector · cosine' : 'indexed columns',
  );

  readonly resultsLabel = computed(() =>
    this.mode() === 'semantic' ? 'Closest in meaning' : 'Direct matches',
  );

  // results is signal-backed (not computed) so the fetch+signal-write inside
  // data.search runs in an effect's allowed-write context, not a computed.
  private readonly _results = signal<readonly BqEntity[]>([]);
  readonly results = this._results.asReadonly();

  constructor() {
    effect(() => {
      const m = this.mode();
      const q = m === 'semantic' ? this.debouncedQuery() : this.query();
      this._results.set(this.data.search(q, m));
    });
  }

  setMode(m: BqSearchMode) {
    this.mode.set(m);
  }

  pickSuggestion(s: string) {
    this.mode.set('semantic');
    this.query.set(s);
  }

  requestOpen(id: string) {
    this.open.emit(id);
    this.shell.openEntity(id);
  }
}

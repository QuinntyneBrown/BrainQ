import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { BqChip, BqEntityRow, BqSearchBar, BqSectionLabel, BqSuggestion } from 'components';
import { BqSearchMode, BRAIN_Q_DATA } from 'domain';
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

  readonly results = computed(() => this.data.search(this.query(), this.mode()));

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

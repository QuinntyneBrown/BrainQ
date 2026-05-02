import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import {
  BqCapturePrompt,
  BqCommitmentCell,
  BqEntityRow,
  BqNudge,
  BqSectionLabel,
} from 'components';
import { BRAIN_Q_DATA } from 'domain';
import { AppShellState } from '../../app-shell-state';

@Component({
  selector: 'app-today',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BqCapturePrompt, BqCommitmentCell, BqEntityRow, BqNudge, BqSectionLabel],
  templateUrl: './today.html',
  styleUrl: './today.scss',
})
export class TodayScreen {
  readonly open = output<string>();
  readonly capture = output<void>();

  private readonly data = inject(BRAIN_Q_DATA);
  private readonly shell = inject(AppShellState);

  readonly agenda = this.data.agenda;
  readonly dateUpper = computed(() => this.agenda().date.toUpperCase());

  readonly commitments = computed(() =>
    this.data.entities().filter((e) => e.type === 'Commitment'),
  );

  readonly recent = computed(() =>
    this.agenda()
      .recent.map((id) => this.data.byId(id))
      .filter((e): e is NonNullable<typeof e> => e !== undefined),
  );

  readonly nudges = computed(() =>
    this.agenda().nudges.map((n) => ({ nudge: n, entity: this.data.byId(n.entityId) })),
  );

  commitValue(done: boolean | undefined): number {
    return done ? 1 : 0.32;
  }

  logCommitment(id: string) {
    this.data.logCommitment(id);
  }

  requestOpen(id: string) {
    this.open.emit(id);
    this.shell.openEntity(id);
  }

  requestCapture() {
    this.capture.emit();
    this.shell.openCapture();
  }
}

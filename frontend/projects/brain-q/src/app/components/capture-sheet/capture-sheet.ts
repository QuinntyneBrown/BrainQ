import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  BqButton,
  BqChip,
  BqEdgeChip,
  BqIcon,
  BqIconButton,
  BqSheet,
  BqTypeGlyph,
  BQ_TYPE_LABEL,
} from 'components';
import { BqCapturePayload, BqEntityType, BRAIN_Q_DATA } from 'domain';

export type { BqCapturePayload } from 'domain';

const TYPES: BqEntityType[] = ['Note', 'Idea', 'Person', 'Project', 'Commitment'];

@Component({
  selector: 'app-capture-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BqButton, BqChip, BqEdgeChip, BqIcon, BqIconButton, BqSheet, BqTypeGlyph],
  templateUrl: './capture-sheet.html',
  styleUrl: './capture-sheet.scss',
})
export class CaptureSheet {
  readonly open = input<boolean>(false);
  readonly closed = output<void>();
  readonly committed = output<BqCapturePayload>();

  private readonly data = inject(BRAIN_Q_DATA);

  readonly types = TYPES;
  readonly typeLabel = BQ_TYPE_LABEL;

  readonly text = signal<string>('');
  readonly typeChoice = signal<BqEntityType | 'auto'>('auto');

  readonly textarea = viewChild<ElementRef<HTMLTextAreaElement>>('textarea');

  constructor() {
    effect(() => {
      if (this.open()) {
        setTimeout(() => this.textarea()?.nativeElement.focus(), 80);
      } else {
        this.text.set('');
        this.typeChoice.set('auto');
      }
    });
  }

  readonly inferred = computed(() => this.data.inferType(this.text()));

  readonly finalType = computed<BqEntityType>(() => {
    const c = this.typeChoice();
    return c === 'auto' ? this.inferred() : c;
  });

  readonly suggested = computed(() => this.data.suggestRelated(this.text(), 3));

  onTextInput(e: Event) {
    this.text.set((e.target as HTMLTextAreaElement).value);
  }

  setType(t: BqEntityType | 'auto') {
    this.typeChoice.set(t);
  }

  cancel() {
    this.closed.emit();
  }

  save() {
    const txt = this.text().trim();
    if (!txt) return;
    this.committed.emit({ type: this.finalType(), text: txt });
    this.closed.emit();
  }
}

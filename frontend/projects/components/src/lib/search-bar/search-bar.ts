import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import { BqIcon } from '../icon/icon';
import { BqIconButton } from '../icon-button/icon-button';

@Component({
  selector: 'bq-search-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BqIcon, BqIconButton],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.scss',
})
export class BqSearchBar {
  readonly value = model<string>('');
  readonly placeholder = input<string>('Search…');
  readonly size = input<'md' | 'lg'>('md');
  readonly autofocus = input<boolean>(false);
  readonly cleared = output<void>();

  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('input');

  constructor() {
    afterNextRender(() => {
      if (this.autofocus()) this.inputEl()?.nativeElement.focus();
    });
  }

  onInput(e: Event) {
    this.value.set((e.target as HTMLInputElement).value);
  }

  clear() {
    this.value.set('');
    this.cleared.emit();
  }
}

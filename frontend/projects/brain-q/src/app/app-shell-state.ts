import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AppShellState {
  readonly openId = signal<string | null>(null);
  readonly captureOpen = signal(false);

  openEntity(id: string) {
    this.openId.set(id);
  }

  closeEntity() {
    this.openId.set(null);
  }

  openCapture() {
    this.captureOpen.set(true);
  }

  closeCapture() {
    this.captureOpen.set(false);
  }
}

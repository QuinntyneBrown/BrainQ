import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'bq-app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class BqAppShell {}

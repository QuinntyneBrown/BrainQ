import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import {
  BqAppShell,
  BqRailItem,
  BqSideRail,
  BqTabBar,
  BqTabItem,
  BqToast,
  BqTweaksPanel,
  BQ_TYPE_LABEL,
} from 'components';
import { BqCapturePayload, BRAIN_Q_DATA } from 'domain';
import { CaptureSheet } from './components/capture-sheet/capture-sheet';
import {
  BrainCtxPane,
  NeighborhoodCtxPane,
  SearchCtxPane,
  TodayCtxPane,
} from './components/context-panes/context-panes';
import { filter, map, startWith } from 'rxjs';
import { AppShellState } from './app-shell-state';
import { DetailScreen } from './screens/detail/detail';

type Tab = 'today' | 'brain' | 'search';

const TAB_ITEMS: BqTabItem[] = [
  { id: 'today', icon: 'today', label: 'Today' },
  { id: 'brain', icon: 'brain', label: 'Brain' },
  { id: 'capture', icon: 'capture', label: 'Capture', capture: true },
  { id: 'search', icon: 'search', label: 'Search' },
];

const RAIL_ITEMS: BqRailItem[] = [
  { id: 'today', icon: 'today', label: 'Today' },
  { id: 'brain', icon: 'brain', label: 'Brain' },
  { id: 'search', icon: 'search', label: 'Search' },
];

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BqAppShell,
    BqSideRail,
    BqTabBar,
    BqToast,
    BqTweaksPanel,
    BrainCtxPane,
    CaptureSheet,
    DetailScreen,
    NeighborhoodCtxPane,
    SearchCtxPane,
    TodayCtxPane,
    RouterOutlet,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly data = inject(BRAIN_Q_DATA);
  private readonly router = inject(Router);
  private readonly shell = inject(AppShellState);
  private toastTimer: ReturnType<typeof setTimeout> | undefined;
  private seenCaptureFailures = 0;

  readonly tabItems = TAB_ITEMS;
  readonly railItems = RAIL_ITEMS;
  readonly openId = this.shell.openId;
  readonly captureOpen = this.shell.captureOpen;
  readonly toast = signal<string | null>(null);
  readonly activeTab = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      startWith(null),
      map(() => routeToTab(this.router.url)),
    ),
    { initialValue: routeToTab(this.router.url) },
  );

  readonly entityCount = computed(() => this.data.entities().length);
  readonly edgeCount = computed(() =>
    this.data.entities().reduce((acc, e) => acc + (e.edges?.length || 0), 0),
  );

  constructor() {
    effect(() => {
      const failures = this.data.captureFailures();
      if (failures > this.seenCaptureFailures) {
        this.seenCaptureFailures = failures;
        this.showToast('Save failed — try again');
      }
    });
  }

  setTab(id: string | null) {
    if (id === 'today' || id === 'brain' || id === 'search') {
      void this.router.navigate(['/', id]);
    }
  }

  openEntity(id: string) {
    this.shell.openEntity(id);
  }

  closeEntity() {
    this.shell.closeEntity();
  }

  openCapture() {
    this.shell.openCapture();
  }

  closeCapture() {
    this.shell.closeCapture();
  }

  onCommit(p: BqCapturePayload) {
    const saved = this.data.capture(p);
    this.showToast(`Saved as ${BQ_TYPE_LABEL[saved.type]} · linked to your brain`);
  }

  private showToast(message: string) {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toast.set(message);
    this.toastTimer = setTimeout(() => this.toast.set(null), 2400);
  }
}

function routeToTab(url: string): Tab {
  const [path] = url.split(/[?#]/);
  const segment = path.split('/').find(Boolean);
  return segment === 'brain' || segment === 'search' ? segment : 'today';
}

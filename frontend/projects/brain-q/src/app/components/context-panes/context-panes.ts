import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import {
  BQ_EDGE_LABEL,
  BQ_TYPE_LABEL,
  BqCtxPane,
  BqEntityRow,
  BqIcon,
  BqTypeGlyph,
} from 'components';
import { BqEdgeKind, BqEntityType, BRAIN_Q_DATA } from 'domain';

const EDGE_KINDS: BqEdgeKind[] = ['mentions', 'blocks', 'fulfills', 'relatesTo'];
const ALL_TYPES: BqEntityType[] = ['Person', 'Project', 'Commitment', 'Note', 'Idea'];

@Component({
  selector: 'app-today-ctx',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BqCtxPane, BqEntityRow, BqTypeGlyph],
  templateUrl: './today-ctx.html',
  styleUrl: './context-panes.scss',
})
export class TodayCtxPane {
  readonly open = output<string>();
  private readonly data = inject(BRAIN_Q_DATA);

  readonly shape = computed(() => {
    const all = this.data.entities();
    const counts: Record<string, number> = {};
    for (const e of all) counts[e.type] = (counts[e.type] || 0) + 1;
    return ALL_TYPES.filter((t) => counts[t]).map((t) => ({
      type: t,
      label: BQ_TYPE_LABEL[t],
      count: counts[t] || 0,
      fillPct: Math.min(100, ((counts[t] || 0) / 8) * 100),
    }));
  });

  readonly totalEdges = computed(() =>
    this.data.entities().reduce((acc, e) => acc + (e.edges?.length || 0), 0),
  );

  readonly warmIdeas = computed(() =>
    this.data.entities().filter((e) => e.type === 'Idea' && e.meta?.heat === 'warm'),
  );

  readonly overdue = computed(() =>
    this.data.entities().filter((e) => e.tags.includes('overdue')),
  );
}

@Component({
  selector: 'app-brain-ctx',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BqCtxPane, BqIcon, BqTypeGlyph],
  templateUrl: './brain-ctx.html',
  styleUrl: './context-panes.scss',
})
export class BrainCtxPane {
  readonly open = output<string>();
  private readonly data = inject(BRAIN_Q_DATA);

  readonly edgeKinds = EDGE_KINDS;
  edgeLabel(k: BqEdgeKind): string {
    return BQ_EDGE_LABEL[k];
  }

  readonly leaderboard = computed(() => {
    const all = this.data.entities();
    return all
      .map((e) => {
        const inb = this.data.inboundFor(e.id).length;
        const out = e.edges?.length || 0;
        return { id: e.id, type: e.type, title: e.title, total: inb + out };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  });
}

@Component({
  selector: 'app-search-ctx',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BqCtxPane],
  templateUrl: './search-ctx.html',
  styleUrl: './context-panes.scss',
})
export class SearchCtxPane {}

interface Positioned {
  id: string;
  type: BqEntityType;
  title: string;
  kind: BqEdgeKind;
  dir: 'in' | 'out';
  x: number;
  y: number;
}

@Component({
  selector: 'app-neighborhood-ctx',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BqCtxPane, BqIcon, BqTypeGlyph],
  templateUrl: './neighborhood-ctx.html',
  styleUrl: './context-panes.scss',
})
export class NeighborhoodCtxPane {
  readonly id = input.required<string>();
  readonly open = output<string>();

  private readonly data = inject(BRAIN_Q_DATA);

  readonly centerX = 110;
  readonly centerY = 110;
  private readonly radius = 78;

  readonly entity = computed(() => this.data.byId(this.id()));

  readonly positioned = computed<Positioned[]>(() => {
    const e = this.entity();
    if (!e) return [];
    const inbound = this.data.inboundFor(e.id);
    const outbound = e.edges;
    const nodes = [
      ...outbound.map((edge) => ({ id: edge.to, kind: edge.kind, dir: 'out' as const })),
      ...inbound.map((inb) => ({ id: inb.from, kind: inb.kind, dir: 'in' as const })),
    ];
    const total = Math.max(nodes.length, 1);
    return nodes
      .map((n, i) => {
        const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
        const target = this.data.byId(n.id);
        if (!target) return null;
        return {
          id: n.id,
          type: target.type,
          title: target.title,
          kind: n.kind,
          dir: n.dir,
          x: this.centerX + Math.cos(angle) * this.radius,
          y: this.centerY + Math.sin(angle) * this.radius,
        };
      })
      .filter((x): x is Positioned => x !== null);
  });

  edgeLabel(k: BqEdgeKind): string {
    return BQ_EDGE_LABEL[k];
  }

  initials(title: string): string {
    return title
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('');
  }
}

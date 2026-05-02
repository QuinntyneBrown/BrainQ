import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { API_BASE_URL } from './api-base-url.token';
import { BrainQDataService } from './brain-q-data.service';
import {
  BqAgenda,
  BqCapturePayload,
  BqEdgeKind,
  BqEntity,
  BqEntityType,
  BqHeatmap,
  BqInboundEdge,
  BqSearchMode,
} from './models';
import { SEED_AGENDA, SEED_HEATMAP } from './seed';
import { structuredSearch } from './structured-search';

const EMPTY_AGENDA: BqAgenda = {
  ...SEED_AGENDA,
  recent: [],
  nudges: [],
};

@Injectable()
export class HttpBrainQDataService implements BrainQDataService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  private readonly _entities = signal<readonly BqEntity[]>([]);
  private readonly _agenda = signal<BqAgenda>(EMPTY_AGENDA);
  private readonly _captureFailures = signal<number>(0);
  private readonly _semanticQ = signal<string>('');
  private readonly _semanticResults = signal<readonly BqEntity[]>([]);

  readonly entities: Signal<readonly BqEntity[]> = this._entities.asReadonly();
  readonly agenda: Signal<BqAgenda> = this._agenda.asReadonly();
  readonly captureFailures: Signal<number> = this._captureFailures.asReadonly();

  private readonly index = computed(() => {
    const byId = new Map<string, BqEntity>();
    const inbound = new Map<string, BqInboundEdge[]>();
    for (const e of this._entities()) {
      byId.set(e.id, e);
      for (const edge of e.edges) {
        const list = inbound.get(edge.to) ?? [];
        list.push({ from: e.id, kind: edge.kind });
        inbound.set(edge.to, list);
      }
    }
    return { byId, inbound };
  });

  constructor() {
    this.hydrate();
    this.hydrateAgenda();
  }

  byId(id: string): BqEntity | undefined {
    return this.index().byId.get(id);
  }

  inboundFor(id: string): readonly BqInboundEdge[] {
    return this.index().inbound.get(id) ?? [];
  }

  heatmapFor(_id: string): BqHeatmap {
    return SEED_HEATMAP;
  }

  search(query: string, mode: BqSearchMode): readonly BqEntity[] {
    const q = query.trim();
    if (!q) return [];
    if (mode === 'structured') return structuredSearch(this._entities(), q);
    if (this._semanticQ() !== q) {
      this._semanticQ.set(q);
      this.http
        .get<readonly { entity: BqEntity }[]>(`${this.base}/search`, { params: { q } })
        .subscribe({
          next: (hits) => this._semanticResults.set(hits.map((h) => h.entity)),
          error: () => this._semanticResults.set([]),
        });
    }
    return this._semanticResults();
  }

  inferType(text: string): BqEntityType {
    const t = text.toLowerCase().trim();
    if (!t) return 'Note';
    if (/\b(idea|what if|maybe i could|possibility)\b/.test(t)) return 'Idea';
    if (/\b(every day|daily|each week|commit|goal of)\b/.test(t)) return 'Commitment';
    if (
      /\b(met|coffee with|called|emailed|birthday)\b/.test(t) ||
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/.test(text)
    )
      return 'Person';
    if (/\bproject\b|\bship\b|\bdeadline\b|\bmilestone\b/.test(t)) return 'Project';
    return 'Note';
  }

  suggestRelated(text: string, limit = 3): readonly BqEntity[] {
    const txt = text.trim();
    if (!txt) return [];
    const words = txt.toLowerCase();
    return this._entities()
      .filter(
        (e) =>
          words.includes(e.title.toLowerCase().split(' ')[0]) ||
          (e.tags || []).some((tag) => words.includes(tag)),
      )
      .slice(0, limit);
  }

  capture(payload: BqCapturePayload): BqEntity {
    const optimistic = makeOptimistic(payload);
    this._entities.update((xs) => [optimistic, ...xs]);
    this.promoteRecent(optimistic.id);

    this.http.post<BqEntity>(`${this.base}/entities`, payload).subscribe({
      next: (saved) => {
        this._entities.update((xs) => xs.map((e) => (e.id === optimistic.id ? saved : e)));
        this.replaceRecentId(optimistic.id, saved.id);
        this.refresh();
      },
      error: () => {
        this._entities.update((xs) => xs.filter((e) => e.id !== optimistic.id));
        this.removeRecent(optimistic.id);
        this._captureFailures.update((count) => count + 1);
      },
    });

    return optimistic;
  }

  refresh(): void {
    this.hydrate();
    this.hydrateAgenda();
  }

  removeEntity(id: string): void {
    const before = this._entities();
    this._entities.update((xs) =>
      xs
        .filter((e) => e.id !== id)
        .map((e) => ({ ...e, edges: e.edges.filter((edge) => edge.to !== id) })),
    );
    this._agenda.update((a) => ({ ...a, recent: a.recent.filter((rid) => rid !== id) }));
    this.http.delete(`${this.base}/entities/${id}`).subscribe({
      error: () => this._entities.set(before),
    });
  }

  addEdge(fromId: string, toId: string, kind: BqEdgeKind): void {
    const before = this._entities();
    this._entities.update((xs) =>
      xs.map((e) => {
        if (e.id !== fromId) return e;
        if (e.edges.some((edge) => edge.to === toId && edge.kind === kind)) return e;
        return { ...e, edges: [...e.edges, { to: toId, kind }] };
      }),
    );
    this.http
      .post(`${this.base}/edges`, { fromEntityId: fromId, toEntityId: toId, type: kind })
      .subscribe({ error: () => this._entities.set(before) });
  }

  removeEdge(fromId: string, toId: string, kind: BqEdgeKind): void {
    const before = this._entities();
    this._entities.update((xs) =>
      xs.map((e) => {
        if (e.id !== fromId) return e;
        return { ...e, edges: e.edges.filter((edge) => edge.to !== toId || edge.kind !== kind) };
      }),
    );
    const url = `${this.base}/edges?fromId=${fromId}&toId=${toId}&type=${kind}`;
    this.http.get<{ id: string }[]>(url).subscribe({
      next: (edges) => {
        if (edges.length === 0) return;
        this.http.delete(`${this.base}/edges/${edges[0].id}`).subscribe({
          error: () => this._entities.set(before),
        });
      },
      error: () => this._entities.set(before),
    });
  }

  private hydrate() {
    this.http.get<readonly BqEntity[]>(`${this.base}/entities`).subscribe((xs) => {
      this._entities.set(xs);
    });
  }

  private hydrateAgenda() {
    this.http.get<BqAgenda>(`${this.base}/today`).subscribe({
      next: (a) => this._agenda.set(a),
    });
  }

  private promoteRecent(id: string) {
    this._agenda.update((agenda) => ({
      ...agenda,
      recent: [id, ...agenda.recent.filter((existing) => existing !== id)],
    }));
  }

  private replaceRecentId(from: string, to: string) {
    this._agenda.update((agenda) => ({
      ...agenda,
      recent: agenda.recent.map((id) => (id === from ? to : id)),
    }));
  }

  private removeRecent(id: string) {
    this._agenda.update((agenda) => ({
      ...agenda,
      recent: agenda.recent.filter((existing) => existing !== id),
    }));
  }
}

function makeOptimistic(payload: BqCapturePayload): BqEntity {
  return {
    id: `optimistic_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`,
    type: payload.type,
    title: titleFrom(payload.text),
    subtitle: 'Just captured',
    body: payload.text,
    meta: {},
    tags: [],
    edges: [],
  };
}

function titleFrom(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0]?.trim() ?? text;
  return firstLine.slice(0, 80);
}

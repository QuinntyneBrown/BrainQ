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
  BqHeatLevel,
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
  private readonly _mutationFailures = signal<number>(0);
  private readonly _semanticQ = signal<string>('');
  private readonly _semanticResults = signal<readonly BqEntity[]>([]);
  private readonly _heatmaps = signal<Record<string, BqHeatmap>>({});
  private readonly _heatmapsInFlight = new Set<string>();

  readonly entities: Signal<readonly BqEntity[]> = this._entities.asReadonly();
  readonly agenda: Signal<BqAgenda> = this._agenda.asReadonly();
  readonly mutationFailures: Signal<number> = this._mutationFailures.asReadonly();

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

  heatmapFor(id: string): BqHeatmap {
    const cached = this._heatmaps()[id];
    if (cached) return cached;
    if (this._heatmapsInFlight.has(id)) return SEED_HEATMAP;
    this._heatmapsInFlight.add(id);
    this.http
      .get<{ cells: number[][] }>(`${this.base}/commitments/${id}/activity`, {
        params: { weeks: '18' },
      })
      .subscribe({
        next: (resp) => {
          const map = resp.cells.map((week) => week.map((v) => v as BqHeatLevel));
          this._heatmaps.update((cache) => ({ ...cache, [id]: map }));
          this._heatmapsInFlight.delete(id);
        },
        error: () => this._heatmapsInFlight.delete(id),
      });
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
          next: (hits) => {
            if (this._semanticQ() !== q) return;
            this._semanticResults.set(hits.map((h) => h.entity));
          },
          error: () => {
            if (this._semanticQ() !== q) return;
            this._semanticResults.set([]);
          },
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
        this._mutationFailures.update((c) => c + 1);
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
    this._agenda.update((a) => ({
      ...a,
      recent: a.recent.filter((rid) => rid !== id),
      nudges: a.nudges.filter((n) => n.entityId !== id),
    }));
    this.http.delete(`${this.base}/entities/${id}`).subscribe({
      error: () => this.rollback(before),
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
      .subscribe({ error: () => this.rollback(before) });
  }

  logCommitment(id: string): void {
    const before = this._entities();
    this._entities.update((xs) =>
      xs.map((e) => {
        if (e.id !== id || e.type !== 'Commitment' || e.meta.todayDone) return e;
        return { ...e, meta: { ...e.meta, todayDone: true, streak: (e.meta.streak ?? 0) + 1 } };
      }),
    );
    this.http
      .post<{ streak: number; todayDone: boolean }>(`${this.base}/commitments/${id}/log`, {})
      .subscribe({
        next: (res) => {
          this._entities.update((xs) =>
            xs.map((e) =>
              e.id === id
                ? { ...e, meta: { ...e.meta, streak: res.streak, todayDone: res.todayDone } }
                : e,
            ),
          );
          this._heatmaps.update((cache) => {
            const next = { ...cache };
            delete next[id];
            return next;
          });
        },
        error: () => this.rollback(before),
      });
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
          error: () => this.rollback(before),
        });
      },
      error: () => this.rollback(before),
    });
  }

  private rollback(before: readonly BqEntity[]): void {
    this._entities.set(before);
    this._mutationFailures.update((c) => c + 1);
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

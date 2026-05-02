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
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const entities = this._entities();
    if (mode === 'structured') {
      return entities
        .map((e) => {
          let score = 0;
          if (e.title.toLowerCase().includes(q)) score += 3;
          if ((e.body || '').toLowerCase().includes(q)) score += 2;
          if ((e.tags || []).some((t) => t.includes(q))) score += 1;
          return { e, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.e);
    }
    const tokens = q.split(/\s+/).filter(Boolean);
    return entities
      .map((e) => {
        const hay = (e.title + ' ' + (e.body || '') + ' ' + (e.tags || []).join(' ')).toLowerCase();
        let score = 0;
        for (const t of tokens) {
          if (hay.includes(t)) score += 1;
          if (hay.includes(t.slice(0, 4))) score += 0.4;
        }
        if (e.type === 'Idea' || e.type === 'Note') score += 0.6;
        return { e, score };
      })
      .filter((x) => x.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((x) => x.e);
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
  }

  removeEntity(id: string): void {
    const before = this._entities();
    this._entities.update((xs) =>
      xs
        .filter((e) => e.id !== id)
        .map((e) =>
          e.edges.some((edge) => edge.to === id)
            ? { ...e, edges: e.edges.filter((edge) => edge.to !== id) }
            : e,
        ),
    );
    this._agenda.update((a) => ({ ...a, recent: a.recent.filter((rid) => rid !== id) }));
    this.http.delete(`${this.base}/entities/${id}`).subscribe({
      error: () => this._entities.set(before),
    });
  }

  addEdge(fromId: string, toId: string, kind: BqEdgeKind): void {
    const before = this._entities();
    this._entities.update((xs) =>
      xs.map((e) =>
        e.id === fromId && !e.edges.some((edge) => edge.to === toId && edge.kind === kind)
          ? { ...e, edges: [...e.edges, { to: toId, kind }] }
          : e,
      ),
    );
    this.http.post(`${this.base}/edges`, { fromEntityId: fromId, toEntityId: toId, type: kind }).subscribe({
      error: () => this._entities.set(before),
    });
  }

  removeEdge(fromId: string, toId: string, kind: BqEdgeKind): void {
    const before = this._entities();
    this._entities.update((xs) =>
      xs.map((e) =>
        e.id === fromId
          ? { ...e, edges: e.edges.filter((edge) => !(edge.to === toId && edge.kind === kind)) }
          : e,
      ),
    );
    this.http
      .get<readonly { id: string; fromEntityId: string; toEntityId: string; type: string }[]>(
        `${this.base}/edges?fromId=${fromId}&toId=${toId}&type=${kind}`,
      )
      .subscribe({
        next: (edges) => {
          const match = edges[0];
          if (!match) return;
          this.http.delete(`${this.base}/edges/${match.id}`).subscribe({
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

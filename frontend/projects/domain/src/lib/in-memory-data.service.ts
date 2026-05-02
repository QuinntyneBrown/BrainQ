import { Injectable, Signal, computed, signal } from '@angular/core';
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
import { SEED_AGENDA, SEED_ENTITIES, SEED_HEATMAP } from './seed';
import { structuredSearch } from './structured-search';

@Injectable()
export class InMemoryBrainQDataService implements BrainQDataService {
  private readonly _entities = signal<readonly BqEntity[]>(SEED_ENTITIES);
  private readonly _agenda = signal<BqAgenda>(SEED_AGENDA);
  private readonly _mutationFailures = signal<number>(0);

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
    const entities = this._entities();
    if (mode === 'structured') return structuredSearch(entities, q);
    // In-memory semantic fallback: token-fuzzy match over title/body/tags.
    const lower = q.toLowerCase();
    const tokens = lower.split(/\s+/).filter(Boolean);
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
    const id = `${payload.type[0].toLowerCase()}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const entity: BqEntity = {
      id,
      type: payload.type,
      title: payload.text.split('\n')[0].slice(0, 80) || payload.text,
      subtitle: 'Just captured',
      body: payload.text,
      meta: {},
      tags: [],
      edges: [],
    };
    this._entities.update((xs) => [entity, ...xs]);
    this._agenda.update((agenda) => ({
      ...agenda,
      recent: [entity.id, ...agenda.recent.filter((id) => id !== entity.id)],
    }));
    return entity;
  }

  removeEntity(id: string): void {
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
  }

  addEdge(fromId: string, toId: string, kind: BqEdgeKind): void {
    this._entities.update((xs) =>
      xs.map((e) => {
        if (e.id !== fromId) return e;
        if (e.edges.some((edge) => edge.to === toId && edge.kind === kind)) return e;
        return { ...e, edges: [...e.edges, { to: toId, kind }] };
      }),
    );
  }

  removeEdge(fromId: string, toId: string, kind: BqEdgeKind): void {
    this._entities.update((xs) =>
      xs.map((e) => {
        if (e.id !== fromId) return e;
        return { ...e, edges: e.edges.filter((edge) => edge.to !== toId || edge.kind !== kind) };
      }),
    );
  }

  logCommitment(id: string): void {
    this._entities.update((xs) =>
      xs.map((e) => {
        if (e.id !== id || e.type !== 'Commitment' || e.meta.todayDone) return e;
        return { ...e, meta: { ...e.meta, todayDone: true, streak: (e.meta.streak ?? 0) + 1 } };
      }),
    );
  }
}

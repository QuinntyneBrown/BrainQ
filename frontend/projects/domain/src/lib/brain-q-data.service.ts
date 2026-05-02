import { InjectionToken, Signal } from '@angular/core';
import {
  BqAgenda,
  BqCapturePayload,
  BqEntity,
  BqHeatmap,
  BqInboundEdge,
  BqSearchMode,
} from './models';

/**
 * Read/write contract for the BrainQ data layer.
 *
 * The interface is the only thing the brain-q app depends on. Implementations
 * can be in-memory, HTTP-backed, or anything else — the app does not know.
 *
 * Reactive state is exposed as Angular Signals. Lookup methods return plain
 * values; consumers wrap them in `computed()` for reactivity, and the methods
 * read from the signal-backed state internally so derivations re-evaluate
 * whenever the underlying data changes.
 */
export interface BrainQDataService {
  /** All entities currently known to the app. */
  readonly entities: Signal<readonly BqEntity[]>;
  /** Today's agenda (greeting, prompt, nudges, recent ids). */
  readonly agenda: Signal<BqAgenda>;

  byId(id: string): BqEntity | undefined;
  inboundFor(id: string): readonly BqInboundEdge[];
  heatmapFor(id: string): BqHeatmap;
  search(query: string, mode: BqSearchMode): readonly BqEntity[];
  /** Heuristically infer the entity type from free-form capture text. */
  inferType(text: string): BqCapturePayload['type'];
  /** Suggest entities that look related to free-form capture text. */
  suggestRelated(text: string, limit?: number): readonly BqEntity[];

  /** Persist a new entity from the capture sheet. Returns the saved entity. */
  capture(payload: BqCapturePayload): BqEntity;

  /** Increments when an optimistic capture fails and is rolled back. */
  readonly captureFailures: Signal<number>;
}

export const BRAIN_Q_DATA = new InjectionToken<BrainQDataService>('BRAIN_Q_DATA');

export type BqEntityType = 'Person' | 'Project' | 'Commitment' | 'Note' | 'Idea';

export type BqEdgeKind = 'mentions' | 'blocks' | 'fulfills' | 'relatesTo';

export type BqHeatLevel = 0 | 1 | 2 | 3 | 4;

export type BqHeatmap = BqHeatLevel[][];

export type BqSearchMode = 'structured' | 'semantic';

export interface BqEntityMeta {
  // Person
  lastSeen?: string;
  touchpoints?: number;
  relationship?: string;
  // Project
  status?: string;
  due?: string;
  progress?: number;
  // Commitment
  cadence?: string;
  streak?: number;
  target?: number;
  unit?: string;
  todayDone?: boolean;
  // Note / Idea
  created?: string;
  heat?: string;
}

export interface BqEdge {
  readonly kind: BqEdgeKind;
  readonly to: string;
}

export interface BqInboundEdge {
  readonly from: string;
  readonly kind: BqEdgeKind;
}

export interface BqEntity {
  readonly id: string;
  readonly type: BqEntityType;
  readonly title: string;
  readonly subtitle: string;
  readonly body: string;
  readonly meta: BqEntityMeta;
  readonly tags: readonly string[];
  readonly edges: readonly BqEdge[];
}

export interface BqNudge {
  readonly id: string;
  readonly text: string;
  readonly kind: 'soft' | 'hard';
  readonly entityId: string;
}

export interface BqAgenda {
  readonly date: string;
  readonly greeting: string;
  readonly prompt: string;
  readonly recent: readonly string[];
  readonly nudges: readonly BqNudge[];
}

export interface BqCapturePayload {
  readonly type: BqEntityType;
  readonly text: string;
}

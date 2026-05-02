/*
 * Public API surface of the BrainQ domain library.
 *
 * Consumers depend only on the exports here: models, the BrainQDataService
 * contract + BRAIN_Q_DATA injection token, and provideBrainQDomain() to wire
 * the default implementation. Implementation classes are not re-exported.
 */

export * from './lib/models';
export * from './lib/api-base-url.token';
export * from './lib/brain-q-data.service';
export * from './lib/provide-domain';

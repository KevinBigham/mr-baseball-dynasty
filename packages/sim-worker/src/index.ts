/**
 * @module sim-worker
 * Public API surface for @mbd/sim-worker.
 *
 * Only the WorkerApi TYPE is exported here.
 * The actual worker code runs inside the Web Worker context —
 * the app uses Comlink.wrap<WorkerApi>() to proxy into it.
 */

export type { WorkerApi } from './worker.js';

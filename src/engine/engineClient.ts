import * as Comlink from 'comlink';
import type { WorkerAPI } from './worker';

// ─── Singleton Comlink-wrapped worker ─────────────────────────────────────────

let _engine: Comlink.Remote<WorkerAPI> | null = null;

export function getEngine(): Comlink.Remote<WorkerAPI> {
  if (!_engine) {
    const worker = new Worker(
      new URL('./worker.ts', import.meta.url),
      { type: 'module' },
    );
    _engine = Comlink.wrap<WorkerAPI>(worker);
  }
  return _engine;
}

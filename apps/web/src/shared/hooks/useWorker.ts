import { useRef, useState, useEffect, useCallback } from 'react';
import * as Comlink from 'comlink';
import type { WorkerApi } from '@/workers/sim.worker';

export function useWorker() {
  const workerRef = useRef<Comlink.Remote<WorkerApi> | null>(null);
  const rawWorkerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const worker = new Worker(
      new URL('../../workers/sim.worker.ts', import.meta.url),
      { type: 'module' }
    );
    rawWorkerRef.current = worker;
    const wrapped = Comlink.wrap<WorkerApi>(worker);
    workerRef.current = wrapped;

    // Verify the worker is alive
    wrapped
      .ping()
      .then(() => setIsReady(true))
      .catch((err: unknown) => {
        console.error('Worker ping failed:', err);
        setIsReady(false);
      });

    return () => {
      worker.terminate();
      workerRef.current = null;
      rawWorkerRef.current = null;
      setIsReady(false);
    };
  }, []);

  const getApi = useCallback((): Comlink.Remote<WorkerApi> => {
    if (!workerRef.current) {
      throw new Error('Worker not initialized');
    }
    return workerRef.current;
  }, []);

  const ping = useCallback(async () => {
    return getApi().ping();
  }, [getApi]);

  const newGame = useCallback(
    async (seed: number) => {
      return getApi().newGame(seed);
    },
    [getApi]
  );

  const simDay = useCallback(async () => {
    return getApi().simDay();
  }, [getApi]);

  const simWeek = useCallback(async () => {
    return getApi().simWeek();
  }, [getApi]);

  const simMonth = useCallback(async () => {
    return getApi().simMonth();
  }, [getApi]);

  const getState = useCallback(async () => {
    return getApi().getState();
  }, [getApi]);

  return { ping, newGame, simDay, simWeek, simMonth, getState, isReady };
}

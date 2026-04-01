import { useMemo, useSyncExternalStore, useCallback } from 'react';
import * as Comlink from 'comlink';
import type { WorkerApi } from '@/workers/sim.worker';

// ---------------------------------------------------------------------------
// Singleton worker — shared across all components
// ---------------------------------------------------------------------------

let singletonApi: Comlink.Remote<WorkerApi> | null = null;
let singletonWorker: Worker | null = null;
let ready = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const l of listeners) l();
}

function getOrCreateWorker(): Comlink.Remote<WorkerApi> {
  if (singletonApi) return singletonApi;

  singletonWorker = new Worker(
    new URL('../../workers/sim.worker.ts', import.meta.url),
    { type: 'module' },
  );
  singletonApi = Comlink.wrap<WorkerApi>(singletonWorker);

  singletonApi
    .ping()
    .then(() => {
      ready = true;
      notifyListeners();
    })
    .catch((err: unknown) => {
      console.error('Worker ping failed:', err);
    });

  return singletonApi;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

function getSnapshot() {
  return ready;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useWorker() {
  const api = useMemo(() => getOrCreateWorker(), []);
  const isReady = useSyncExternalStore(subscribe, getSnapshot);

  const ping = useCallback(async () => api.ping(), [api]);

  const newGame = useCallback(
    async (seed: number, userTeamId?: string) => api.newGame(seed, userTeamId),
    [api],
  );

  const simDay = useCallback(async () => api.simDay(), [api]);
  const simWeek = useCallback(async () => api.simWeek(), [api]);
  const simMonth = useCallback(async () => api.simMonth(), [api]);
  const getState = useCallback(async () => api.getState(), [api]);

  const getStandings = useCallback(async () => api.getStandings(), [api]);

  const getTeamRoster = useCallback(
    async (teamId: string) => api.getTeamRoster(teamId),
    [api],
  );

  const getFullRoster = useCallback(
    async (teamId: string) => api.getFullRoster(teamId),
    [api],
  );

  const getPlayer = useCallback(
    async (playerId: string) => api.getPlayer(playerId),
    [api],
  );

  const getLeagueLeaders = useCallback(
    async (stat: string, limit?: number) => api.getLeagueLeaders(stat, limit),
    [api],
  );

  const getPlayoffBracket = useCallback(async () => api.getPlayoffBracket(), [api]);

  const searchPlayers = useCallback(
    async (query: string, limit?: number) => api.searchPlayers(query, limit),
    [api],
  );

  return {
    ping, newGame, simDay, simWeek, simMonth, getState,
    getStandings, getTeamRoster, getFullRoster, getPlayer,
    getLeagueLeaders, getPlayoffBracket, searchPlayers,
    isReady,
  };
}

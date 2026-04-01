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
  const exportSnapshot = useCallback(async () => api.exportSnapshot(), [api]);
  const importSnapshot = useCallback(
    async (snapshot: unknown) => api.importSnapshot(snapshot),
    [api],
  );

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
  const getScoutingStaff = useCallback(async () => api.getScoutingStaff(), [api]);
  const scoutPlayerReport = useCallback(
    async (playerId: string) => api.scoutPlayerReport(playerId),
    [api],
  );
  const getNews = useCallback(async (limit?: number) => api.getNews(limit), [api]);
  const markNewsRead = useCallback(async (newsId: string) => api.markNewsRead(newsId), [api]);
  const getBriefing = useCallback(async (limit?: number) => api.getBriefing(limit), [api]);
  const getPressRoomFeed = useCallback(
    async (limit?: number) => api.getPressRoomFeed(limit),
    [api],
  );
  const getTeamChemistry = useCallback(
    async (teamId?: string) => api.getTeamChemistry(teamId),
    [api],
  );
  const getOwnerState = useCallback(
    async (teamId?: string) => api.getOwnerState(teamId),
    [api],
  );
  const getPersonalityProfile = useCallback(
    async (playerId: string) => api.getPersonalityProfile(playerId),
    [api],
  );
  const getAwardRaces = useCallback(async () => api.getAwardRaces(), [api]);
  const getRivalries = useCallback(
    async (teamId?: string) => api.getRivalries(teamId),
    [api],
  );
  const getAwardHistory = useCallback(async () => api.getAwardHistory(), [api]);
  const getSeasonHistory = useCallback(async () => api.getSeasonHistory(), [api]);

  const searchPlayers = useCallback(
    async (query: string, limit?: number) => api.searchPlayers(query, limit),
    [api],
  );

  return {
    ping, newGame, simDay, simWeek, simMonth, getState,
    exportSnapshot, importSnapshot,
    getStandings, getTeamRoster, getFullRoster, getPlayer,
    getLeagueLeaders, getPlayoffBracket,
    getScoutingStaff, scoutPlayerReport,
    getNews, markNewsRead, getBriefing, getPressRoomFeed, getTeamChemistry, getOwnerState,
    getPersonalityProfile, getAwardRaces, getRivalries,
    getAwardHistory, getSeasonHistory,
    searchPlayers,
    isReady,
  };
}

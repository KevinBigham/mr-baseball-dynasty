/**
 * useSeasonSimulation — extracts the season sim + post-sim narrative logic
 * from Dashboard into a reusable hook.
 */

import { useState, useCallback } from 'react';
import * as Comlink from 'comlink';
import { getEngine } from '../engine/engineClient';
import { useGameStore } from '../store/gameStore';
import { useLeagueStore, generateKeyMoment, type SeasonSummary } from '../store/leagueStore';
import type { SeasonResult, AwardCandidate } from '../types/league';
import type { PressContext } from '../data/pressConference';
import type { PlayoffBracket } from '../engine/sim/playoffSimulator';
import {
  calcOwnerPatienceDelta, calcMoraleDelta,
  generateSeasonNews, generateBreakoutWatch, resolveBreakoutWatch,
} from '../engine/narrative';
import { initRivals, updateRivals } from '../engine/rivalry';
import { resolvePredictions } from '../engine/predictions';
import { shouldTriggerPoach, generatePoachEvent } from '../engine/staffPoaching';
import { generateSeasonMoments } from '../engine/moments';
import { buildWeeklyCard } from '../components/dashboard/WeeklyCard';

function extractUserAwards(result: SeasonResult, userTeamId: number): string[] {
  const awards: string[] = [];
  if (!result.awards) return awards;
  const a = result.awards;
  if (a.mvpAL?.teamId === userTeamId) awards.push(`AL MVP — ${a.mvpAL.name}`);
  if (a.mvpNL?.teamId === userTeamId) awards.push(`NL MVP — ${a.mvpNL.name}`);
  if (a.cyYoungAL?.teamId === userTeamId) awards.push(`AL Cy Young — ${a.cyYoungAL.name}`);
  if (a.cyYoungNL?.teamId === userTeamId) awards.push(`NL Cy Young — ${a.cyYoungNL.name}`);
  if (a.royAL?.teamId === userTeamId) awards.push(`AL ROY — ${a.royAL.name}`);
  if (a.royNL?.teamId === userTeamId) awards.push(`NL ROY — ${a.royNL.name}`);
  return awards;
}

export interface SimState {
  lastResult: SeasonResult | null;
  error: string | null;
  pressCtx: PressContext | null;
  lastBreakouts: number;
  lastBusts: number;
  postSimArcWins: number | undefined;
  postSimArcPO: boolean | undefined;
  postSimArcChamp: boolean | undefined;
  playoffBracket: PlayoffBracket | null;
  awardRaceData: {
    mvp:     { al: AwardCandidate[]; nl: AwardCandidate[] };
    cyYoung: { al: AwardCandidate[]; nl: AwardCandidate[] };
    roy:     { al: AwardCandidate[]; nl: AwardCandidate[] };
  } | null;
}

export function useSeasonSimulation() {
  const {
    userTeamId, difficulty,
    setSeason, setSimulating, setSimProgress,
    ownerArchetype, ownerPatience, teamMorale,
    adjustOwnerPatience, adjustTeamMorale,
    breakoutWatch, setBreakoutWatch, incrementSeasonsManaged, seasonsManaged,
    frontOffice, setGamePhase, setSeasonPhase,
  } = useGameStore();

  const {
    setStandings, setLeaderboard, setLastSeasonStats,
    addNewsItems, rivals, setRivals, updateRivals: storeUpdateRivals,
    addSeasonSummary, setPresserAvailable, setPresserDone,
    mfsnReport, setMFSNReport,
    poachEvent, setPoachEvent,
    addMoments, setWeeklyStories,
  } = useLeagueStore();

  const [lastResult,       setLastResult]       = useState<SeasonResult | null>(null);
  const [error,            setError]            = useState<string | null>(null);
  const [pressCtx,         setPressCtx]         = useState<PressContext | null>(null);
  const [lastBreakouts,    setLastBreakouts]    = useState(0);
  const [lastBusts,        setLastBusts]        = useState(0);
  const [postSimArcWins,   setPostSimArcWins]   = useState<number | undefined>(undefined);
  const [postSimArcPO,     setPostSimArcPO]     = useState<boolean | undefined>(undefined);
  const [postSimArcChamp,  setPostSimArcChamp]  = useState<boolean | undefined>(undefined);
  const [playoffBracket,   setPlayoffBracket]   = useState<PlayoffBracket | null>(null);
  const [awardRaceData,    setAwardRaceData]    = useState<SimState['awardRaceData']>(null);

  const simulateSeason = useCallback(async () => {
    setError(null);
    setSimulating(true);
    setSimProgress(0);
    try {
      const engine = getEngine();
      const result = await engine.simulateSeason(
        Comlink.proxy((pct: number) => setSimProgress(pct)),
      );
      setLastResult(result);
      setSeason(result.season + 1);
      setLastSeasonStats(result.leagueERA, result.leagueBA, result.leagueRPG);

      const [standings, hrLeaders, bracket, awardRace] = await Promise.all([
        engine.getStandings(),
        engine.getLeaderboard('hr', 10),
        engine.simulatePlayoffs(),
        engine.getAwardRace(),
      ]);
      setStandings(standings);
      setLeaderboard(hrLeaders);
      setPlayoffBracket(bracket);
      setAwardRaceData(awardRace);
      setSimProgress(1);

      // Resolve MFSN predictions
      if (mfsnReport && !mfsnReport.resolved && standings.standings) {
        setMFSNReport(resolvePredictions(mfsnReport, standings.standings));
      }

      // ── Narrative ──
      const userTeamSeason = result.teamSeasons.find(ts => ts.teamId === userTeamId);
      const userWins       = userTeamSeason?.record.wins ?? 81;
      const userLosses     = userTeamSeason?.record.losses ?? 81;

      const allPlayoffIds = bracket ? new Set([
        ...bracket.alTeams.map(t => t.teamId),
        ...bracket.nlTeams.map(t => t.teamId),
      ]) : new Set<number>();
      const isPlayoff  = allPlayoffIds.has(userTeamId);
      const isChampion = bracket?.championId === userTeamId;

      const breakoutsLeague = (result.developmentEvents ?? []).filter(e => e.type === 'breakout').length;
      const bustsLeague     = (result.developmentEvents ?? []).filter(e => e.type === 'bust').length;
      const breakoutsProxy  = Math.round(breakoutsLeague / 10);
      setLastBreakouts(breakoutsLeague);
      setLastBusts(bustsLeague);

      if (userTeamSeason) {
        adjustOwnerPatience(calcOwnerPatienceDelta(
          ownerArchetype, userTeamSeason, isPlayoff, isChampion, difficulty, breakoutsProxy,
        ));
        const retirements = (result.developmentEvents ?? []).filter(e => e.type === 'retirement').length;
        const breakouts   = (result.developmentEvents ?? []).filter(e => e.type === 'breakout').length;
        const busts       = (result.developmentEvents ?? []).filter(e => e.type === 'bust').length;
        adjustTeamMorale(calcMoraleDelta(userWins, isPlayoff, isChampion, breakouts, retirements, busts));
      }

      // Resolve breakout watch
      let breakoutHits = 0;
      if (breakoutWatch.length > 0) {
        try {
          const roster   = await engine.getRoster(userTeamId);
          const allPlayers = [...roster.active, ...roster.minors, ...roster.il];
          const resolved  = resolveBreakoutWatch(breakoutWatch, allPlayers);
          breakoutHits  = resolved.filter(c => c.hit === true).length;
          setBreakoutWatch(resolved);
        } catch { /* non-fatal */ }
      }

      // Rivals
      if (rivals.length === 0 && standings.standings) {
        setRivals(initRivals(userTeamId, standings.standings));
      } else if (standings.standings) {
        storeUpdateRivals(updateRivals(rivals, standings.standings, userTeamId, isPlayoff));
      }

      // News
      addNewsItems(generateSeasonNews(result, userTeamId));

      // Franchise history
      const summary: SeasonSummary = {
        season:           result.season,
        wins:             userWins,
        losses:           userLosses,
        pct:              userWins / 162,
        playoffResult:    userTeamSeason?.playoffRound ?? null,
        awardsWon:        extractUserAwards(result, userTeamId),
        breakoutHits,
        ownerPatienceEnd: ownerPatience,
        teamMoraleEnd:    teamMorale,
        leagueERA:        result.leagueERA,
        leagueBA:         result.leagueBA,
        keyMoment:        '',
      };
      summary.keyMoment = generateKeyMoment(summary);
      addSeasonSummary(summary);
      incrementSeasonsManaged();

      // Storyboard arc
      setPostSimArcWins(userWins);
      setPostSimArcPO(isPlayoff);
      setPostSimArcChamp(isChampion);

      // Season moments
      const newMoments = generateSeasonMoments(result, summary, userTeamId);
      if (newMoments.length > 0) addMoments(newMoments);

      // Weekly card
      const weekStories = buildWeeklyCard(
        result, standings.standings ?? null, userTeamId, userWins, isChampion, isPlayoff,
      );
      setWeeklyStories(weekStories);

      // Press conference
      setPressCtx({
        wins:           userWins,
        losses:         userLosses,
        isPlayoff,
        isChampion,
        ownerArchetype,
        breakoutHits,
        breakoutBusts:  0,
        season:         result.season,
        seasonsManaged: seasonsManaged + 1,
      });
      setPresserAvailable(true);
      setPresserDone(false);

      // Staff poaching
      if (shouldTriggerPoach(userWins, frontOffice.length, result.season) && !poachEvent) {
        const event = generatePoachEvent(frontOffice, result.season);
        if (event) setPoachEvent(event);
      }

      // Start mid-season phased reveal — show All-Star break first
      setSeasonPhase('allstar');
      setGamePhase('postseason');

    } catch (e) {
      setError(String(e));
    } finally {
      setSimulating(false);
    }
  }, [
    userTeamId, difficulty, ownerArchetype, ownerPatience, teamMorale,
    breakoutWatch, rivals, seasonsManaged, frontOffice, mfsnReport, poachEvent,
    setSeason, setSimulating, setSimProgress, setGamePhase, setSeasonPhase,
    setStandings, setLeaderboard, setLastSeasonStats,
    adjustOwnerPatience, adjustTeamMorale,
    setBreakoutWatch, setRivals, storeUpdateRivals, addNewsItems,
    addSeasonSummary, incrementSeasonsManaged, setPresserAvailable, setPresserDone,
    setMFSNReport, setPoachEvent,
    addMoments, setWeeklyStories,
  ]);

  const refreshBreakoutWatch = useCallback(async () => {
    if (breakoutWatch.length > 0 && breakoutWatch.some(c => c.hit === null)) return;
    try {
      const engine     = getEngine();
      const roster     = await engine.getRoster(userTeamId);
      const allPlayers = [...roster.active, ...roster.minors, ...roster.il];
      setBreakoutWatch(generateBreakoutWatch(allPlayers));
    } catch { /* non-fatal */ }
  }, [userTeamId, breakoutWatch, setBreakoutWatch]);

  const clearSimState = useCallback(() => {
    setLastResult(null);
    setPlayoffBracket(null);
    setAwardRaceData(null);
  }, []);

  return {
    // State
    lastResult, error, pressCtx, lastBreakouts, lastBusts,
    postSimArcWins, postSimArcPO, postSimArcChamp,
    playoffBracket, awardRaceData,
    // Actions
    simulateSeason, refreshBreakoutWatch, clearSimState,
  };
}

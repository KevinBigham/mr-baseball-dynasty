import { useState, useCallback, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore, generateKeyMoment, type SeasonSummary } from '../../store/leagueStore';
import { useUIStore } from '../../store/uiStore';
import type { SeasonResult } from '../../types/league';
import type { AwardWinner, DivisionChampion } from '../../engine/player/awards';
import {
  getOwnerArchetype, calcOwnerPatienceDelta, calcMoraleDelta,
  generateSeasonNews, generateBreakoutWatch, resolveBreakoutWatch,
} from '../../engine/narrative';
import { initRivals, updateRivals } from '../../engine/rivalry';
import {
  OwnerPatiencePanel, MoralePanel, BreakoutWatchPanel, NewsFeedPanel,
} from './FranchisePanel';
import PressConference from './PressConference';
import RivalryPanel    from './RivalryPanel';
import LegacyTimeline  from './LegacyTimeline';
import type { PressContext } from '../../data/pressConference';

const TEAM_OPTIONS = [
  { id: 1,  label: 'ADM — New Harbor Admirals (AL East)' },
  { id: 2,  label: 'COL — Capitol City Colonials (AL East)' },
  { id: 3,  label: 'LOB — Boston Bay Lobsters (AL East)' },
  { id: 4,  label: 'STM — Steel City Steamers (AL East)' },
  { id: 5,  label: 'HAM — Lake City Hammers (AL East)' },
  { id: 6,  label: 'WLV — River City Wolves (AL Central)' },
  { id: 7,  label: 'CRU — South City Crushers (AL Central)' },
  { id: 8,  label: 'FOX — Prairie City Foxes (AL Central)' },
  { id: 9,  label: 'MIN — Twin Peaks Miners (AL Central)' },
  { id: 10, label: 'MON — Crown City Monarchs (AL Central)' },
  { id: 11, label: 'GUL — Bay City Gulls (AL West)' },
  { id: 12, label: 'RAT — Desert City Rattlers (AL West)' },
  { id: 13, label: 'COU — Sun Valley Cougars (AL West)' },
  { id: 14, label: 'LUM — Northwest City Lumberjacks (AL West)' },
  { id: 15, label: 'ANG — Anaheim Hills Angels (AL West)' },
  { id: 16, label: 'MET — New Harbor Metros (NL East)' },
  { id: 17, label: 'BRA — Peach City Brawlers (NL East)' },
  { id: 18, label: 'TID — Palmetto City Tides (NL East)' },
  { id: 19, label: 'PAT — Brick City Patriots (NL East)' },
  { id: 20, label: 'HUR — Swamp City Hurricanes (NL East)' },
  { id: 21, label: 'CUB — Lake City Cubs (NL Central)' },
  { id: 22, label: 'RED — Gateway City Redbirds (NL Central)' },
  { id: 23, label: 'CIN — Blue Grass City Reds (NL Central)' },
  { id: 24, label: 'AST — Bayou City Astros (NL Central)' },
  { id: 25, label: 'BRW — Lake Front Brewers (NL Central)' },
  { id: 26, label: 'DOD — Harbor Bay Dodgers (NL West)' },
  { id: 27, label: 'GNT — Bay City Giants (NL West)' },
  { id: 28, label: 'PAD — Harbor Lights Padres (NL West)' },
  { id: 29, label: 'ROC — Mile High City Rockies (NL West)' },
  { id: 30, label: 'DIA — Sandstone Park Diamondbacks (NL West)' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function AwardRow({ label, winner }: { label: string; winner: AwardWinner | null }) {
  if (!winner) return null;
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-gray-800 last:border-0">
      <div className="text-gray-500 text-xs w-28 shrink-0 pt-0.5">{label}</div>
      <div className="flex-1">
        <span className="text-orange-400 font-mono text-xs font-bold">{winner.name}</span>
        <span className="text-gray-500 text-xs ml-2">{winner.teamAbbr} · {winner.position} · Age {winner.age}</span>
        <div className="text-gray-400 font-mono text-xs mt-0.5">{winner.statLine}</div>
      </div>
    </div>
  );
}

function DivChamp({ champ }: { champ: DivisionChampion }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-gray-800 last:border-0">
      <div className="text-gray-500 text-xs w-24 shrink-0">{champ.league} {champ.division.toUpperCase()}</div>
      <div className="text-gray-200 text-xs font-mono font-bold flex-1 mx-2">{champ.abbreviation}</div>
      <div className="text-orange-400 font-mono text-xs tabular-nums">{champ.wins}–{champ.losses}</div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const {
    season, userTeamId, isSimulating, difficulty,
    setSeason, setSimulating, setSimProgress,
    ownerArchetype, ownerPatience, teamMorale,
    adjustOwnerPatience, adjustTeamMorale, setOwnerArchetype,
    breakoutWatch, setBreakoutWatch, incrementSeasonsManaged, seasonsManaged,
  } = useGameStore();

  const {
    setStandings, setLeaderboard, setLastSeasonStats,
    addNewsItems, rivals, setRivals, updateRivals: storeUpdateRivals,
    addSeasonSummary, setPresserAvailable, presserAvailable, presserDone, setPresserDone,
  } = useLeagueStore();

  const { setActiveTab } = useUIStore();

  const [lastResult,   setLastResult]   = useState<SeasonResult | null>(null);
  const [error,        setError]        = useState<string | null>(null);
  const [pressCtx,     setPressCtx]     = useState<PressContext | null>(null);

  // ── Set owner archetype on mount ──────────────────────────────────────────
  useEffect(() => {
    setOwnerArchetype(getOwnerArchetype(userTeamId));
  }, [userTeamId, setOwnerArchetype]);

  // ── Simulate season ────────────────────────────────────────────────────────
  const simulateSeason = useCallback(async () => {
    setError(null);
    setSimulating(true);
    setSimProgress(0);
    try {
      const engine = getEngine();
      const result = await engine.simulateSeason();
      setLastResult(result);
      setSeason(result.season + 1);
      setLastSeasonStats(result.leagueERA, result.leagueBA, result.leagueRPG);

      const [standings, hrLeaders] = await Promise.all([
        engine.getStandings(),
        engine.getLeaderboard('hr', 10),
      ]);
      setStandings(standings);
      setLeaderboard(hrLeaders);
      setSimProgress(1);

      // ── Narrative ──────────────────────────────────────────────────────────
      const userTeamSeason = result.teamSeasons.find(ts => ts.teamId === userTeamId);
      const userWins       = userTeamSeason?.record.wins ?? 81;
      const userLosses     = userTeamSeason?.record.losses ?? 81;
      const isPlayoff      = !!userTeamSeason?.playoffRound;
      const isChampion     = userTeamSeason?.playoffRound === 'Champion';

      const breakoutsLeague = (result.developmentEvents ?? []).filter(e => e.type === 'breakout').length;
      const breakoutsProxy  = Math.round(breakoutsLeague / 10);

      if (userTeamSeason) {
        // Owner patience
        adjustOwnerPatience(calcOwnerPatienceDelta(
          ownerArchetype, userTeamSeason, isPlayoff, isChampion, difficulty, breakoutsProxy,
        ));
        // Team morale
        const retirements = (result.developmentEvents ?? []).filter(e => e.type === 'retirement').length;
        const breakouts   = (result.developmentEvents ?? []).filter(e => e.type === 'breakout').length;
        const busts       = (result.developmentEvents ?? []).filter(e => e.type === 'bust').length;
        adjustTeamMorale(calcMoraleDelta(userWins, isPlayoff, isChampion, breakouts, retirements, busts));
      }

      // Resolve breakout watch
      let breakoutHits = 0, breakoutBusts = 0;
      if (breakoutWatch.length > 0) {
        try {
          const roster   = await engine.getRoster(userTeamId);
          const allPlayers = [...roster.active, ...roster.minors, ...roster.il];
          const resolved  = resolveBreakoutWatch(breakoutWatch, allPlayers);
          breakoutHits  = resolved.filter(c => c.hit === true).length;
          breakoutBusts = resolved.filter(c => c.hit === false).length;
          setBreakoutWatch(resolved);
        } catch { /* non-fatal */ }
      }

      // Rivals — init on first season, update after
      if (rivals.length === 0 && standings.standings) {
        const newRivals = initRivals(userTeamId, standings.standings);
        setRivals(newRivals);
      } else if (standings.standings) {
        const updated = updateRivals(rivals, standings.standings, userTeamId, isPlayoff);
        storeUpdateRivals(updated);
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
        awardsWon:        [],
        breakoutHits,
        ownerPatienceEnd: ownerPatience,
        teamMoraleEnd:    teamMorale,
        leagueERA:        result.leagueERA,
        leagueBA:         result.leagueBA,
        keyMoment:        '',
      };
      summary.keyMoment = generateKeyMoment(summary);
      addSeasonSummary(summary);

      // Season count
      incrementSeasonsManaged();

      // Queue presser
      setPressCtx({
        wins:           userWins,
        losses:         userLosses,
        isPlayoff,
        isChampion,
        ownerArchetype,
        breakoutHits,
        breakoutBusts,
        season:         result.season,
        seasonsManaged: seasonsManaged + 1,
      });
      setPresserAvailable(true);
      setPresserDone(false);

    } catch (e) {
      setError(String(e));
    } finally {
      setSimulating(false);
    }
  }, [
    userTeamId, difficulty, ownerArchetype, ownerPatience, teamMorale,
    breakoutWatch, rivals, seasonsManaged,
    setSeason, setSimulating, setSimProgress,
    setStandings, setLeaderboard, setLastSeasonStats,
    adjustOwnerPatience, adjustTeamMorale,
    setBreakoutWatch, setRivals, storeUpdateRivals, addNewsItems,
    addSeasonSummary, incrementSeasonsManaged, setPresserAvailable, setPresserDone,
  ]);

  // ── Breakout watch at start of season ─────────────────────────────────────
  const refreshBreakoutWatch = useCallback(async () => {
    if (breakoutWatch.length > 0 && breakoutWatch.some(c => c.hit === null)) return;
    try {
      const engine     = getEngine();
      const roster     = await engine.getRoster(userTeamId);
      const allPlayers = [...roster.active, ...roster.minors, ...roster.il];
      setBreakoutWatch(generateBreakoutWatch(allPlayers));
    } catch { /* non-fatal */ }
  }, [userTeamId, breakoutWatch, setBreakoutWatch]);

  const completedSeason = lastResult ? lastResult.season : null;
  const showPresser = presserAvailable && !presserDone && pressCtx !== null;

  return (
    <div className="p-4 space-y-4">

      {/* ── Press Conference modal ───────────────────────────────────────────── */}
      {showPresser && pressCtx && (
        <PressConference
          context={pressCtx}
          onClose={() => setPresserAvailable(false)}
        />
      )}

      {/* ── Control row ──────────────────────────────────────────────────────── */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="bloomberg-border bg-gray-900 px-4 py-2 flex-1 min-w-48">
          <div className="text-gray-500 text-xs">FRANCHISE</div>
          <div className="text-orange-400 font-bold text-xs truncate">
            {TEAM_OPTIONS.find(t => t.id === userTeamId)?.label ?? '---'}
          </div>
        </div>
        <div className="bloomberg-border bg-gray-900 px-4 py-2">
          <div className="text-gray-500 text-xs">SEASON</div>
          <div className="text-gray-200 font-bold tabular-nums">{season}</div>
        </div>
        <button
          onClick={simulateSeason}
          disabled={isSimulating}
          className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold text-xs px-6 py-2 uppercase tracking-widest transition-colors"
        >
          {isSimulating ? 'SIMULATING…' : `⚾ SIM ${season} SEASON`}
        </button>

        {/* Presser re-open button if done */}
        {presserAvailable && presserDone && pressCtx && (
          <button
            onClick={() => setPresserDone(false)}
            className="border border-orange-800 hover:border-orange-500 text-orange-700 hover:text-orange-400 text-xs px-3 py-2 uppercase tracking-wider transition-colors"
          >
            🎤 PRESSER
          </button>
        )}

        <button onClick={() => setActiveTab('standings')}
          className="border border-gray-700 hover:border-orange-500 text-gray-400 hover:text-orange-400 text-xs px-4 py-2 uppercase tracking-wider transition-colors">
          STANDINGS
        </button>
        <button onClick={() => setActiveTab('roster')}
          className="border border-gray-700 hover:border-orange-500 text-gray-400 hover:text-orange-400 text-xs px-4 py-2 uppercase tracking-wider transition-colors">
          ROSTER
        </button>
      </div>

      {error && (
        <div className="bloomberg-border bg-red-950 px-4 py-2 text-red-400 text-xs">{error}</div>
      )}

      {/* ── Owner Patience + Team Morale ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <OwnerPatiencePanel />
        <MoralePanel />
      </div>

      {/* ── Pre-sim state ─────────────────────────────────────────────────────── */}
      {!lastResult && (
        <div className="bloomberg-border bg-gray-900 p-6 text-center space-y-3">
          <div className="text-gray-400 text-sm font-bold">READY FOR OPENING DAY {season}</div>
          <div className="text-gray-600 text-xs">Click "SIM {season} SEASON" to run all 2,430 games</div>
          <div className="text-gray-700 text-xs">
            Log5 · 25-state Markov · 3-stage PA engine · SDE aging · ~3,700 players
          </div>
          <button
            onClick={refreshBreakoutWatch}
            className="mx-auto block border border-orange-800 hover:border-orange-500 text-orange-700 hover:text-orange-400 text-xs px-4 py-1.5 uppercase tracking-wider transition-colors"
          >
            🔍 Generate Breakout Watch
          </button>
        </div>
      )}

      {/* ── Breakout Watch ────────────────────────────────────────────────────── */}
      <BreakoutWatchPanel />

      {/* ── Season Report ─────────────────────────────────────────────────────── */}
      {lastResult && (
        <div className="space-y-4">
          <div className="bloomberg-border bg-gray-900 px-4 py-2">
            <div className="text-orange-500 font-bold text-xs tracking-widest">
              {completedSeason} SEASON COMPLETE — OFFSEASON REPORT
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'LEAGUE BA',  value: lastResult.leagueBA.toFixed(3),  sub: 'Batting average' },
              { label: 'LEAGUE ERA', value: lastResult.leagueERA.toFixed(2), sub: 'Earned run avg' },
              { label: 'RUNS/GAME',  value: lastResult.leagueRPG.toFixed(2), sub: 'Per team' },
              { label: 'WINS SD',    value: lastResult.teamWinsSD.toFixed(1), sub: 'Parity' },
            ].map(stat => (
              <div key={stat.label} className="bloomberg-border bg-gray-900 px-4 py-3">
                <div className="text-gray-500 text-xs">{stat.label}</div>
                <div className="text-orange-400 font-bold text-lg tabular-nums">{stat.value}</div>
                <div className="text-gray-600 text-xs">{stat.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {lastResult.divisionChampions && lastResult.divisionChampions.length > 0 && (
              <div className="bloomberg-border bg-gray-900">
                <div className="bloomberg-header px-4">DIVISION CHAMPIONS</div>
                <div className="px-4 py-2">
                  {lastResult.divisionChampions.map(champ => (
                    <DivChamp key={`${champ.league}-${champ.division}`} champ={champ} />
                  ))}
                </div>
              </div>
            )}
            {lastResult.awards && (
              <div className="bloomberg-border bg-gray-900">
                <div className="bloomberg-header px-4">AWARDS</div>
                <div className="px-4 py-2">
                  <AwardRow label="AL MVP"      winner={lastResult.awards.mvpAL} />
                  <AwardRow label="NL MVP"      winner={lastResult.awards.mvpNL} />
                  <AwardRow label="AL CY YOUNG" winner={lastResult.awards.cyYoungAL} />
                  <AwardRow label="NL CY YOUNG" winner={lastResult.awards.cyYoungNL} />
                  <AwardRow label="AL ROY"      winner={lastResult.awards.royAL} />
                  <AwardRow label="NL ROY"      winner={lastResult.awards.royNL} />
                </div>
              </div>
            )}
          </div>

          {lastResult.developmentEvents && lastResult.developmentEvents.length > 0 && (
            <div className="bloomberg-border bg-gray-900">
              <div className="bloomberg-header px-4">OFFSEASON DEVELOPMENT</div>
              <div className="px-4 py-3 grid grid-cols-2 gap-x-8">
                <div>
                  <div className="text-green-500 text-xs font-bold mb-1.5">▲ BREAKOUTS</div>
                  {lastResult.developmentEvents.filter(e => e.type === 'breakout').slice(0, 8).map(e => (
                    <div key={e.playerId} className="flex justify-between py-0.5 border-b border-gray-800 last:border-0">
                      <span className="text-gray-300 font-mono text-xs">{e.playerName}</span>
                      <span className="text-green-400 font-mono text-xs tabular-nums">+{e.overallDelta}</span>
                    </div>
                  ))}
                  {lastResult.developmentEvents.filter(e => e.type === 'breakout').length === 0 && (
                    <div className="text-gray-600 text-xs">No major breakouts</div>
                  )}
                </div>
                <div>
                  {lastResult.developmentEvents.filter(e => e.type === 'bust').length > 0 && (<>
                    <div className="text-red-500 text-xs font-bold mb-1.5">▼ DECLINES</div>
                    {lastResult.developmentEvents.filter(e => e.type === 'bust').slice(0, 5).map(e => (
                      <div key={e.playerId} className="flex justify-between py-0.5 border-b border-gray-800 last:border-0">
                        <span className="text-gray-300 font-mono text-xs">{e.playerName}</span>
                        <span className="text-red-400 font-mono text-xs tabular-nums">{e.overallDelta}</span>
                      </div>
                    ))}
                  </>)}
                  {lastResult.developmentEvents.filter(e => e.type === 'retirement').length > 0 && (<>
                    <div className="text-gray-500 text-xs font-bold mb-1 mt-3">◼ RETIREMENTS</div>
                    {lastResult.developmentEvents.filter(e => e.type === 'retirement').slice(0, 6).map(e => (
                      <div key={e.playerId} className="py-0.5 border-b border-gray-800 last:border-0">
                        <span className="text-gray-500 font-mono text-xs">{e.playerName}</span>
                      </div>
                    ))}
                  </>)}
                </div>
              </div>
              <div className="px-4 py-2 border-t border-gray-800 flex gap-6 text-xs text-gray-500">
                <span><span className="text-green-400 font-bold">{lastResult.developmentEvents.filter(e => e.type === 'breakout').length}</span> breakouts</span>
                <span><span className="text-red-400 font-bold">{lastResult.developmentEvents.filter(e => e.type === 'bust').length}</span> declines</span>
                <span><span className="text-gray-400 font-bold">{lastResult.developmentEvents.filter(e => e.type === 'retirement').length}</span> retirements</span>
              </div>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <button onClick={() => setActiveTab('standings')}
              className="border border-orange-700 hover:border-orange-500 text-orange-600 hover:text-orange-400 text-xs px-4 py-1.5 uppercase tracking-wider transition-colors">
              FINAL STANDINGS →
            </button>
            <button onClick={() => setActiveTab('stats')}
              className="border border-gray-700 hover:border-orange-500 text-gray-500 hover:text-orange-400 text-xs px-4 py-1.5 uppercase tracking-wider transition-colors">
              LEADERBOARDS →
            </button>
            <button onClick={() => setActiveTab('roster')}
              className="border border-gray-700 hover:border-orange-500 text-gray-500 hover:text-orange-400 text-xs px-4 py-1.5 uppercase tracking-wider transition-colors">
              YOUR ROSTER →
            </button>
          </div>
        </div>
      )}

      {/* ── Rivalry Panel ─────────────────────────────────────────────────────── */}
      <RivalryPanel />

      {/* ── Legacy Timeline ───────────────────────────────────────────────────── */}
      <LegacyTimeline />

      {/* ── News Feed ─────────────────────────────────────────────────────────── */}
      <NewsFeedPanel />

    </div>
  );
}

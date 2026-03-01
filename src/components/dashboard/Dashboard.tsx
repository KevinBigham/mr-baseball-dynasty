/**
 * Dashboard.tsx — thin coordinator that delegates to phase sub-components.
 * Season simulation logic lives in useSeasonSimulation hook.
 * Offseason flow lives in useOffseasonFlow hook.
 */

import { lazy, Suspense, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import { useUIStore } from '../../store/uiStore';
import { useSeasonSimulation } from '../../hooks/useSeasonSimulation';
import { useOffseasonFlow } from '../../hooks/useOffseasonFlow';
import { getOwnerArchetype } from '../../engine/narrative';
import { generatePreseasonPredictions } from '../../engine/predictions';
import { detectArcType } from '../../engine/storyboard';
import { generateSeasonArc } from '../../engine/storyboard';
import { getTeamLabel } from '../../data/teamOptions';
import {
  OwnerPatiencePanel, MoralePanel, BreakoutWatchPanel, NewsFeedPanel,
} from './FranchisePanel';
import PressConference from './PressConference';
import StaffPoachModal from './StaffPoachModal';
import RivalryPanel from './RivalryPanel';
import LegacyTimeline from './LegacyTimeline';
import ReputationCard from './ReputationCard';
import StoryboardPanel from './StoryboardPanel';
import MomentsPanel from './MomentsPanel';
import WeeklyCard from './WeeklyCard';
import MFSNPanel from './MFSNPanel';
import LoadingFallback from '../layout/LoadingFallback';
import AllStarBreak from './AllStarBreak';
import MidSeasonCheckIn from './MidSeasonCheckIn';
import TradeDeadline from './TradeDeadline';

const PreseasonDashboard = lazy(() => import('./PreseasonDashboard'));
const PostseasonReport   = lazy(() => import('./PostseasonReport'));
const OffseasonDashboard = lazy(() => import('./OffseasonDashboard'));

export default function Dashboard() {
  const {
    season, userTeamId, isSimulating, simProgress, gamePhase, seasonPhase,
    setOwnerArchetype, ownerPatience, seasonsManaged,
    adjustOwnerPatience, adjustTeamMorale, setGamePhase, setSeasonPhase,
  } = useGameStore();

  const {
    setPresserAvailable, presserAvailable, presserDone, setPresserDone,
    mfsnReport, setMFSNReport,
    poachEvent, resolvePoachEvent,
    standings: currentStandings,
    moments, weeklyStories,
    franchiseHistory,
  } = useLeagueStore();

  const { setActiveTab } = useUIStore();

  const sim = useSeasonSimulation();
  const offseason = useOffseasonFlow(sim.clearSimState);

  // Set owner archetype on mount
  useEffect(() => {
    setOwnerArchetype(getOwnerArchetype(userTeamId));
  }, [userTeamId, setOwnerArchetype]);

  // Generate MFSN pre-season predictions
  useEffect(() => {
    if (!mfsnReport || mfsnReport.season !== season) {
      const lastStandings = currentStandings?.standings ?? null;
      setMFSNReport(generatePreseasonPredictions(lastStandings, userTeamId, season));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season, userTeamId]);

  const showPresser = presserAvailable && !presserDone && sim.pressCtx !== null;

  return (
    <div className="p-4 space-y-4">

      {/* ── Press Conference modal ─────────────────────────────────── */}
      {showPresser && sim.pressCtx && (
        <PressConference
          context={sim.pressCtx}
          onClose={() => {
            setPresserAvailable(false);
            // Check for firing after press conference
            const currentPatience = useGameStore.getState().ownerPatience;
            if (currentPatience <= 0) {
              setGamePhase('fired');
            }
          }}
          arcType={detectArcType(franchiseHistory, ownerPatience, seasonsManaged)}
        />
      )}

      {/* ── Staff Poaching modal ───────────────────────────────────── */}
      {poachEvent && !poachEvent.resolved && (
        <StaffPoachModal
          event={poachEvent}
          onLetGo={() => {
            resolvePoachEvent('let_go');
            adjustTeamMorale(-5);
            adjustOwnerPatience(2);
          }}
          onBlock={() => {
            resolvePoachEvent('block');
            adjustTeamMorale(3);
            adjustOwnerPatience(-4);
          }}
        />
      )}

      {/* ── Control row ───────────────────────────────────────────── */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="bloomberg-border bg-gray-900 px-4 py-2 flex-1 min-w-48">
          <div className="text-gray-500 text-xs">FRANCHISE</div>
          <div className="text-orange-400 font-bold text-xs truncate">
            {getTeamLabel(userTeamId)}
          </div>
        </div>
        <div className="bloomberg-border bg-gray-900 px-4 py-2">
          <div className="text-gray-500 text-xs">SEASON</div>
          <div className="text-gray-200 font-bold tabular-nums">{season}</div>
        </div>
        {ownerPatience <= 15 && ownerPatience > 0 && (
          <div className="bloomberg-border bg-red-950/50 border-red-800 px-4 py-2 animate-pulse">
            <div className="text-red-500 font-bold text-xs tracking-widest">HOT SEAT</div>
            <div className="text-red-400 text-xs">Patience: {ownerPatience}%</div>
          </div>
        )}
        <button
          onClick={sim.simulateSeason}
          disabled={isSimulating}
          className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold text-xs px-6 py-2 uppercase tracking-widest transition-colors"
        >
          {isSimulating ? 'SIMULATING…' : `⚾ SIM ${season} SEASON`}
        </button>

        {isSimulating && (
          <div className="text-gray-500 text-xs italic px-2 animate-pulse min-w-[180px]">
            {simProgress < 0.10 ? 'Spring Training — camp battles underway...' :
             simProgress < 0.25 ? 'April — Opening Day, a new season begins.' :
             simProgress < 0.50 ? 'June — All-Star break approaches...' :
             simProgress < 0.70 ? 'August — dog days, trade deadline passed...' :
             simProgress < 0.90 ? 'September — pennant race heating up...' :
             'Computing final results...'}
          </div>
        )}

        {presserAvailable && presserDone && sim.pressCtx && (
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

      {sim.error && (
        <div className="bloomberg-border bg-red-950 px-4 py-2 text-red-400 text-xs">{sim.error}</div>
      )}

      {/* ── Quick Actions ─────────────────────────────────────────── */}
      {!isSimulating && (
        <div className="flex gap-2 flex-wrap">
          {(gamePhase === 'preseason' ? [
            { label: 'VIEW ROSTER', tab: 'roster' as const },
            { label: 'STANDINGS', tab: 'standings' as const },
            { label: 'FINANCES', tab: 'finance' as const },
            { label: 'HISTORY', tab: 'history' as const },
          ] : gamePhase === 'postseason' ? [
            { label: 'STANDINGS', tab: 'standings' as const },
            { label: 'LEADERBOARDS', tab: 'stats' as const },
            { label: 'YOUR ROSTER', tab: 'roster' as const },
            { label: 'HISTORY', tab: 'history' as const },
          ] : [
            { label: 'ROSTER', tab: 'roster' as const },
            { label: 'FINANCES', tab: 'finance' as const },
            { label: 'STANDINGS', tab: 'standings' as const },
          ]).map(a => (
            <button
              key={a.label}
              onClick={() => setActiveTab(a.tab)}
              className="border border-gray-800 hover:border-gray-600 text-gray-600 hover:text-gray-400 text-[10px] px-3 py-1 uppercase tracking-wider transition-colors"
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Owner Patience + Team Morale ──────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <OwnerPatiencePanel />
        <MoralePanel />
      </div>

      {/* ── Phase-specific content (lazy-loaded) ─────────────────── */}
      <Suspense fallback={<LoadingFallback />}>
        {/* Preseason */}
        {!sim.lastResult && gamePhase === 'preseason' && (
          <PreseasonDashboard onRefreshBreakoutWatch={sim.refreshBreakoutWatch} />
        )}

        {/* Mid-season events + Postseason report */}
        {sim.lastResult && seasonPhase === 'allstar' && (
          <>
            <MidSeasonCheckIn
              result={sim.lastResult}
              userTeamId={userTeamId}
              seasonPhase={seasonPhase}
              ownerPatience={ownerPatience}
              onContinue={() => setSeasonPhase('deadline')}
            />
            <AllStarBreak
              result={sim.lastResult}
              season={sim.lastResult.season}
              onContinue={() => setSeasonPhase('deadline')}
            />
          </>
        )}

        {sim.lastResult && seasonPhase === 'deadline' && (
          <TradeDeadline
            userTeamId={userTeamId}
            season={sim.lastResult.season}
            userWins={sim.lastResult.teamSeasons.find(ts => ts.teamId === userTeamId)?.record.wins ?? 0}
            userLosses={sim.lastResult.teamSeasons.find(ts => ts.teamId === userTeamId)?.record.losses ?? 0}
            onContinue={() => setSeasonPhase('complete')}
          />
        )}

        {sim.lastResult && seasonPhase === 'complete' && (
          <PostseasonReport
            lastResult={sim.lastResult}
            lastBreakouts={sim.lastBreakouts}
            lastBusts={sim.lastBusts}
            playoffBracket={sim.playoffBracket}
            awardRaceData={sim.awardRaceData}
            onEnterOffseason={offseason.enterOffseason}
          />
        )}

        {/* Offseason */}
        {gamePhase === 'offseason' && (
          <OffseasonDashboard
            showSummary={offseason.showOffseasonSummary}
            offseasonTxLog={offseason.offseasonTxLog}
            aiSigningDetails={offseason.aiSigningDetails}
            onAdvance={offseason.advanceOffseason}
            onFinish={offseason.finishOffseason}
            onTransaction={offseason.logOffseasonTx}
          />
        )}
      </Suspense>

      {/* ── Breakout Watch ────────────────────────────────────────── */}
      <BreakoutWatchPanel />

      {/* ── Post-sim Storyboard arc resolution ────────────────────── */}
      {sim.lastResult && (
        <StoryboardPanel
          arc={generateSeasonArc(
            franchiseHistory, ownerPatience, seasonsManaged, season - 1, 'post',
            sim.postSimArcWins, sim.postSimArcPO, sim.postSimArcChamp,
          )}
          phase="post"
        />
      )}

      {/* ── This Week in MRBD ────────────────────────────────────── */}
      {weeklyStories.length > 0 && (
        <WeeklyCard stories={weeklyStories} season={sim.lastResult?.season ?? season - 1} />
      )}

      {/* ── MFSN Resolved Predictions ────────────────────────────── */}
      {mfsnReport && mfsnReport.resolved && (
        <MFSNPanel report={mfsnReport} userTeamId={userTeamId} />
      )}

      {/* ── Always-visible panels ────────────────────────────────── */}
      <RivalryPanel />
      <ReputationCard />
      <LegacyTimeline />
      <MomentsPanel moments={moments} />
      <NewsFeedPanel />
    </div>
  );
}

/**
 * FrontOfficeBriefing.tsx — Main briefing surface for the Home screen.
 * Orchestrates dials, story threads, league pressure, and action queue.
 * Pure prop-driven — reads from stores, never mutates game state.
 *
 * Card logic guarantees: always surfaces one urgent problem (or "all clear"),
 * one open mystery, one long arc, and one recommended next action via the queue.
 */

import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import { useUIStore, type NavTab } from '../../store/uiStore';
import { buildDials, buildStoryThreads, buildActionQueue } from '../../utils/briefingAdapter';
import { getTeamName } from '../../data/teamOptions';
import BriefingHeader from './BriefingHeader';
import UrgentProblemCard from './UrgentProblemCard';
import OpenMysteryCard from './OpenMysteryCard';
import LongArcCard from './LongArcCard';
import LeaguePressureStrip from './LeaguePressureStrip';
import ActionQueuePanel from './ActionQueuePanel';

export default function FrontOfficeBriefing() {
  const {
    season, userTeamId, ownerPatience, ownerArchetype, teamMorale,
    gamePhase, seasonPhase, seasonsManaged,
  } = useGameStore();

  const { standings, roster, franchiseHistory, teamChemistry, clubhouseEvents } = useLeagueStore();
  const { setActiveTab } = useUIStore();

  const standingsRows = standings?.standings ?? null;

  // Derive team scouting quality — default 0.6 if not available
  const scoutingQuality = 0.6;

  const dials = useMemo(() => buildDials({
    ownerPatience, teamMorale, teamChemistry, clubhouseEvents, scoutingQuality, roster, standings: standingsRows,
    userTeamId, gamePhase,
  }), [ownerPatience, teamMorale, teamChemistry, clubhouseEvents, scoutingQuality, roster, standingsRows, userTeamId, gamePhase]);

  const threads = useMemo(() => buildStoryThreads({
    ownerPatience, teamMorale, teamChemistry, clubhouseEvents, ownerArchetype, roster, standings: standingsRows,
    userTeamId, gamePhase, seasonPhase, seasonsManaged, franchiseHistory,
  }), [ownerPatience, teamMorale, teamChemistry, clubhouseEvents, ownerArchetype, roster, standingsRows, userTeamId, gamePhase, seasonPhase, seasonsManaged, franchiseHistory]);

  const actions = useMemo(() => buildActionQueue({
    roster, ownerPatience, gamePhase, seasonPhase, teamMorale, teamChemistry, clubhouseEvents,
  }), [roster, ownerPatience, gamePhase, seasonPhase, teamMorale, teamChemistry, clubhouseEvents]);

  const teamName = getTeamName(userTeamId);

  const handleNavigate = (tab: NavTab) => setActiveTab(tab);

  // Count how many thread cards we have
  const threadCards = [threads.urgent, threads.mystery, threads.longArc].filter(Boolean);
  const gridCols = threadCards.length === 3 ? 'md:grid-cols-3'
    : threadCards.length === 2 ? 'md:grid-cols-2'
    : 'md:grid-cols-1';

  return (
    <div className="space-y-3">
      {/* Top-line dials */}
      <BriefingHeader dials={dials} season={season} teamName={teamName} />

      {/* Story threads — responsive grid */}
      {threadCards.length > 0 ? (
        <div className={`grid grid-cols-1 ${gridCols} gap-3`}>
          {threads.urgent ? (
            <UrgentProblemCard thread={threads.urgent} onNavigate={handleNavigate} />
          ) : (
            <div className="bloomberg-border bg-gray-900 px-3 py-4 flex items-center gap-2">
              <span className="text-green-500 text-sm">●</span>
              <div>
                <div className="text-green-400 text-xs font-bold uppercase tracking-wider">ALL CLEAR</div>
                <div className="text-gray-500 text-[10px]">No urgent issues detected. Focus on long-term strategy.</div>
              </div>
            </div>
          )}
          {threads.mystery && (
            <OpenMysteryCard thread={threads.mystery} onNavigate={handleNavigate} />
          )}
          {threads.longArc && (
            <LongArcCard thread={threads.longArc} onNavigate={handleNavigate} />
          )}
        </div>
      ) : null}

      {/* League pressure + Action queue side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <LeaguePressureStrip standings={standingsRows} userTeamId={userTeamId} />
        <ActionQueuePanel tasks={actions} onNavigate={handleNavigate} />
      </div>
    </div>
  );
}

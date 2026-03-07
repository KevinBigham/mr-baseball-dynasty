/**
 * FrontOfficeBriefing.tsx — Main briefing surface for the Home screen.
 * Orchestrates dials, story threads, league pressure, and action queue.
 * Pure prop-driven — reads from stores, never mutates game state.
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

  const { standings, roster, franchiseHistory } = useLeagueStore();
  const { setActiveTab } = useUIStore();

  const standingsRows = standings?.standings ?? null;

  // Derive team scouting quality — default 0.6 if not available
  const scoutingQuality = 0.6;

  const dials = useMemo(() => buildDials({
    ownerPatience, teamMorale, scoutingQuality, roster, standings: standingsRows,
    userTeamId, gamePhase,
  }), [ownerPatience, teamMorale, scoutingQuality, roster, standingsRows, userTeamId, gamePhase]);

  const threads = useMemo(() => buildStoryThreads({
    ownerPatience, teamMorale, ownerArchetype, roster, standings: standingsRows,
    userTeamId, gamePhase, seasonPhase, seasonsManaged, franchiseHistory,
  }), [ownerPatience, teamMorale, ownerArchetype, roster, standingsRows, userTeamId, gamePhase, seasonPhase, seasonsManaged, franchiseHistory]);

  const actions = useMemo(() => buildActionQueue({
    roster, ownerPatience, gamePhase, seasonPhase, teamMorale,
  }), [roster, ownerPatience, gamePhase, seasonPhase, teamMorale]);

  const teamName = getTeamName(userTeamId);

  const handleNavigate = (tab: NavTab) => setActiveTab(tab);

  return (
    <div className="space-y-3">
      {/* Top-line dials */}
      <BriefingHeader dials={dials} season={season} teamName={teamName} />

      {/* Story threads — 3-column grid on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {threads.urgent && (
          <UrgentProblemCard thread={threads.urgent} onNavigate={handleNavigate} />
        )}
        {threads.mystery && (
          <OpenMysteryCard thread={threads.mystery} onNavigate={handleNavigate} />
        )}
        {threads.longArc && (
          <LongArcCard thread={threads.longArc} onNavigate={handleNavigate} />
        )}
      </div>

      {/* League pressure + Action queue side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <LeaguePressureStrip standings={standingsRows} userTeamId={userTeamId} />
        {actions.length > 0 && (
          <ActionQueuePanel tasks={actions} onNavigate={handleNavigate} />
        )}
      </div>
    </div>
  );
}

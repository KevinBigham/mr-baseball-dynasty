/**
 * PreseasonDashboard — pre-sim view (storyboard, preseason panel, MFSN, opening day card)
 */

import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import { generateSeasonArc } from '../../engine/storyboard';
import StoryboardPanel from './StoryboardPanel';
import PreseasonPanel from './PreseasonPanel';
import MFSNPanel from './MFSNPanel';

interface Props {
  onRefreshBreakoutWatch: () => void;
}

export default function PreseasonDashboard({ onRefreshBreakoutWatch }: Props) {
  const { season, userTeamId, ownerPatience, seasonsManaged } = useGameStore();
  const { mfsnReport, franchiseHistory } = useLeagueStore();

  return (
    <div className="space-y-3">
      <StoryboardPanel
        arc={generateSeasonArc(
          franchiseHistory, ownerPatience, seasonsManaged, season, 'pre',
        )}
        phase="pre"
      />

      <PreseasonPanel />

      <div className="bloomberg-border bg-gray-900 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-gray-400 text-sm font-bold">READY FOR OPENING DAY {season}</div>
          <div className="text-gray-600 text-xs">
            Log5 · 25-state Markov · 3-stage PA engine · SDE aging · ~3,700 players
          </div>
        </div>
        <button
          onClick={onRefreshBreakoutWatch}
          className="border border-orange-800 hover:border-orange-500 text-orange-700 hover:text-orange-400 text-xs px-4 py-1.5 uppercase tracking-wider transition-colors shrink-0"
        >
          🔍 Breakout Watch
        </button>
      </div>

      {mfsnReport && !mfsnReport.resolved && (
        <MFSNPanel report={mfsnReport} userTeamId={userTeamId} />
      )}
    </div>
  );
}

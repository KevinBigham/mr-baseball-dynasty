/**
 * AITransactionsPanel — Shows AI roster moves that occurred during the season.
 * Grouped by team, color-coded by move type.
 */

import type { AIRosterMove } from '../../engine/aiRosterManager';
import { formatOVR } from '../../utils/format';

interface Props {
  moves: AIRosterMove[];
}

const TYPE_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  call_up: { label: 'CALL-UP',  color: '#4ade80', bg: 'rgba(74,222,128,0.06)' },
  option:  { label: 'OPTIONED', color: '#fbbf24', bg: 'rgba(251,191,36,0.06)' },
  dfa:     { label: 'DFA',      color: '#ef4444', bg: 'rgba(239,68,68,0.06)' },
  swap:    { label: 'SWAP',     color: '#60a5fa', bg: 'rgba(96,165,250,0.06)' },
};

export default function AITransactionsPanel({ moves }: Props) {
  if (moves.length === 0) {
    return (
      <div className="bloomberg-border bg-gray-900">
        <div className="bloomberg-header px-4">MID-SEASON TRANSACTIONS</div>
        <div className="p-6 text-gray-600 text-xs text-center">
          No AI roster moves this season.
        </div>
      </div>
    );
  }

  // Group by team
  const byTeam = new Map<string, AIRosterMove[]>();
  for (const m of moves) {
    const key = m.teamAbbr;
    if (!byTeam.has(key)) byTeam.set(key, []);
    byTeam.get(key)!.push(m);
  }

  // Sort teams by number of moves (most active first)
  const sortedTeams = Array.from(byTeam.entries())
    .sort((a, b) => b[1].length - a[1].length);

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>MID-SEASON TRANSACTIONS</span>
        <span className="text-gray-500 font-normal text-xs">{moves.length} moves</span>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {sortedTeams.map(([abbr, teamMoves]) => (
          <div key={abbr} className="border-b border-gray-800 last:border-0">
            <div className="px-4 py-1.5 bg-gray-950/50 flex items-center justify-between">
              <span className="text-orange-400 font-mono text-xs font-bold">{abbr}</span>
              <span className="text-gray-600 text-xs">{teamMoves.length} move{teamMoves.length !== 1 ? 's' : ''}</span>
            </div>
            {teamMoves.map((m, i) => {
              const style = TYPE_STYLE[m.type] ?? TYPE_STYLE.call_up;
              return (
                <div
                  key={`${m.playerId}-${i}`}
                  className="px-4 py-1.5 flex items-center gap-2 text-xs border-b border-gray-800/50 last:border-0"
                  style={{ background: style.bg }}
                >
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                    style={{ color: style.color, border: `1px solid ${style.color}30` }}
                  >
                    {style.label}
                  </span>
                  <span className="text-gray-300 font-mono">
                    {m.playerName}
                  </span>
                  <span className="text-gray-600">
                    {m.playerPosition} · OVR {formatOVR(m.playerOvr)}
                  </span>
                  <span className="text-gray-500 ml-auto text-right max-w-[200px] truncate">
                    {m.reason}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

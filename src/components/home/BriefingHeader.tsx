/**
 * BriefingHeader.tsx — Top-line dials strip for the Front Office Briefing.
 * Displays five key franchise health indicators in Bloomberg terminal style.
 * Each dial shows its signal source (real/heuristic/unavailable) for honesty.
 */

import type { BriefingDial } from '../../types/briefing';

interface Props {
  dials: BriefingDial[];
  season: number;
  teamName: string;
}

const SOURCE_BADGE: Record<string, { label: string; color: string; title: string }> = {
  real:        { label: 'LIVE', color: '#4ade80', title: 'Based on actual game data' },
  heuristic:   { label: 'EST',  color: '#fbbf24', title: 'Estimated — based on limited signals' },
  unavailable: { label: 'N/A',  color: '#6b7280', title: 'Not enough data yet' },
};

function DialMeter({ dial }: { dial: BriefingDial }) {
  const badge = SOURCE_BADGE[dial.source] ?? SOURCE_BADGE.unavailable;

  return (
    <div className="bloomberg-border bg-gray-900 px-3 py-2 flex-1 min-w-[140px]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-500 text-[10px] uppercase tracking-wider">{dial.label}</span>
        <div className="flex items-center gap-1.5">
          <span
            className="text-[8px] font-bold tracking-widest px-1 py-0.5 rounded"
            style={{ color: badge.color, backgroundColor: badge.color + '15', border: `1px solid ${badge.color}30` }}
            title={dial.sourceNote ?? badge.title}
          >
            {badge.label}
          </span>
          <span
            className="text-[10px] font-bold tracking-widest"
            style={{ color: dial.color }}
          >
            {dial.status}
          </span>
        </div>
      </div>
      {dial.source !== 'unavailable' ? (
        <div className="w-full h-1.5 bg-gray-800 rounded overflow-hidden mb-1">
          <div
            className="h-full rounded transition-all duration-500"
            style={{ width: `${dial.value}%`, backgroundColor: dial.color }}
          />
        </div>
      ) : (
        <div className="w-full h-1.5 bg-gray-800 rounded overflow-hidden mb-1">
          <div className="h-full rounded bg-gray-700 w-full opacity-30" />
        </div>
      )}
      <div className="text-gray-500 text-[10px] truncate">{dial.desc}</div>
    </div>
  );
}

export default function BriefingHeader({ dials, season, teamName }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-orange-500 font-bold text-xs tracking-widest uppercase">
            FRONT OFFICE BRIEFING
          </div>
          <div className="text-gray-500 text-[10px]">
            {teamName} — Season {season}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[8px] text-gray-500">
            <span className="flex items-center gap-0.5"><span style={{ color: '#4ade80' }}>●</span> Live</span>
            <span className="flex items-center gap-0.5"><span style={{ color: '#fbbf24' }}>●</span> Est.</span>
            <span className="flex items-center gap-0.5"><span style={{ color: '#6b7280' }}>●</span> N/A</span>
          </div>
          <div className="text-gray-700 text-[10px] uppercase tracking-wider">
            DAILY REPORT
          </div>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {dials.map(d => (
          <DialMeter key={d.id} dial={d} />
        ))}
      </div>
    </div>
  );
}

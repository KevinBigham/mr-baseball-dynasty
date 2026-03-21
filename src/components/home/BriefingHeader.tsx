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
    <div className="mbd-card mbd-card-body flex-1 min-w-[140px]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#64748B', fontFamily: 'Space Grotesk, sans-serif' }}>{dial.label}</span>
        <div className="flex items-center gap-1.5">
          <span
            className="mbd-badge mbd-badge-xs mbd-badge-light"
            style={{ '--mbd-badge-color': badge.color } as React.CSSProperties}
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
      <div className="mbd-progress mbd-progress-sm mb-1.5">
        {dial.source !== 'unavailable' ? (
          <div
            className="mbd-progress-bar"
            style={{ width: `${dial.value}%`, backgroundColor: dial.color }}
          />
        ) : (
          <div className="mbd-progress-bar opacity-30" style={{ width: '100%', backgroundColor: '#374151' }} />
        )}
      </div>
      <div className="text-[10px] truncate" style={{ color: '#64748B' }}>{dial.desc}</div>
    </div>
  );
}

export default function BriefingHeader({ dials, season, teamName }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs tracking-[0.15em] uppercase" style={{ color: '#f97316', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}>
            FRONT OFFICE BRIEFING
          </div>
          <div className="text-[10px]" style={{ color: '#64748B' }}>
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

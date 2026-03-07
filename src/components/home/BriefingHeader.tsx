/**
 * BriefingHeader.tsx — Top-line dials strip for the Front Office Briefing.
 * Displays five key franchise health indicators in Bloomberg terminal style.
 */

import type { BriefingDial } from '../../types/briefing';

interface Props {
  dials: BriefingDial[];
  season: number;
  teamName: string;
}

function DialMeter({ dial }: { dial: BriefingDial }) {
  return (
    <div className="bloomberg-border bg-gray-900 px-3 py-2 flex-1 min-w-[140px]">
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-500 text-[10px] uppercase tracking-wider">{dial.label}</span>
        <span
          className="text-[10px] font-bold tracking-widest"
          style={{ color: dial.color }}
        >
          {dial.status}
        </span>
      </div>
      <div className="w-full h-1.5 bg-gray-800 rounded overflow-hidden mb-1">
        <div
          className="h-full rounded transition-all duration-500"
          style={{ width: `${dial.value}%`, backgroundColor: dial.color }}
        />
      </div>
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
        <div className="text-gray-700 text-[10px] uppercase tracking-wider">
          DAILY REPORT
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

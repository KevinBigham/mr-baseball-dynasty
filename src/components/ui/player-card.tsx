/**
 * PlayerCardHero — Signature player header with Bebas Neue name,
 * position/team badges, and OVR display.
 */

import { OVRBadge } from '../roster/RosterCards';
import AgingBadge from '../shared/AgingBadge';
import { cn } from '../../lib/utils';

interface PlayerCardHeroProps {
  name: string;
  position: string;
  teamAbbr: string;
  age: number;
  bats: string;
  throws: string;
  overall: number;
  potential: number;
  className?: string;
}

export default function PlayerCardHero({
  name,
  position,
  teamAbbr,
  age,
  bats,
  throws,
  overall,
  potential,
  className,
}: PlayerCardHeroProps) {
  const potDelta = potential - overall;

  return (
    <div className={cn('bloomberg-border', className)}>
      <div className="px-5 py-4 flex items-center gap-4">
        {/* OVR circle */}
        <OVRBadge ovr={overall} size="large" />

        {/* Name + metadata */}
        <div className="flex-1 min-w-0">
          {/* Player name in brand font */}
          <h2
            className="text-2xl font-bold tracking-wide truncate"
            style={{ fontFamily: 'Bebas Neue, sans-serif', color: '#F8FAFC', letterSpacing: '0.05em' }}
          >
            {name}
          </h2>

          {/* Badges row */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Team badge */}
            <span
              className="mbd-badge mbd-badge-xs mbd-badge-light"
              style={{ '--mbd-badge-color': '#f97316' } as React.CSSProperties}
            >
              {teamAbbr}
            </span>

            {/* Position badge */}
            <span className="mbd-badge mbd-badge-xs mbd-badge-outline" style={{ color: '#38BDF8', borderColor: '#38BDF820' }}>
              {position}
            </span>

            {/* B/T */}
            <span className="text-gray-500 text-[10px]">{bats}/{throws}</span>

            {/* Age + aging badge */}
            <span className="text-gray-500 text-[10px]">AGE {age}</span>
            <AgingBadge age={age} position={position} />

            {/* Potential delta */}
            {potDelta > 0 && (
              <span className="text-green-400 text-[10px] font-bold">
                ↑ POT {Math.round(20 + (potential / 550) * 60)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

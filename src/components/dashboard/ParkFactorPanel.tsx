/**
 * ParkFactorPanel.tsx — Visual display of the user's home park factors
 *
 * Shows each park factor as a horizontal bar centered on neutral (1.00).
 * Green = hitter-friendly, red = pitcher-friendly, gray = neutral.
 * Includes elevation badge and overall park classification.
 */

import { useGameStore } from '../../store/gameStore';
import { PARK_FACTORS, type ParkFactor } from '../../data/parkFactors';
import { INITIAL_TEAMS } from '../../data/teams';

// ─── Factor bar component ────────────────────────────────────────────────────

interface FactorBarProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
}

function FactorBar({ label, value, min = 0.85, max = 1.15 }: FactorBarProps) {
  // Normalize value to 0-1 range where 0.5 = neutral (1.0)
  const range = max - min;
  const pct = Math.max(0, Math.min(1, (value - min) / range));
  const neutralPct = (1.0 - min) / range; // where 1.0 falls on the bar

  const isPositive = value > 1.005;
  const isNegative = value < 0.995;

  const color = isPositive ? '#4ade80' : isNegative ? '#f87171' : '#6b7280';
  const bgColor = isPositive ? 'rgba(74,222,128,0.15)' : isNegative ? 'rgba(248,113,113,0.15)' : 'rgba(107,114,128,0.1)';

  // Bar fill: from neutral to value position
  const barLeft = Math.min(pct, neutralPct);
  const barWidth = Math.abs(pct - neutralPct);

  return (
    <div className="flex items-center gap-3 py-1">
      <div className="text-gray-500 text-xs w-16 shrink-0 text-right">{label}</div>
      <div className="flex-1 relative h-4 bg-gray-800 rounded-sm overflow-hidden">
        {/* Neutral line */}
        <div
          className="absolute top-0 bottom-0 w-px bg-gray-600 z-10"
          style={{ left: `${neutralPct * 100}%` }}
        />
        {/* Value bar */}
        <div
          className="absolute top-0.5 bottom-0.5 rounded-sm transition-all duration-500"
          style={{
            left: `${barLeft * 100}%`,
            width: `${barWidth * 100}%`,
            background: bgColor,
            borderLeft: isNegative ? `2px solid ${color}` : 'none',
            borderRight: isPositive ? `2px solid ${color}` : 'none',
          }}
        />
      </div>
      <div
        className="font-mono text-xs tabular-nums w-10 text-right font-bold"
        style={{ color }}
      >
        {value.toFixed(2)}
      </div>
    </div>
  );
}

// ─── Park classification ──────────────────────────────────────────────────────

function classifyPark(park: ParkFactor): { label: string; color: string; desc: string } {
  // Weighted composite: HR factor matters most
  const composite = park.hrFactor * 0.45 + park.babipFactor * 0.25
    + park.doubleFactor * 0.15 + park.tripleFactor * 0.15;

  if (composite >= 1.06) return { label: 'HITTER HAVEN', color: '#4ade80', desc: 'Significantly boosts offense' };
  if (composite >= 1.02) return { label: 'HITTER FRIENDLY', color: '#86efac', desc: 'Slightly favors hitters' };
  if (composite <= 0.94) return { label: 'PITCHER FORTRESS', color: '#f87171', desc: 'Significantly suppresses offense' };
  if (composite <= 0.98) return { label: 'PITCHER FRIENDLY', color: '#fca5a5', desc: 'Slightly favors pitchers' };
  return { label: 'NEUTRAL', color: '#6b7280', desc: 'Balanced playing field' };
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function ParkFactorPanel() {
  const { userTeamId } = useGameStore();
  const team = INITIAL_TEAMS.find(t => t.teamId === userTeamId);
  if (!team) return null;

  const park = PARK_FACTORS[team.parkFactorId];
  if (!park) return null;

  const classification = classifyPark(park);

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>HOME PARK</span>
        <span
          className="text-xs font-bold tracking-wider"
          style={{ color: classification.color }}
        >
          {classification.label}
        </span>
      </div>
      <div className="px-4 py-3 space-y-3">
        {/* Park name and city */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-200 font-bold text-sm">{park.name}</div>
            <div className="text-gray-600 text-xs">{park.city}</div>
          </div>
          <div className="text-right">
            <div className="text-gray-500 text-xs">ELEVATION</div>
            <div className="font-mono text-xs tabular-nums text-gray-300">
              {park.elevation.toLocaleString()} ft
            </div>
          </div>
        </div>

        {/* Factor bars */}
        <div className="space-y-0.5">
          <FactorBar label="HR" value={park.hrFactor} />
          <FactorBar label="BABIP" value={park.babipFactor} min={0.95} max={1.05} />
          <FactorBar label="2B" value={park.doubleFactor} />
          <FactorBar label="3B" value={park.tripleFactor} />
          <FactorBar label="K" value={park.kFactor} min={0.95} max={1.05} />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-800">
          <div className="flex gap-4 text-xs">
            <span className="text-red-400">← Pitcher</span>
            <span className="text-gray-600">|</span>
            <span className="text-green-400">Hitter →</span>
          </div>
          <div className="text-gray-600 text-xs">{classification.desc}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * AgingBadge — Color-coded aging phase indicator (Rising / Prime / Aging / Declining)
 * Ported from MFD's getAgingPhase() concept. Position-adjusted peak ages.
 */

interface AgingBadgeProps {
  age: number;
  position: string;
  /** Optional compact mode — just the dot + label, no tooltip */
  compact?: boolean;
}

interface PhaseInfo {
  label: string;
  color: string;
  bg: string;
  tip: string;
}

function getPhase(age: number, position: string): PhaseInfo {
  // Position-adjusted peak ranges
  const pos = position.toUpperCase();
  const isCatcher = pos === 'C';
  const isPitcher = ['SP', 'RP', 'CL', 'P'].includes(pos);

  // Catchers peak earlier (25-29), pitchers later (26-32), hitters (26-31)
  const peakStart = isCatcher ? 25 : isPitcher ? 26 : 26;
  const peakEnd = isCatcher ? 29 : isPitcher ? 32 : 31;
  const declineStart = isCatcher ? 33 : isPitcher ? 35 : 34;

  if (age < peakStart) {
    return { label: 'RISING', color: '#4ade80', bg: 'rgba(74,222,128,0.1)', tip: `Pre-peak (peaks ~${peakStart}-${peakEnd})` };
  }
  if (age <= peakEnd) {
    return { label: 'PRIME', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', tip: `In prime years (${peakStart}-${peakEnd})` };
  }
  if (age < declineStart) {
    return { label: 'AGING', color: '#fb923c', bg: 'rgba(251,146,60,0.1)', tip: `Past peak, still productive` };
  }
  return { label: 'DECLINE', color: '#6b7280', bg: 'rgba(107,114,128,0.1)', tip: `Declining phase (${age}+)` };
}

export default function AgingBadge({ age, position, compact }: AgingBadgeProps) {
  const phase = getPhase(age, position);

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-0.5"
        title={phase.tip}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: phase.color }}
        />
        <span className="text-[8px] font-bold tracking-wider" style={{ color: phase.color }}>
          {phase.label}
        </span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider"
      style={{
        color: phase.color,
        backgroundColor: phase.bg,
        border: `1px solid ${phase.color}30`,
      }}
      title={phase.tip}
    >
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: phase.color }}
      />
      {phase.label}
    </span>
  );
}

export { getPhase };

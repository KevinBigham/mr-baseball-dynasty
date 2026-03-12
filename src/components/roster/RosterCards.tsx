/**
 * RosterCards.tsx — Shared roster card components.
 *
 * OVRBadge: Color-coded overall rating badge (20-80 scale)
 * ContractBadge: Visual indicator for contract status
 * QuickActions: Inline action buttons for roster moves
 * PlayerDetailPanel: Slide-out detail panel for selected player
 */

import { assignTraits } from '../../engine/playerTraits';
import { formatSalary } from '../../utils/format';
import type { RosterPlayer } from '../../types/league';

// ─── OVR Badge ────────────────────────────────────────────────────────────────

function getOVRColor(ovr: number): { bg: string; text: string; border: string } {
  if (ovr >= 85) return { bg: 'rgba(34,197,94,0.15)', text: '#22C55E', border: '#22C55E40' };   // Elite — green
  if (ovr >= 75) return { bg: 'rgba(56,189,248,0.15)', text: '#38BDF8', border: '#38BDF840' };   // Great — blue
  if (ovr >= 65) return { bg: 'rgba(226,232,240,0.08)', text: '#E2E8F0', border: '#E2E8F020' };  // Solid — white
  if (ovr >= 55) return { bg: 'rgba(167,179,199,0.08)', text: '#A7B3C7', border: '#A7B3C720' };  // Below avg — gray
  return { bg: 'rgba(244,63,94,0.12)', text: '#F43F5E', border: '#F43F5E30' };                   // Poor — red
}

export function OVRBadge({ ovr, size = 'normal' }: { ovr: number; size?: 'small' | 'normal' | 'large' }) {
  const colors = getOVRColor(ovr);
  const sizeClasses = size === 'large' ? 'w-12 h-12 text-lg' : size === 'small' ? 'w-7 h-7 text-[10px]' : 'w-9 h-9 text-sm';
  return (
    <div
      className={`${sizeClasses} rounded flex items-center justify-center font-bold tabular-nums shrink-0`}
      style={{ backgroundColor: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
      title={`Overall: ${ovr}`}
    >
      {ovr}
    </div>
  );
}

// ─── Potential Arrow ──────────────────────────────────────────────────────────

export function PotentialArrow({ ovr, pot }: { ovr: number; pot: number }) {
  const diff = pot - ovr;
  if (diff <= 2) return <span className="text-[9px] text-gray-700 tabular-nums">{pot}</span>;
  const color = diff >= 15 ? '#f97316' : diff >= 8 ? '#F59E0B' : '#64748B';
  return (
    <span className="text-[9px] tabular-nums" style={{ color }} title={`Potential: ${pot}`}>
      →{pot}
    </span>
  );
}

// ─── Contract Status Badge ────────────────────────────────────────────────────

export function ContractBadge({ years, salary }: { years: number; salary: number }) {
  const color = years <= 1 ? '#F43F5E' : years <= 2 ? '#F59E0B' : years >= 5 ? '#22C55E' : '#64748B';
  const label = years <= 1 ? 'EXPIRING' : `${years}YR`;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] font-bold tracking-wider" style={{ color }}>{label}</span>
      <span className="text-gray-500 text-[9px]">{formatSalary(salary)}</span>
    </div>
  );
}

// ─── Quick Action Buttons ─────────────────────────────────────────────────────

interface QuickActionProps {
  playerId: number;
  tab: string;
  onAction: (playerId: number, action: string, target?: string) => void;
}

export function QuickActions({ playerId, tab, onAction }: QuickActionProps) {
  const actions = getQuickActionsForTab(tab);
  if (actions.length === 0) return null;
  return (
    <div className="flex gap-0.5">
      {actions.map((a, i) => (
        <button
          key={i}
          onClick={(e) => { e.stopPropagation(); onAction(playerId, a.type, a.target); }}
          className={`text-[8px] font-bold px-1.5 py-0.5 rounded transition-colors tracking-wider ${
            a.destructive
              ? 'text-red-600 hover:text-red-400 hover:bg-red-950/30'
              : a.type === 'promote'
                ? 'text-green-600 hover:text-green-400 hover:bg-green-950/30'
                : 'text-gray-500 hover:text-gray-400 hover:bg-gray-800'
          }`}
          title={a.label}
        >
          {a.icon}
        </button>
      ))}
    </div>
  );
}

function getQuickActionsForTab(tab: string): Array<{ icon: string; label: string; type: string; target?: string; destructive?: boolean }> {
  switch (tab) {
    case 'ACTIVE': return [
      { icon: '↓', label: 'Option to AAA', type: 'demote', target: 'MINORS_AAA' },
      { icon: '✕', label: 'DFA', type: 'dfa', destructive: true },
    ];
    case 'AAA': return [
      { icon: '↑', label: 'Call Up', type: 'promote', target: 'MLB_ACTIVE' },
      { icon: '↓', label: 'Demote', type: 'demote', target: 'MINORS_AA' },
    ];
    case 'AA': return [
      { icon: '↑', label: 'Promote', type: 'promote', target: 'MINORS_AAA' },
      { icon: '↓', label: 'Demote', type: 'demote', target: 'MINORS_APLUS' },
    ];
    case 'DFA': return [
      { icon: '↑', label: 'Restore', type: 'promote', target: 'MLB_ACTIVE' },
      { icon: '🚫', label: 'Release', type: 'release', destructive: true },
    ];
    default: return [
      { icon: '↑', label: 'Promote', type: 'promote' },
    ];
  }
}

// ─── Player Detail Panel ──────────────────────────────────────────────────────

interface PlayerDetailPanelProps {
  player: RosterPlayer | null;
  onClose: () => void;
  onOpenProfile: (id: number) => void;
}

export function PlayerDetailPanel({ player, onClose, onOpenProfile }: PlayerDetailPanelProps) {
  if (!player) return null;

  const p = player;
  const traits = assignTraits(p);
  const ovrColors = getOVRColor(p.overall);

  // Development phase
  const devPhase = p.age <= 24 ? 'PROSPECT' : p.age <= 28 ? 'ASCENT' : p.age <= 32 ? 'PRIME' : 'DECLINE';
  const devColor = devPhase === 'PROSPECT' ? '#38BDF8' : devPhase === 'ASCENT' ? '#22C55E'
    : devPhase === 'PRIME' ? '#F59E0B' : '#F43F5E';

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 overflow-y-auto shadow-2xl"
      style={{ backgroundColor: '#0F1930', borderLeft: '1px solid #1E2A4A' }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between" style={{ backgroundColor: '#0D1628', borderBottom: '1px solid #1E2A4A' }}>
        <div className="flex items-center gap-3">
          <OVRBadge ovr={p.overall} size="large" />
          <div>
            <div className="text-sm font-bold" style={{ color: '#F8FAFC' }}>{p.name}</div>
            <div className="text-[10px]" style={{ color: '#A7B3C7' }}>
              {p.position} · Age {p.age} · {p.isPitcher ? `T: ${p.throws}` : `B: ${p.bats}`}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-400 text-lg px-2 py-1 transition-colors"
          aria-label="Close player detail"
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Ratings */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded px-3 py-2" style={{ backgroundColor: '#0B1020', border: '1px solid #1E2A4A' }}>
            <div className="text-[8px] font-bold tracking-widest" style={{ color: '#64748B' }}>OVERALL</div>
            <div className="text-xl font-bold tabular-nums" style={{ color: ovrColors.text }}>{p.overall}</div>
          </div>
          <div className="rounded px-3 py-2" style={{ backgroundColor: '#0B1020', border: '1px solid #1E2A4A' }}>
            <div className="text-[8px] font-bold tracking-widest" style={{ color: '#64748B' }}>POTENTIAL</div>
            <div className="text-xl font-bold tabular-nums" style={{ color: p.potential >= 80 ? '#f97316' : p.potential >= 65 ? '#F59E0B' : '#A7B3C7' }}>{p.potential}</div>
          </div>
          <div className="rounded px-3 py-2" style={{ backgroundColor: '#0B1020', border: '1px solid #1E2A4A' }}>
            <div className="text-[8px] font-bold tracking-widest" style={{ color: '#64748B' }}>PHASE</div>
            <div className="text-xs font-bold tracking-wider mt-1" style={{ color: devColor }}>{devPhase}</div>
          </div>
        </div>

        {/* Season Stats */}
        <div className="rounded" style={{ border: '1px solid #1E2A4A' }}>
          <div className="px-3 py-1.5 text-[9px] font-bold tracking-[0.2em]" style={{ backgroundColor: '#0D1628', borderBottom: '1px solid #1E2A4A', color: '#f97316' }}>
            {p.isPitcher ? 'PITCHING STATS' : 'BATTING STATS'}
          </div>
          <div className="grid grid-cols-4 gap-0">
            {p.isPitcher ? (
              <>
                <StatCell label="W" value={p.stats.w} />
                <StatCell label="L" value={p.stats.l} />
                <StatCell label="ERA" value={p.stats.era} />
                <StatCell label="IP" value={p.stats.ip} />
                <StatCell label="K" value={p.stats.k} />
                <StatCell label="K/9" value={p.stats.k9} />
                <StatCell label="WHIP" value={p.stats.whip} />
                <StatCell label="SV" value={p.stats.sv} />
              </>
            ) : (
              <>
                <StatCell label="AVG" value={p.stats.avg} />
                <StatCell label="HR" value={p.stats.hr} />
                <StatCell label="RBI" value={p.stats.rbi} />
                <StatCell label="OBP" value={p.stats.obp} />
                <StatCell label="SLG" value={p.stats.slg} />
                <StatCell label="SB" value={p.stats.sb} />
                <StatCell label="K" value={p.stats.k} />
                <StatCell label="PA" value={p.stats.pa} />
              </>
            )}
          </div>
        </div>

        {/* Contract */}
        <div className="rounded" style={{ border: '1px solid #1E2A4A' }}>
          <div className="px-3 py-1.5 text-[9px] font-bold tracking-[0.2em]" style={{ backgroundColor: '#0D1628', borderBottom: '1px solid #1E2A4A', color: '#f97316' }}>
            CONTRACT
          </div>
          <div className="grid grid-cols-3 gap-0">
            <StatCell label="SALARY" value={formatSalary(p.salary)} />
            <StatCell label="YEARS" value={`${p.contractYearsRemaining}yr`} />
            <StatCell label="SERVICE" value={formatServiceTime(p.serviceTimeDays)} />
          </div>
        </div>

        {/* Traits */}
        {traits.length > 0 && (
          <div>
            <div className="text-[9px] font-bold tracking-[0.2em] mb-2" style={{ color: '#64748B' }}>TRAITS</div>
            <div className="flex gap-1.5 flex-wrap">
              {traits.map(t => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-0.5 px-2 py-1 rounded text-[10px] font-semibold"
                  style={{ background: `${t.color}15`, border: `1px solid ${t.color}30`, color: t.color }}
                  title={t.desc}
                >
                  {t.emoji} {t.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Full Profile Link */}
        <button
          onClick={() => onOpenProfile(p.playerId)}
          className="w-full py-2.5 text-xs font-bold tracking-widest uppercase transition-all rounded"
          style={{ backgroundColor: '#f97316', color: '#0B1020' }}
        >
          FULL PLAYER PROFILE
        </button>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCell({ label, value }: { label: string; value: any }) {
  const display = value === undefined || value === null ? '—' : String(value);
  return (
    <div className="px-3 py-2" style={{ borderRight: '1px solid #1E2A4A15', borderBottom: '1px solid #1E2A4A15' }}>
      <div className="text-[8px] font-bold tracking-wider" style={{ color: '#64748B' }}>{label}</div>
      <div className="text-sm font-bold tabular-nums" style={{ color: '#E2E8F0' }}>{display}</div>
    </div>
  );
}

function formatServiceTime(days: number): string {
  const years = Math.floor(days / 172);
  const remaining = days % 172;
  return `${years}.${String(remaining).padStart(3, '0')}`;
}

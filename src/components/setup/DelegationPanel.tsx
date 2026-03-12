/**
 * DelegationPanel.tsx — Management Scope / Delegation Control.
 *
 * "Delegation as complexity control is the gold standard, pioneered by FM."
 * — Deep Research Report synthesis
 *
 * Players choose what they control vs what the AI handles.
 * Three presets + full customization toggle.
 */

import { useGameStore, type DelegationScope, DELEGATION_PRESETS } from '../../store/gameStore';

// ─── Domain definitions ───────────────────────────────────────────────────────

interface DelegationDomain {
  key: keyof DelegationScope;
  label: string;
  desc: string;
  icon: string;
  category: 'core' | 'advanced';
}

const DOMAINS: DelegationDomain[] = [
  { key: 'lineup',       label: 'LINEUP & ROTATION', desc: 'Set your starting lineup and pitching rotation', icon: '📋', category: 'core' },
  { key: 'roster',       label: 'ROSTER MOVES',      desc: 'Call-ups, demotions, DFA, waivers',              icon: '🔄', category: 'core' },
  { key: 'trades',       label: 'TRADES',             desc: 'Propose, evaluate, and accept trades',           icon: '↔️', category: 'core' },
  { key: 'freeAgency',   label: 'FREE AGENCY',        desc: 'Sign free agents in the offseason',              icon: '✍️', category: 'core' },
  { key: 'draftStrategy',label: 'AMATEUR DRAFT',      desc: 'Select players in the annual draft',             icon: '🎓', category: 'core' },
  { key: 'extensions',   label: 'EXTENSIONS',         desc: 'Negotiate contract extensions with players',     icon: '📝', category: 'advanced' },
  { key: 'arbitration',  label: 'ARBITRATION',        desc: 'Handle salary arbitration cases',                icon: '⚖️', category: 'advanced' },
  { key: 'minorLeagues', label: 'MINOR LEAGUES',      desc: 'Manage all 6 minor league rosters',              icon: '🏟️', category: 'advanced' },
  { key: 'scouting',     label: 'SCOUTING',           desc: 'Assign scouts to regions and players',           icon: '🔭', category: 'advanced' },
  { key: 'development',  label: 'DEVELOPMENT',        desc: 'Dev lab assignments for prospects',              icon: '📈', category: 'advanced' },
];

// ─── Preset buttons ───────────────────────────────────────────────────────────

const PRESETS = [
  { id: 'casual',   label: 'CASUAL',   desc: 'AI handles most — you pick lineup + sim', icon: '🟢', color: '#22C55E' },
  { id: 'standard', label: 'STANDARD', desc: 'Full control, AI assists with minors',     icon: '🟡', color: '#F59E0B' },
  { id: 'hardcore', label: 'HARDCORE', desc: 'Everything manual — total control',         icon: '🔴', color: '#F43F5E' },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface DelegationPanelProps {
  /** Show as inline panel (dashboard) vs full-page (setup) */
  mode?: 'inline' | 'setup';
}

export default function DelegationPanel({ mode = 'inline' }: DelegationPanelProps) {
  const { delegation, setDelegation, toggleDelegation } = useGameStore();

  const controlledCount = Object.values(delegation).filter(Boolean).length;
  const totalCount = Object.keys(delegation).length;

  // Detect current preset match
  const currentPreset = PRESETS.find(p => {
    const preset = DELEGATION_PRESETS[p.id];
    return preset && Object.keys(preset).every(k => (preset as any)[k] === (delegation as any)[k]);
  });

  return (
    <div className={mode === 'setup' ? 'space-y-4' : 'space-y-3'}>
      {/* Header */}
      {mode === 'inline' && (
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[9px] font-bold tracking-[0.2em] uppercase" style={{ color: '#64748B' }}>MANAGEMENT SCOPE</div>
            <div className="text-[10px] mt-0.5" style={{ color: '#A7B3C7' }}>
              You control <span style={{ color: '#f97316', fontWeight: 700 }}>{controlledCount}</span> of {totalCount} domains
            </div>
          </div>
          {currentPreset && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ color: currentPreset.color, border: `1px solid ${currentPreset.color}40`, backgroundColor: `${currentPreset.color}10` }}>
              {currentPreset.label}
            </span>
          )}
        </div>
      )}

      {/* Presets */}
      <div className="grid grid-cols-3 gap-2">
        {PRESETS.map(p => {
          const isActive = currentPreset?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setDelegation({ ...DELEGATION_PRESETS[p.id] })}
              className="text-center py-2 sm:py-2.5 px-2 rounded transition-all"
              style={{
                backgroundColor: isActive ? `${p.color}12` : '#0B1020',
                border: `1px solid ${isActive ? `${p.color}50` : '#1E2A4A'}`,
              }}
            >
              <div className="text-sm">{p.icon}</div>
              <div className="text-[9px] font-bold tracking-wider mt-0.5" style={{ color: isActive ? p.color : '#A7B3C7' }}>{p.label}</div>
              {mode === 'setup' && <div className="text-[8px] mt-0.5" style={{ color: '#64748B' }}>{p.desc}</div>}
            </button>
          );
        })}
      </div>

      {/* Domain toggles */}
      <div className="space-y-1">
        {/* Core domains */}
        <div className="text-[8px] font-bold tracking-[0.2em] uppercase pt-1" style={{ color: '#64748B' }}>CORE GM DUTIES</div>
        {DOMAINS.filter(d => d.category === 'core').map(domain => (
          <DomainToggle key={domain.key} domain={domain} enabled={delegation[domain.key]} onToggle={() => toggleDelegation(domain.key)} />
        ))}

        {/* Advanced domains */}
        <div className="text-[8px] font-bold tracking-[0.2em] uppercase pt-2" style={{ color: '#64748B' }}>ADVANCED MANAGEMENT</div>
        {DOMAINS.filter(d => d.category === 'advanced').map(domain => (
          <DomainToggle key={domain.key} domain={domain} enabled={delegation[domain.key]} onToggle={() => toggleDelegation(domain.key)} />
        ))}
      </div>
    </div>
  );
}

// ─── Toggle row ───────────────────────────────────────────────────────────────

function DomainToggle({ domain, enabled, onToggle }: { domain: DelegationDomain; enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between px-3 py-2 rounded transition-all touch-target"
      style={{
        backgroundColor: enabled ? 'rgba(249,115,22,0.06)' : 'transparent',
        border: `1px solid ${enabled ? 'rgba(249,115,22,0.2)' : '#1E2A4A'}`,
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm">{domain.icon}</span>
        <div className="text-left min-w-0">
          <div className="text-[10px] font-bold tracking-wider" style={{ color: enabled ? '#f97316' : '#A7B3C7' }}>{domain.label}</div>
          <div className="text-[8px] truncate" style={{ color: '#64748B' }}>{domain.desc}</div>
        </div>
      </div>
      <div className="shrink-0 ml-2">
        <div
          className="w-8 h-4 rounded-full transition-colors relative"
          style={{ backgroundColor: enabled ? '#f97316' : '#1E2A4A' }}
        >
          <div
            className="w-3 h-3 rounded-full absolute top-0.5 transition-all"
            style={{
              backgroundColor: enabled ? '#0B1020' : '#64748B',
              left: enabled ? '18px' : '2px',
            }}
          />
        </div>
      </div>
    </button>
  );
}

// ─── Setup Screen Integration ─────────────────────────────────────────────────

export function DelegationSetupSection() {
  return (
    <div className="space-y-3">
      <div className="text-center space-y-1">
        <div className="text-[9px] tracking-widest uppercase" style={{ color: '#64748B' }}>HOW MUCH DO YOU WANT TO MANAGE?</div>
        <div className="text-xs" style={{ color: '#A7B3C7' }}>
          Delegate to your staff or control everything yourself. You can change this anytime.
        </div>
      </div>
      <DelegationPanel mode="setup" />
    </div>
  );
}

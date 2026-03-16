import { useState, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import { useUIStore } from '../../store/uiStore';
import { FO_ROLES, FO_TRAITS, START_MODES, FO_BUDGET, FO_CANDIDATES_PER_ROLE, generateFOCandidates } from '../../data/frontOffice';
import { createPRNG } from '../../engine/math/prng';
import type { FOStaffMember, FORoleId } from '../../types/frontOffice';
import type { StandingsRow } from '../../types/league';
import type { OwnerArchetype } from '../../engine/narrative';
import { DelegationSetupSection } from './DelegationPanel';
import { getDelegationForDifficulty } from '../../store/gameStore';
import DraftRoom from '../draft/DraftRoom';
import { INITIAL_TEAMS } from '../../data/teams';

// ─── Team list (derived from canonical INITIAL_TEAMS — single source of truth)
const TEAMS = INITIAL_TEAMS.map(t => ({
  id: t.teamId,
  abbr: t.abbreviation,
  name: `${t.city} ${t.name}`,
  div: `${t.league} ${t.division}`,
  city: t.city,
}));

const DIV_ORDER = ['AL East', 'AL Central', 'AL West', 'NL East', 'NL Central', 'NL West'];

function buildFOCandidateSeed(userTeamId: number, difficulty: string, roleId: FORoleId): number {
  let seed = (userTeamId * 1009) >>> 0;
  const input = `${difficulty}:${roleId}`;
  for (let i = 0; i < input.length; i++) {
    seed = ((seed * 31) + input.charCodeAt(i)) >>> 0;
  }
  return seed || 1;
}

// ─── Helper components ─────────────────────────────────────────────────────────

function OVRBadge({ ovr }: { ovr: number }) {
  const color = ovr >= 85 ? '#4ade80' : ovr >= 70 ? '#fbbf24' : '#94a3b8';
  return (
    <div className="text-center min-w-[44px]">
      <div className="text-2xl font-black tabular-nums leading-none" style={{ color }}>{ovr}</div>
      <div className="text-xs text-gray-500 mt-0.5">OVR</div>
    </div>
  );
}

// ─── Screen: Title ─────────────────────────────────────────────────────────────

function TitleScreen() {
  const { setSetupScreen } = useGameStore();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-8"
      style={{ background: 'radial-gradient(ellipse at 50% 10%, #1a2a1a 0%, #050a05 60%)' }}>
      <div className="text-center space-y-2">
        <div className="text-gray-500 text-xs tracking-[0.3em] uppercase">Season 2026</div>
        <div className="text-orange-500 font-black text-4xl tracking-widest">MR. BASEBALL</div>
        <div className="text-orange-700 font-bold text-xl tracking-[0.4em]">DYNASTY</div>
        <div className="text-gray-500 text-xs mt-4">A SABERMETRICALLY CREDIBLE FRANCHISE SIMULATION</div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => setSetupScreen('teamSelect')}
          className="bg-orange-600 hover:bg-orange-500 text-black font-black text-sm py-4 uppercase tracking-widest transition-colors"
        >
          ⚾ START NEW DYNASTY
        </button>
        <div className="text-center text-gray-700 text-xs">
          Full minor system — AAA through INTL ·{' '}
          <span className="text-gray-500">~5,300 players generated</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center max-w-sm w-full mt-4">
        {[
          { icon: '📊', label: 'Log5 + Markov', sub: 'Statistically credible' },
          { icon: '⚡', label: 'SDE Aging', sub: 'Players develop & decline' },
          { icon: '🔍', label: 'Fog of War', sub: 'Scouting uncertainty' },
        ].map(f => (
          <div key={f.label} className="space-y-1">
            <div className="text-xl">{f.icon}</div>
            <div className="text-orange-400 text-xs font-bold">{f.label}</div>
            <div className="text-gray-500 text-xs">{f.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Screen: Team Select ───────────────────────────────────────────────────────

function TeamSelectScreen() {
  const { userTeamId, setUserTeamId, setSetupScreen } = useGameStore();
  const [hovered, setHovered] = useState<number | null>(null);

  const grouped = DIV_ORDER.map(div => ({
    div,
    teams: TEAMS.filter(t => t.div === div),
  }));

  return (
    <div className="min-h-screen p-6 overflow-auto"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a1a2e 0%, #050510 70%)' }}>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1 pt-2">
          <div className="text-gray-500 text-xs tracking-widest uppercase">Choose Your Franchise</div>
          <div className="text-orange-400 font-black text-2xl tracking-wider">SELECT YOUR TEAM</div>
          <div className="text-gray-500 text-xs">You'll manage this franchise for your dynasty run</div>
        </div>

        {/* Division grids */}
        {grouped.map(({ div, teams }) => (
          <div key={div}>
            <div className="text-gray-500 text-xs font-bold tracking-[0.2em] uppercase mb-2 px-1">
              {div}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {teams.map(t => {
                const selected = userTeamId === t.id;
                const hover    = hovered === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setUserTeamId(t.id)}
                    onMouseEnter={() => setHovered(t.id)}
                    onMouseLeave={() => setHovered(null)}
                    className="rounded p-2 text-center transition-all duration-100"
                    style={{
                      background: selected
                        ? 'rgba(234,88,12,0.20)'
                        : hover ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                      border: selected
                        ? '1px solid rgba(234,88,12,0.6)'
                        : hover ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <div className={`font-black text-sm ${selected ? 'text-orange-400' : 'text-gray-300'}`}>
                      {t.abbr}
                    </div>
                    <div className="text-gray-500 text-xs mt-0.5 leading-tight truncate">{t.city}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Selected team display */}
        {userTeamId && (
          <div className="rounded-lg p-4 text-center" style={{
            background: 'rgba(234,88,12,0.08)',
            border: '1px solid rgba(234,88,12,0.3)',
          }}>
            {(() => {
              const t = TEAMS.find(x => x.id === userTeamId)!;
              return (
                <>
                  <div className="text-orange-400 font-black text-lg">{t.abbr} — {t.name}</div>
                  <div className="text-gray-500 text-xs">{t.div}</div>
                </>
              );
            })()}
          </div>
        )}

        {/* Nav */}
        <div className="flex gap-3">
          <button
            onClick={() => setSetupScreen('title')}
            className="flex-1 py-2 text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6 }}
          >
            ← Back
          </button>
          <button
            onClick={() => setSetupScreen('startMode')}
            disabled={!userTeamId}
            className="flex-[2] py-3 text-sm font-black uppercase tracking-widest transition-colors disabled:opacity-40"
            style={{
              background: userTeamId ? '#ea580c' : '#374151',
              color: userTeamId ? '#000' : '#6b7280',
              borderRadius: 6,
            }}
          >
            CONFIRM FRANCHISE →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Start Mode ────────────────────────────────────────────────────────

function StartModeScreen() {
  const { startMode, setStartMode, setSetupScreen } = useGameStore();

  return (
    <div className="min-h-screen p-6 overflow-auto"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #1a1a2e 0%, #050510 70%)' }}>
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center pt-2 space-y-1">
          <div className="text-gray-500 text-xs tracking-widest uppercase">Franchise Setup</div>
          <div className="text-orange-400 font-black text-2xl tracking-wider">START MODE</div>
          <div className="text-gray-500 text-xs">How do you want to build your roster?</div>
        </div>

        <div className="space-y-3">
          {START_MODES.map(mode => {
            const selected = startMode === mode.id;
            const canSelect = mode.available;
            return (
              <div
                key={mode.id}
                onClick={() => canSelect && setStartMode(mode.id)}
                className="rounded-lg p-4 transition-all duration-100"
                style={{
                  cursor:     canSelect ? 'pointer' : 'default',
                  opacity:    canSelect ? 1 : 0.5,
                  background: selected
                    ? 'rgba(234,88,12,0.12)'
                    : canSelect ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.2)',
                  border: selected
                    ? '1px solid rgba(234,88,12,0.5)'
                    : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{mode.icon}</span>
                      <span className="font-black text-sm" style={{ color: selected ? '#f97316' : '#e2e8f0' }}>
                        {mode.label}
                      </span>
                      {mode.recommended && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(234,88,12,0.2)', color: '#f97316', border: '1px solid rgba(234,88,12,0.4)' }}>
                          RECOMMENDED
                        </span>
                      )}
                      {!mode.available && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(100,100,100,0.2)', color: '#6b7280', border: '1px solid rgba(100,100,100,0.3)' }}>
                          PHASE 2
                        </span>
                      )}
                    </div>
                    <div className="text-gray-400 text-xs font-bold mb-1">{mode.sub}</div>
                    <div className="text-gray-500 text-xs leading-relaxed">{mode.desc}</div>
                    <div className="flex gap-4 mt-2">
                      <span className="text-gray-500 text-xs">{mode.time}</span>
                      {mode.diff && <span className="text-gray-500 text-xs">{mode.diff}</span>}
                    </div>
                  </div>
                  {selected && (
                    <div className="text-orange-500 font-black text-lg shrink-0">✓</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setSetupScreen('teamSelect')}
            className="flex-1 py-2 text-xs font-bold text-gray-500 hover:text-gray-300"
            style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6 }}>
            ← Back
          </button>
          <button onClick={() => setSetupScreen('difficulty')}
            className="flex-[2] py-3 text-sm font-black uppercase tracking-widest"
            style={{ background: '#ea580c', color: '#000', borderRadius: 6 }}>
            SET DIFFICULTY →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Difficulty & Owner ────────────────────────────────────────────────

const DIFFICULTIES: Array<{
  id: 'rookie' | 'normal' | 'hard';
  label: string;
  icon: string;
  foBudget: number;
  patience: string;
  desc: string;
}> = [
  { id: 'rookie', label: 'ROOKIE', icon: '🟢', foBudget: 30, patience: 'Forgiving', desc: 'Training wheels — generous budget, patient ownership. Learn the ropes without pressure.' },
  { id: 'normal', label: 'NORMAL', icon: '🟡', foBudget: 15, patience: 'Moderate', desc: 'The real deal — balanced budget and expectations. A fair challenge for any GM.' },
  { id: 'hard',   label: 'HARD',   icon: '🔴', foBudget: 10, patience: 'Demanding', desc: 'Prove yourself — tight budget, impatient owner. Every decision matters.' },
];

const ARCHETYPES: Array<{
  id: OwnerArchetype;
  label: string;
  icon: string;
  desc: string;
  expectation: string;
}> = [
  { id: 'win_now',         label: 'WIN-NOW',         icon: '🏆', desc: 'Aggressive ownership that demands results now.',              expectation: 'Expects playoff appearances every year' },
  { id: 'patient_builder', label: 'PATIENT BUILDER',  icon: '🌱', desc: 'Long-term vision with emphasis on development.',             expectation: 'Focuses on farm system and sustained success' },
  { id: 'penny_pincher',   label: 'COST-CONSCIOUS',   icon: '💰', desc: 'Payroll discipline above all — do more with less.',          expectation: 'Stay under budget, find value in the margins' },
];

function DifficultyScreen() {
  const { difficulty, setDifficulty, setDelegation, ownerArchetype, setOwnerArchetype, setFoBudget, setSetupScreen } = useGameStore();

  const handleDifficulty = (d: 'rookie' | 'normal' | 'hard') => {
    setDifficulty(d);
    setDelegation(getDelegationForDifficulty(d));
    const diff = DIFFICULTIES.find(x => x.id === d);
    if (diff) setFoBudget(diff.foBudget);
  };

  return (
    <div className="min-h-screen p-6 overflow-auto"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #2a1a1a 0%, #0a0505 70%)' }}>
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center pt-2 space-y-1">
          <div className="text-gray-500 text-xs tracking-widest uppercase">Franchise Setup</div>
          <div className="text-orange-400 font-black text-2xl tracking-wider">DIFFICULTY</div>
          <div className="text-gray-500 text-xs">Set the challenge level and ownership style</div>
        </div>

        {/* Difficulty cards */}
        <div className="space-y-3">
          <div className="text-gray-500 text-xs font-bold tracking-widest uppercase">CHALLENGE LEVEL</div>
          {DIFFICULTIES.map(d => {
            const selected = difficulty === d.id;
            return (
              <div
                key={d.id}
                onClick={() => handleDifficulty(d.id)}
                className="rounded-lg p-4 transition-all duration-100 cursor-pointer"
                style={{
                  background: selected ? 'rgba(234,88,12,0.12)' : 'rgba(255,255,255,0.03)',
                  border: selected ? '1px solid rgba(234,88,12,0.5)' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{d.icon}</span>
                      <span className="font-black text-sm" style={{ color: selected ? '#f97316' : '#e2e8f0' }}>
                        {d.label}
                      </span>
                      {d.id === 'normal' && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(234,88,12,0.2)', color: '#f97316', border: '1px solid rgba(234,88,12,0.4)' }}>
                          RECOMMENDED
                        </span>
                      )}
                    </div>
                    <div className="text-gray-400 text-xs leading-relaxed">{d.desc}</div>
                    <div className="flex gap-4 mt-2">
                      <span className="text-gray-500 text-xs">FO Budget: ${d.foBudget}M</span>
                      <span className="text-gray-500 text-xs">Owner: {d.patience}</span>
                    </div>
                  </div>
                  {selected && (
                    <div className="text-orange-500 font-black text-lg shrink-0">✓</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Owner archetype */}
        <div className="space-y-3">
          <div className="text-gray-500 text-xs font-bold tracking-widest uppercase">OWNER ARCHETYPE</div>
          {ARCHETYPES.map(a => {
            const selected = ownerArchetype === a.id;
            return (
              <div
                key={a.id}
                onClick={() => setOwnerArchetype(a.id)}
                className="rounded-lg p-4 transition-all duration-100 cursor-pointer"
                style={{
                  background: selected ? 'rgba(167,139,250,0.10)' : 'rgba(255,255,255,0.03)',
                  border: selected ? '1px solid rgba(167,139,250,0.5)' : '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{a.icon}</span>
                      <span className="font-black text-sm" style={{ color: selected ? '#a78bfa' : '#e2e8f0' }}>
                        {a.label}
                      </span>
                    </div>
                    <div className="text-gray-400 text-xs leading-relaxed">{a.desc}</div>
                    <div className="text-gray-500 text-xs mt-1">{a.expectation}</div>
                  </div>
                  {selected && (
                    <div className="font-black text-lg shrink-0" style={{ color: '#a78bfa' }}>✓</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Management Scope — what you control vs AI */}
        <DelegationSetupSection />

        {/* Nav */}
        <div className="flex gap-3 pb-6">
          <button onClick={() => setSetupScreen('startMode')}
            className="flex-1 py-2 text-xs font-bold text-gray-500 hover:text-gray-300"
            style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6 }}>
            ← Back
          </button>
          <button onClick={() => setSetupScreen('frontOffice')}
            className="flex-[2] py-3 text-sm font-black uppercase tracking-widest"
            style={{ background: '#ea580c', color: '#000', borderRadius: 6 }}>
            BUILD FRONT OFFICE →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Screen: Front Office Setup ────────────────────────────────────────────────

function FrontOfficeScreen({ onStartGame, startError }: { onStartGame: () => void; startError: string | null }) {
  const {
    userTeamId, startMode, frontOffice, difficulty,
    addFOStaff, removeFOStaff, setSetupScreen,
  } = useGameStore();

  const foBudgetMax = FO_BUDGET[difficulty] ?? 15;
  const foSpent     = frontOffice.reduce((s, m) => s + m.salary, 0);
  const foRemaining = Math.round((foBudgetMax - foSpent) * 10) / 10;
  const foPct       = Math.min(1, foSpent / foBudgetMax);
  const budgetColor = foPct > 0.9 ? '#ef4444' : foPct > 0.7 ? '#f97316' : '#4ade80';

  const [candidatesFor, setCandidatesFor] = useState<{ roleId: FORoleId; candidates: FOStaffMember[] } | null>(null);

  const teamName = TEAMS.find(t => t.id === userTeamId)?.name ?? 'Unknown';
  const openRoles = FO_ROLES.filter(r => !frontOffice.some(s => s.roleId === r.id));
  const coreHired = frontOffice.filter(s => ['gm', 'scout_dir', 'analytics'].includes(s.roleId)).length;
  const openCandidatePicker = useCallback((roleId: FORoleId) => {
    const seed = buildFOCandidateSeed(userTeamId, difficulty, roleId);
    setCandidatesFor({
      roleId,
      candidates: generateFOCandidates(roleId, FO_CANDIDATES_PER_ROLE[difficulty] ?? 6, createPRNG(seed)),
    });
  }, [difficulty, userTeamId]);

  const handleHire = useCallback((candidate: FOStaffMember) => {
    const projected = foSpent + candidate.salary;
    if (projected > foBudgetMax) return;
    addFOStaff(candidate);
    setCandidatesFor(null);
  }, [foSpent, foBudgetMax, addFOStaff]);

  const statusMsg = (() => {
    if (frontOffice.length === 0) return { text: '📋 Hire GM, Scouting Dir, and Analytics to unlock bonuses', color: '#6b7280', bg: 'rgba(255,255,255,0.03)' };
    if (frontOffice.length >= 8) return { text: '🏆 Full Front Office — every phase of your dynasty is covered!', color: '#4ade80', bg: 'rgba(74,222,128,0.06)' };
    if (coreHired >= 3) return { text: `⭐ Core hired! Add specialists for bonus edges — ${frontOffice.length}/8`, color: '#fbbf24', bg: 'rgba(251,191,36,0.06)' };
    return { text: `📋 ${frontOffice.length} hired — aim for GM + Scouting Dir + Analytics`, color: '#94a3b8', bg: 'rgba(255,255,255,0.03)' };
  })();

  return (
    <div className="min-h-screen p-5 overflow-auto"
      style={{ background: 'radial-gradient(ellipse at 50% 0%, #1e1a2e 0%, #050510 70%)' }}>
      <div className="max-w-lg mx-auto space-y-4">

        {/* Header */}
        <div className="text-center pt-2 space-y-1">
          <div className="text-gray-500 text-xs tracking-widest uppercase">Build Your</div>
          <div className="font-black text-2xl tracking-wider" style={{ color: '#a78bfa' }}>FRONT OFFICE</div>
          <div className="text-gray-500 text-xs">Hire your staff before Opening Day — or skip and hire later</div>
          <div className="text-orange-400 text-xs font-bold">{teamName}</div>
        </div>

        {/* Budget bar */}
        <div className="rounded-lg p-3" style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${budgetColor}44` }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">💼 FO Budget</span>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-black tabular-nums" style={{ color: budgetColor }}>
                ${foSpent.toFixed(1)}M
              </span>
              <span className="text-xs text-gray-500">/ ${foBudgetMax}M</span>
              {foRemaining > 0
                ? <span className="text-xs font-bold text-green-400">${foRemaining.toFixed(1)}M left</span>
                : <span className="text-xs font-bold text-red-400">⛔ MAXED</span>
              }
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.round(foPct * 100)}%`, background: budgetColor }} />
          </div>
        </div>

        {/* Hired staff */}
        {frontOffice.length > 0 && (
          <div>
            <div className="text-xs font-bold text-green-400 tracking-widest uppercase mb-2">✅ Hired Staff</div>
            <div className="space-y-2">
              {frontOffice.map(s => (
                <div key={s.id} className="rounded-lg p-3 flex items-center gap-3"
                  style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{s.icon}</span>
                      <span className="font-bold text-sm text-gray-200 truncate">{s.name}</span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {s.title} · {FO_TRAITS[s.traitId].icon} {FO_TRAITS[s.traitId].label} · ${s.salary}M/yr · {s.yearsLeft}yr
                    </div>
                  </div>
                  <OVRBadge ovr={s.ovr} />
                  <button
                    onClick={() => removeFOStaff(s.id)}
                    className="text-red-400 hover:text-red-300 text-xs font-bold px-2 py-1 rounded transition-colors"
                    style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Candidate picker */}
        {candidatesFor && (
          <div className="rounded-lg p-4" style={{
            background: 'rgba(167,139,250,0.06)',
            border:     '1px solid rgba(167,139,250,0.25)',
          }}>
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm font-black" style={{ color: '#a78bfa' }}>
                📋 Hire {FO_ROLES.find(r => r.id === candidatesFor.roleId)?.title}
              </div>
              <button onClick={() => setCandidatesFor(null)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                Cancel ✕
              </button>
            </div>
            <div className="space-y-2">
              {candidatesFor.candidates.map(c => {
                const trait     = FO_TRAITS[c.traitId];
                const projected = foSpent + c.salary;
                const canAfford = projected <= foBudgetMax;
                const overBy    = Math.round((projected - foBudgetMax) * 10) / 10;
                return (
                  <div
                    key={c.id}
                    onClick={() => canAfford && handleHire(c)}
                    className="rounded-lg p-3 transition-all duration-100"
                    style={{
                      cursor:     canAfford ? 'pointer' : 'not-allowed',
                      opacity:    canAfford ? 1 : 0.55,
                      background: canAfford ? 'rgba(255,255,255,0.03)' : 'rgba(239,68,68,0.04)',
                      border:     canAfford ? `1px solid ${c.color}44` : '1px solid rgba(239,68,68,0.35)',
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-gray-200 mb-0.5">{c.name}</div>
                        <div className="text-gray-500 text-xs mb-2 leading-tight">{c.backstory}</div>
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-xs px-2 py-0.5 rounded font-bold"
                            style={{ background: 'rgba(255,255,255,0.05)', color: c.color, border: `1px solid ${c.color}33` }}>
                            {trait.icon} {trait.label}
                          </span>
                          <span className="text-xs text-gray-500">${c.salary}M/yr · {c.yearsLeft}yr</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 italic">{trait.desc}</div>
                      </div>
                      <div className="shrink-0">
                        <OVRBadge ovr={c.ovr} />
                        <div className="text-center mt-1">
                          {canAfford
                            ? <span className="text-xs font-bold text-green-400">Hire →</span>
                            : <span className="text-xs font-bold text-red-400">+${overBy}M</span>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Available roles */}
        {!candidatesFor && openRoles.length > 0 && (
          <div>
            <div className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-2">
              Available Roles
            </div>
            <div className="space-y-2">
              {openRoles.map(role => {
                const canAffordMin = foRemaining >= role.salaryRange[0];
                return (
                  <div
                    key={role.id}
                    onClick={() => canAffordMin && openCandidatePicker(role.id)}
                    className="rounded-lg p-3 flex items-center gap-3 transition-all duration-100"
                    style={{
                      cursor:     canAffordMin ? 'pointer' : 'default',
                      opacity:    canAffordMin ? 1 : 0.5,
                      background: 'rgba(255,255,255,0.03)',
                      border:     `1px solid ${role.color}33`,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span style={{ color: role.color }} className="font-bold text-sm">
                          {role.icon} {role.title}
                        </span>
                        {role.tier === 'specialist' && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                            SPECIALIST
                          </span>
                        )}
                      </div>
                      <div className="text-gray-500 text-xs">{role.desc}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-gray-500 text-xs">${role.salaryRange[0]}–${role.salaryRange[1]}M/yr</span>
                        {!canAffordMin && (
                          <span className="text-red-400 text-xs font-bold">⛔ Over budget</span>
                        )}
                      </div>
                    </div>
                    {canAffordMin && (
                      <div className="text-xs font-bold shrink-0" style={{ color: role.color }}>View →</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status message */}
        <div className="rounded-lg p-3 text-center text-xs font-bold"
          style={{ background: statusMsg.bg, color: statusMsg.color, border: `1px solid ${statusMsg.color}40` }}>
          {statusMsg.text}
        </div>

        {/* Error display */}
        {startError && (
          <div className="rounded-lg p-3 text-center text-xs font-bold"
            style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)' }}>
            ⚠ DYNASTY START FAILED: {startError}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3 pb-6">
          <button
            onClick={onStartGame}
            disabled={!!candidatesFor}
            className="w-full py-4 font-black text-sm uppercase tracking-widest transition-colors disabled:opacity-50"
            style={{ background: '#a78bfa', color: '#000', borderRadius: 8 }}
          >
            {frontOffice.length === 0
              ? startMode === 'instant' ? '⏭️ Skip — Start Game Now' : '⏭️ Skip — Hire Staff Later'
              : startMode === 'instant' ? '⚾ Confirm Staff & Start Dynasty →' : '⚾ Confirm Staff & Go to Draft →'
            }
          </button>
          <button
            onClick={() => setSetupScreen('difficulty')}
            className="w-full py-2 text-xs font-bold text-gray-500 hover:text-gray-300 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6 }}
          >
            ← Back to Difficulty
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main SetupFlow ────────────────────────────────────────────────────────────

export default function SetupFlow() {
  const { setupScreen, userTeamId, startMode, setGameStarted, setSeason, setUserTeamId, setSetupScreen } = useGameStore();
  const { setStandings } = useLeagueStore();
  const { setSelectedTeam } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const isDraftMode = startMode === 'snake10' || startMode === 'snake25' || startMode === 'snake26';

  const handleStartGame = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const engine = getEngine();
      const seed   = Date.now() % 2147483647;
      await engine.newGame(seed, userTeamId);

      // FO staff lives in Zustand gameStore — no worker call needed.

      if (isDraftMode) {
        // Start the draft and transition to draft screen
        await engine.startDraft(startMode);
        setUserTeamId(userTeamId);
        setSelectedTeam(userTeamId);
        setSeason(2026);
        setSetupScreen('draft');
      } else {
        // Instant mode — go straight to game
        setUserTeamId(userTeamId);
        setSelectedTeam(userTeamId);
        setSeason(2026);

        // Fetch standings and wrap into StandingsData shape
        const rows = await engine.getStandings();
        setStandings({ season: 2026, standings: rows as unknown as StandingsRow[] });

        setGameStarted(true);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [userTeamId, startMode, isDraftMode, setUserTeamId, setSelectedTeam, setSeason, setGameStarted, setStandings, setSetupScreen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6">
        <div className="text-orange-400 font-black text-xl tracking-widest animate-pulse">
          {isDraftMode ? 'GENERATING LEAGUE & DRAFT POOL…' : 'GENERATING LEAGUE…'}
        </div>
        <div className="text-gray-500 text-xs text-center space-y-1">
          <div>Generating ~5,300 players across 30 franchises</div>
          <div>Building MLB + AAA + AA + A+ + A- + Rookie + International</div>
        </div>
        {error && <div className="text-red-400 text-sm mt-4">{error}</div>}
      </div>
    );
  }

  switch (setupScreen) {
    case 'title':       return <TitleScreen />;
    case 'teamSelect':  return <TeamSelectScreen />;
    case 'startMode':   return <StartModeScreen />;
    case 'difficulty':  return <DifficultyScreen />;
    case 'frontOffice': return <FrontOfficeScreen onStartGame={handleStartGame} startError={error} />;
    case 'draft':       return <DraftRoom />;
    default:            return <TitleScreen />;
  }
}

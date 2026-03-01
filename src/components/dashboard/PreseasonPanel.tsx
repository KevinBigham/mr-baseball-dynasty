import { useEffect, useState } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { RosterPlayer } from '../../types/league';

interface PreseasonData {
  active: RosterPlayer[];
  rotation: RosterPlayer[];
  bullpen: RosterPlayer[];
  payroll: number;
  budget: number;
  teamName: string;
  activeCount: number;
  fortyManCount: number;
}

function gradeRoster(players: RosterPlayer[]): { grade: string; color: string; score: number } {
  if (players.length === 0) return { grade: 'N/A', color: 'text-gray-500', score: 0 };
  const avg = players.reduce((s, p) => s + p.overall, 0) / players.length;
  const score = Math.round(20 + (avg / 550) * 60);
  const grade =
    score >= 70 ? 'A' :
    score >= 65 ? 'B+' :
    score >= 60 ? 'B' :
    score >= 55 ? 'C+' :
    score >= 50 ? 'C' : 'D';
  const color =
    score >= 70 ? 'text-green-400' :
    score >= 60 ? 'text-blue-400' :
    score >= 50 ? 'text-orange-400' : 'text-red-400';
  return { grade, color, score };
}

function GradeCard({ label, players }: { label: string; players: RosterPlayer[] }) {
  const { grade, color } = gradeRoster(players);
  const sorted = [...players].sort((a, b) => b.overall - a.overall).slice(0, 2);

  return (
    <div className="bloomberg-border bg-gray-900 p-3">
      <div className="text-gray-500 text-xs mb-1">{label}</div>
      <div className={`text-3xl font-bold ${color}`}>{grade}</div>
      <div className="mt-2 space-y-0.5">
        {sorted.map(p => (
          <div key={p.playerId} className="flex justify-between text-xs text-gray-500">
            <span className="truncate mr-2">{p.name.split(' ').pop()}</span>
            <span className="text-gray-600">{Math.round(20 + (p.overall / 550) * 60)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NeedBadge({ label }: { label: string }) {
  return (
    <span className="border border-red-800 text-red-400 text-xs px-2 py-0.5 uppercase tracking-wide">
      {label}
    </span>
  );
}

function StrengthBadge({ label }: { label: string }) {
  return (
    <span className="border border-green-800 text-green-400 text-xs px-2 py-0.5 uppercase tracking-wide">
      {label}
    </span>
  );
}

function analyzeRoster(data: PreseasonData): { strengths: string[]; needs: string[] } {
  const strengths: string[] = [];
  const needs: string[] = [];

  const { active, rotation, bullpen } = data;

  // Rotation grade
  const rotGrade = gradeRoster(rotation);
  if (rotGrade.score >= 65) strengths.push('Elite rotation');
  else if (rotGrade.score < 50) needs.push('Rotation depth');

  // Bullpen grade
  const bpGrade = gradeRoster(bullpen);
  if (bpGrade.score >= 60) strengths.push('Strong bullpen');
  else if (bpGrade.score < 48) needs.push('Bullpen help');

  // Offense (non-pitchers)
  const hitters = active.filter(p => !['SP', 'RP', 'CL'].includes(p.position));
  const offGrade = gradeRoster(hitters);
  if (offGrade.score >= 62) strengths.push('Potent lineup');
  else if (offGrade.score < 50) needs.push('Offensive pop');

  // Roster depth
  if (data.activeCount < 24) needs.push('Active roster thin');
  if (data.fortyManCount < 35) needs.push('40-man depth');

  // Payroll room
  const remaining = data.budget - data.payroll;
  if (remaining > 30_000_000) strengths.push(`$${(remaining / 1_000_000).toFixed(0)}M to spend`);
  else if (remaining < 5_000_000) needs.push('Tight budget');

  // Youth
  const youngElite = active.filter(p => p.age <= 26 && p.overall >= 370);
  if (youngElite.length >= 3) strengths.push(`${youngElite.length} young stars`);

  return { strengths, needs };
}

function WinProjection({ active, rotation }: { active: RosterPlayer[]; rotation: RosterPlayer[] }) {
  // Very rough projection: average OVR → expected win pct
  const allPlayers = [...active, ...rotation];
  const avgOvr = allPlayers.length > 0
    ? allPlayers.reduce((s, p) => s + p.overall, 0) / allPlayers.length
    : 350;

  // Map 250-500 OVR range to 60-102 win range
  const projected = Math.round(60 + ((avgOvr - 250) / 250) * 42);
  const clamped = Math.max(62, Math.min(100, projected));
  const color = clamped >= 90 ? 'text-green-400' : clamped >= 82 ? 'text-blue-400' : clamped >= 76 ? 'text-orange-400' : 'text-red-400';
  const label = clamped >= 92 ? 'WS CONTENDER' : clamped >= 87 ? 'PLAYOFF TEAM' : clamped >= 80 ? 'BUBBLE TEAM' : 'REBUILDING';

  return (
    <div className="bloomberg-border bg-gray-900 p-4 text-center">
      <div className="text-gray-500 text-xs mb-2">PROJECTED WINS</div>
      <div className={`text-5xl font-bold tabular-nums ${color}`}>{clamped}</div>
      <div className={`text-xs mt-2 font-bold tracking-widest ${color}`}>{label}</div>
      <div className="text-gray-600 text-xs mt-1">{162 - clamped} losses</div>
    </div>
  );
}

export default function PreseasonPanel() {
  const { userTeamId, season } = useGameStore();
  const { setActiveTab } = useUIStore();
  const [data, setData] = useState<PreseasonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const engine = getEngine();
      const [roster, teams] = await Promise.all([
        engine.getFullRoster(userTeamId),
        engine.getLeagueTeams(),
      ]);
      const team = teams.find(t => t.teamId === userTeamId);
      const allActive: RosterPlayer[] = [...roster.active, ...roster.il];
      const rotation = allActive.filter(p => p.position === 'SP').sort((a, b) => b.overall - a.overall).slice(0, 5);
      const bullpen  = allActive.filter(p => p.position === 'RP' || p.position === 'CL');
      const payroll  = [...roster.active, ...roster.il, ...(roster.aaa ?? []), ...(roster.aa ?? [])]
        .reduce((s, p) => s + (p.salary ?? 0), 0);

      setData({
        active: allActive,
        rotation,
        bullpen,
        payroll,
        budget: team?.budget ?? 150_000_000,
        teamName: team?.name ?? 'Your Team',
        activeCount: roster.activeCount ?? allActive.length,
        fortyManCount: roster.fortyManCount ?? 0,
      });
      setLoading(false);
    })();
  }, [userTeamId]);

  if (loading) return <div className="text-orange-400 text-xs animate-pulse py-4">Analyzing roster...</div>;
  if (!data) return null;

  const hitters   = data.active.filter(p => !['SP', 'RP', 'CL'].includes(p.position));
  const { strengths, needs } = analyzeRoster(data);
  const payrollM = data.payroll / 1_000_000;
  const budgetM  = data.budget / 1_000_000;

  return (
    <div className="space-y-4">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bloomberg-border bg-gray-900 px-4 py-3">
        <div className="text-orange-500 font-bold text-xs tracking-widest">{data.teamName.toUpperCase()} — SEASON {season} PREVIEW</div>
        <div className="text-gray-500 text-xs mt-0.5">
          {data.activeCount}/26 active · {data.fortyManCount}/40 on 40-man · ${payrollM.toFixed(0)}M / ${budgetM.toFixed(0)}M budget
        </div>
      </div>

      {/* ── Win projection + roster grades ──────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <WinProjection active={data.active} rotation={data.rotation} />
        <GradeCard label="ROTATION" players={data.rotation} />
        <GradeCard label="BULLPEN"  players={data.bullpen} />
        <GradeCard label="LINEUP"   players={hitters.slice(0, 8)} />
      </div>

      {/* ── Strengths & Needs ────────────────────────────────────────────── */}
      {(strengths.length > 0 || needs.length > 0) && (
        <div className="bloomberg-border bg-gray-900 px-4 py-3">
          <div className="text-gray-500 text-xs mb-2 font-bold tracking-widest">TEAM ANALYSIS</div>
          <div className="flex flex-wrap gap-2">
            {strengths.map(s => <StrengthBadge key={s} label={s} />)}
            {needs.map(n => <NeedBadge key={n} label={n} />)}
          </div>
        </div>
      )}

      {/* ── Starting lineup preview ──────────────────────────────────────── */}
      <div className="bloomberg-border">
        <div className="bloomberg-header flex items-center justify-between">
          <span>PROJECTED LINEUP</span>
          <button onClick={() => setActiveTab('roster')}
            className="text-gray-600 hover:text-orange-400 text-xs transition-colors font-normal">
            MANAGE ROSTER →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-0 divide-x divide-gray-800">
          <div>
            <div className="text-gray-600 text-xs px-3 py-1 border-b border-gray-800">LINEUP</div>
            {hitters.sort((a, b) => b.overall - a.overall).slice(0, 8).map((p, i) => (
              <div key={p.playerId} className="flex items-center justify-between px-3 py-1.5 text-xs border-b border-gray-800/50">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 w-4">{i + 1}</span>
                  <span className="font-bold text-gray-300">{p.name}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500">
                  <span>{p.position}</span>
                  <span className="text-orange-600 font-bold">{Math.round(20 + (p.overall / 550) * 60)}</span>
                </div>
              </div>
            ))}
          </div>
          <div>
            <div className="text-gray-600 text-xs px-3 py-1 border-b border-gray-800">ROTATION</div>
            {data.rotation.map((p, i) => (
              <div key={p.playerId} className="flex items-center justify-between px-3 py-1.5 text-xs border-b border-gray-800/50">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 w-4">#{i + 1}</span>
                  <span className="font-bold text-gray-300">{p.name}</span>
                </div>
                <span className="text-orange-600 font-bold">{Math.round(20 + (p.overall / 550) * 60)}</span>
              </div>
            ))}
            <div className="text-gray-600 text-xs px-3 py-1 border-b border-gray-800 mt-2">BULLPEN ({data.bullpen.length})</div>
            {data.bullpen.sort((a, b) => b.overall - a.overall).slice(0, 4).map(p => (
              <div key={p.playerId} className="flex items-center justify-between px-3 py-1.5 text-xs border-b border-gray-800/50">
                <span className="font-bold text-gray-400">{p.name}</span>
                <div className="flex items-center gap-2 text-gray-500">
                  <span>{p.position}</span>
                  <span className="text-orange-600 font-bold">{Math.round(20 + (p.overall / 550) * 60)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

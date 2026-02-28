import React, { useEffect, useState } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import type { PlayerProfileData, SplitLine } from '../../types/league';
import type { PlayerTrait } from '../../engine/playerTraits';

interface ScoutingReport {
  devPhase: string;
  sigma: number;
  theta: number;
  risk: string;
  ceiling: string;
  eta: string;
  fv: number;
  summary: string;
  traits: PlayerTrait[];
  agingCurvePhase: string;
}

function GradeBox({ label, value }: { label: string; value: number }) {
  const cls =
    value >= 70 ? 'grade-80' :
    value >= 60 ? 'grade-70' :
    value >= 50 ? 'grade-60' :
    value >= 40 ? 'grade-50' :
    value >= 30 ? 'grade-40' :
    'grade-30';

  return (
    <div className="flex flex-col items-center bloomberg-border px-3 py-2 bg-gray-900">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className={`text-xl font-bold tabular-nums ${cls}`}>{value}</span>
    </div>
  );
}

const GRADE_LABELS: Record<string, string> = {
  CON: 'Contact', PWR: 'Power', EYE: 'Plate Disc.', SPD: 'Speed',
  FLD: 'Fielding', ARM: 'Arm Str.', DUR: 'Durability', BIQ: 'Baserunning',
  STF: 'Stuff', MOV: 'Movement', CMD: 'Command', STM: 'Stamina',
  PIQ: 'Pitching IQ',
};

function ToolBar({ label, abbr, value }: { label: string; abbr: string; value: number }) {
  const pct = Math.min(100, ((value - 20) / 60) * 100);
  const color =
    value >= 70 ? 'bg-green-500' :
    value >= 60 ? 'bg-blue-500' :
    value >= 50 ? 'bg-orange-400' :
    value >= 40 ? 'bg-yellow-500' :
    'bg-red-500';
  const textColor =
    value >= 70 ? 'text-green-400' :
    value >= 60 ? 'text-blue-400' :
    value >= 50 ? 'text-orange-400' :
    value >= 40 ? 'text-yellow-400' :
    'text-red-400';
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-gray-500 text-xs w-20 text-right truncate">{label}</span>
      <span className={`text-xs font-bold w-6 text-right tabular-nums ${textColor}`}>{value}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-gray-600 text-[10px] w-8">{abbr}</span>
    </div>
  );
}

function PhaseIndicator({ phase }: { phase: string }) {
  const phases = ['prospect', 'ascent', 'prime', 'decline', 'retirement'];
  const labels = ['DEV', 'RISE', 'PEAK', 'DEC', 'END'];
  const idx = phases.indexOf(phase);
  return (
    <div className="flex items-center gap-0.5">
      {phases.map((p, i) => (
        <div key={p} className="flex flex-col items-center">
          <div className={`w-8 h-1.5 rounded-full ${
            i === idx ? (i <= 2 ? 'bg-green-500' : 'bg-red-500') : 'bg-gray-800'
          }`} />
          <span className={`text-[9px] mt-0.5 ${i === idx ? 'text-gray-300 font-bold' : 'text-gray-700'}`}>
            {labels[i]}
          </span>
        </div>
      ))}
    </div>
  );
}

function TraitBadge({ trait }: { trait: PlayerTrait }) {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold"
      style={{ backgroundColor: trait.color + '20', color: trait.color }}
      title={trait.desc}>
      <span>{trait.label}</span>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const colors: Record<string, string> = {
    Low: 'bg-green-900/40 text-green-400',
    Medium: 'bg-yellow-900/40 text-yellow-400',
    High: 'bg-orange-900/40 text-orange-400',
    Extreme: 'bg-red-900/40 text-red-400',
  };
  return <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${colors[risk] ?? 'bg-gray-800 text-gray-400'}`}>{risk}</span>;
}

function CeilingBadge({ ceiling }: { ceiling: string }) {
  const colors: Record<string, string> = {
    Superstar: 'bg-yellow-900/40 text-yellow-400',
    'All-Star': 'bg-green-900/40 text-green-400',
    'Above Average': 'bg-blue-900/40 text-blue-400',
    Average: 'bg-gray-800 text-gray-400',
    Bench: 'bg-gray-800 text-gray-500',
    Organizational: 'bg-gray-900 text-gray-600',
  };
  return <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${colors[ceiling] ?? 'bg-gray-800 text-gray-400'}`}>{ceiling}</span>;
}

function statRow(label: string, value: number | undefined, decimals = 0): React.ReactNode {
  if (value === undefined || value === null) return null;
  const display = decimals > 0 ? value.toFixed(decimals) : String(value);
  return (
    <tr key={label} className="bloomberg-row text-xs">
      <td className="px-2 py-1 text-gray-500">{label}</td>
      <td className="text-right px-2 py-1 tabular-nums font-bold text-gray-200">{display}</td>
    </tr>
  );
}

export default function PlayerProfile() {
  const { selectedPlayerId, setActiveTab } = useUIStore();
  const { gameStarted } = useGameStore();
  const [data, setData] = useState<PlayerProfileData | null>(null);
  const [scouting, setScouting] = useState<ScoutingReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPlayerId || !gameStarted) return;
    setLoading(true);
    setError(null);
    Promise.all([
      getEngine().getPlayerProfile(selectedPlayerId),
      getEngine().getPlayerScoutingReport(selectedPlayerId),
    ])
      .then(([profile, report]) => { setData(profile); setScouting(report); })
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [selectedPlayerId, gameStarted]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (!selectedPlayerId) return <div className="p-4 text-gray-500 text-xs">Select a player from the roster or leaderboard.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading player data…</div>;
  if (error) return <div className="p-4 text-red-400 text-xs">{error}</div>;
  if (!data) return null;

  const { player, seasonStats } = data;
  const isPitcher = ['SP', 'RP', 'CL'].includes(player.position);

  const serviceYears = Math.floor(player.serviceTimeDays / 172);
  const serviceRem   = player.serviceTimeDays % 172;

  return (
    <div className="p-4 max-w-4xl">
      <button
        onClick={() => setActiveTab('roster')}
        className="text-gray-500 hover:text-orange-400 text-xs mb-4 transition-colors"
      >
        ← BACK TO ROSTER
      </button>

      {/* Header */}
      <div className="bloomberg-border mb-4">
        <div className="bloomberg-header flex justify-between items-center">
          <span>{player.name}</span>
          <span className="text-gray-500 font-normal">
            {player.position} · AGE {player.age} · {player.bats}/{player.throws}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-0 divide-x divide-gray-800">
          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs">STATUS</div>
            <div className="text-orange-400 font-bold">{player.rosterStatus.replace(/_/g, ' ')}</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs">CONTRACT</div>
            <div className="text-gray-200 font-bold">
              {player.contractYearsRemaining}Y / ${(player.salary / 1_000_000).toFixed(1)}M
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs">SERVICE TIME</div>
            <div className="text-gray-200 font-bold">{serviceYears}Y {serviceRem}D</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs">OVR / POT</div>
            <div className="text-orange-400 font-bold">{player.overall} / {player.potential}</div>
          </div>
        </div>
        {/* Trade value row */}
        <div className="grid grid-cols-2 gap-0 divide-x divide-gray-800 border-t border-gray-800">
          <div className="px-4 py-2">
            <div className="text-gray-500 text-xs">TRADE VALUE</div>
            <div className={`font-bold ${
              (data.tradeValue ?? 0) >= 70 ? 'text-green-400' :
              (data.tradeValue ?? 0) >= 40 ? 'text-orange-400' :
              'text-gray-400'
            }`}>
              {data.tradeValue ?? 0}
            </div>
          </div>
          <div className="px-4 py-2">
            <div className="text-gray-500 text-xs">MARKET VALUE</div>
            <div className="text-gray-200 font-bold">
              ${((data.marketSalary ?? 0) / 1_000_000).toFixed(1)}M/yr
            </div>
          </div>
        </div>
      </div>

      {/* Scouting Report */}
      {scouting && (
        <div className="bloomberg-border mb-4">
          <div className="bloomberg-header flex items-center justify-between">
            <span>SCOUTING REPORT</span>
            <div className="flex items-center gap-2">
              <CeilingBadge ceiling={scouting.ceiling} />
              <RiskBadge risk={scouting.risk} />
            </div>
          </div>
          <div className="p-3 space-y-3">
            {/* Summary */}
            <div className="text-orange-300 text-sm italic">{scouting.summary}</div>

            {/* Traits */}
            {scouting.traits.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600 text-[10px] font-bold">TRAITS:</span>
                {scouting.traits.map(t => <TraitBadge key={t.id} trait={t} />)}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Tool Bars */}
              <div>
                <div className="text-gray-500 text-[10px] font-bold mb-1">TOOL GRADES (20-80)</div>
                {Object.entries(player.grades).map(([abbr, val]) => (
                  <ToolBar key={abbr} abbr={abbr} label={GRADE_LABELS[abbr] ?? abbr} value={val} />
                ))}
              </div>

              {/* Development & Projection */}
              <div className="space-y-3">
                <div>
                  <div className="text-gray-500 text-[10px] font-bold mb-1">DEVELOPMENT PHASE</div>
                  <PhaseIndicator phase={scouting.devPhase} />
                  <div className="text-gray-400 text-xs mt-1">{scouting.agingCurvePhase}</div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="text-gray-600 text-[10px]">FV</div>
                    <div className={`font-bold text-lg tabular-nums ${
                      scouting.fv >= 60 ? 'text-green-400' : scouting.fv >= 50 ? 'text-orange-400' : 'text-gray-400'
                    }`}>{scouting.fv}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 text-[10px]">ETA</div>
                    <div className="text-blue-400 font-bold text-sm">{scouting.eta}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 text-[10px]">VOLATILITY</div>
                    <div className={`font-bold text-sm tabular-nums ${
                      scouting.sigma >= 22 ? 'text-red-400' : scouting.sigma >= 15 ? 'text-orange-400' : 'text-gray-400'
                    }`}>{scouting.sigma}</div>
                  </div>
                </div>

                {/* Pitch repertoire (pitchers only) */}
                {isPitcher && data.pitchMix && (
                  <div>
                    <div className="text-gray-500 text-[10px] font-bold mb-1">PITCH REPERTOIRE</div>
                    {[
                      { label: 'Fastball', pct: data.pitchMix.fastball, color: 'bg-red-500' },
                      { label: 'Breaking', pct: data.pitchMix.breaking, color: 'bg-blue-500' },
                      { label: 'Offspeed', pct: data.pitchMix.offspeed, color: 'bg-green-500' },
                    ].filter(p => p.pct > 0).map(p => (
                      <div key={p.label} className="flex items-center gap-2 py-0.5">
                        <span className="text-gray-500 text-xs w-16">{p.label}</span>
                        <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.pct}%` }} />
                        </div>
                        <span className="text-gray-300 tabular-nums text-xs font-bold w-8 text-right">{p.pct}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grade boxes (compact fallback if no scouting) */}
      {!scouting && (
        <div className="bloomberg-border mb-4">
          <div className="bloomberg-header">SCOUTING GRADES (20–80)</div>
          <div className="flex gap-2 flex-wrap p-3">
            {Object.entries(player.grades).map(([label, val]) => (
              <GradeBox key={label} label={label} value={val} />
            ))}
          </div>
        </div>
      )}

      {/* WAR headline (if season stats exist) */}
      {seasonStats && (seasonStats as Record<string, number>).war !== undefined && (
        <div className="bloomberg-border mb-4">
          <div className="grid grid-cols-3 gap-0 divide-x divide-gray-800">
            <div className="px-4 py-3 text-center">
              <div className="text-gray-500 text-xs">WAR</div>
              <div className={`text-2xl font-bold tabular-nums ${
                (seasonStats as Record<string, number>).war >= 5 ? 'text-green-400' :
                (seasonStats as Record<string, number>).war >= 2 ? 'text-orange-400' :
                (seasonStats as Record<string, number>).war >= 0 ? 'text-gray-200' :
                'text-red-400'
              }`}>
                {(seasonStats as Record<string, number>).war.toFixed(1)}
              </div>
            </div>
            <div className="px-4 py-3 text-center">
              <div className="text-gray-500 text-xs">{isPitcher ? 'ERA+' : 'wRC+'}</div>
              <div className={`text-2xl font-bold tabular-nums ${
                (isPitcher ? (seasonStats as Record<string, number>).eraPlus : (seasonStats as Record<string, number>).wrcPlus) >= 130 ? 'text-green-400' :
                (isPitcher ? (seasonStats as Record<string, number>).eraPlus : (seasonStats as Record<string, number>).wrcPlus) >= 100 ? 'text-orange-400' :
                'text-gray-400'
              }`}>
                {isPitcher
                  ? (seasonStats as Record<string, number>).eraPlus
                  : (seasonStats as Record<string, number>).wrcPlus
                }
              </div>
            </div>
            <div className="px-4 py-3 text-center">
              <div className="text-gray-500 text-xs">{isPitcher ? 'FIP' : 'OPS'}</div>
              <div className="text-2xl font-bold tabular-nums text-gray-200">
                {isPitcher
                  ? (seasonStats as Record<string, number>).fip?.toFixed(2)
                  : (seasonStats as Record<string, number>).ops?.toFixed(3)
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Season stats */}
      {seasonStats && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">SEASON {(seasonStats as Record<string, number>).season ?? '—'} STATISTICS</div>
          <div className="grid grid-cols-2 gap-4 p-0">
            <table className="w-full">
              <tbody>
                {isPitcher ? (
                  <>
                    {statRow('W',    (seasonStats as Record<string, number>).w)}
                    {statRow('L',    (seasonStats as Record<string, number>).l)}
                    {statRow('SV',   (seasonStats as Record<string, number>).sv)}
                    {statRow('GS',   (seasonStats as Record<string, number>).gs)}
                    {statRow('IP',   (seasonStats as Record<string, number>).ip, 1)}
                    {statRow('ERA',  (seasonStats as Record<string, number>).era, 2)}
                    {statRow('FIP',  (seasonStats as Record<string, number>).fip, 2)}
                    {statRow('WHIP', (seasonStats as Record<string, number>).whip, 2)}
                  </>
                ) : (
                  <>
                    {statRow('PA',  (seasonStats as Record<string, number>).pa)}
                    {statRow('AB',  (seasonStats as Record<string, number>).ab)}
                    {statRow('H',   (seasonStats as Record<string, number>).h)}
                    {statRow('2B',  (seasonStats as Record<string, number>).doubles)}
                    {statRow('3B',  (seasonStats as Record<string, number>).triples)}
                    {statRow('HR',  (seasonStats as Record<string, number>).hr)}
                    {statRow('R',   (seasonStats as Record<string, number>).r)}
                    {statRow('RBI', (seasonStats as Record<string, number>).rbi)}
                    {statRow('SB',  (seasonStats as Record<string, number>).sb)}
                    {statRow('CS',  (seasonStats as Record<string, number>).cs)}
                  </>
                )}
              </tbody>
            </table>
            <table className="w-full">
              <tbody>
                {isPitcher ? (
                  <>
                    {statRow('K',       (seasonStats as Record<string, number>).ka)}
                    {statRow('BB',      (seasonStats as Record<string, number>).bba)}
                    {statRow('HR',      (seasonStats as Record<string, number>).hra)}
                    {statRow('K/9',     (seasonStats as Record<string, number>).k9, 1)}
                    {statRow('BB/9',    (seasonStats as Record<string, number>).bb9, 1)}
                    {statRow('K/BB',    (seasonStats as Record<string, number>).kbb, 2)}
                    {statRow('QS',      (seasonStats as Record<string, number>).qs)}
                    {statRow('P/GS',    (seasonStats as Record<string, number>).avgPitches)}
                  </>
                ) : (
                  <>
                    {statRow('AVG', (seasonStats as Record<string, number>).avg, 3)}
                    {statRow('OBP', (seasonStats as Record<string, number>).obp, 3)}
                    {statRow('SLG', (seasonStats as Record<string, number>).slg, 3)}
                    {statRow('OPS', (seasonStats as Record<string, number>).ops, 3)}
                    {statRow('ISO', (seasonStats as Record<string, number>).iso, 3)}
                    {statRow('BABIP', (seasonStats as Record<string, number>).babip, 3)}
                    {statRow('BB',  (seasonStats as Record<string, number>).bb)}
                    {statRow('K',   (seasonStats as Record<string, number>).k)}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Career stats */}
      {data.careerStats && data.careerStats.seasons > 0 && (
        <div className="bloomberg-border mt-4">
          <div className="bloomberg-header">CAREER TOTALS ({data.careerStats.seasons} {data.careerStats.seasons === 1 ? 'SEASON' : 'SEASONS'})</div>
          <div className="grid grid-cols-2 gap-4 p-0">
            <table className="w-full">
              <tbody>
                {isPitcher ? (
                  <>
                    {statRow('W', data.careerStats.w)}
                    {statRow('L', data.careerStats.l)}
                    {statRow('SV', data.careerStats.sv)}
                    {statRow('IP', data.careerStats.ip, 1)}
                    {statRow('ERA', data.careerStats.era, 2)}
                    {statRow('WHIP', data.careerStats.whip, 2)}
                  </>
                ) : (
                  <>
                    {statRow('PA', data.careerStats.pa)}
                    {statRow('H', data.careerStats.h)}
                    {statRow('HR', data.careerStats.hr)}
                    {statRow('RBI', data.careerStats.rbi)}
                    {statRow('SB', data.careerStats.sb)}
                  </>
                )}
              </tbody>
            </table>
            <table className="w-full">
              <tbody>
                {isPitcher ? (
                  <>
                    {statRow('K', data.careerStats.ka)}
                    {statRow('BB', data.careerStats.bba)}
                    {statRow('HR', data.careerStats.hra)}
                    {statRow('QS', data.careerStats.qs)}
                    {statRow('CG', data.careerStats.cg)}
                    {statRow('SHO', data.careerStats.sho)}
                  </>
                ) : (
                  <>
                    {statRow('AVG', data.careerStats.avg, 3)}
                    {statRow('OBP', data.careerStats.obp, 3)}
                    {statRow('SLG', data.careerStats.slg, 3)}
                    {statRow('OPS', data.careerStats.ops, 3)}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Platoon splits (hitters only) */}
      {data.splits && !isPitcher && (data.splits.vsLHP.pa > 0 || data.splits.vsRHP.pa > 0) && (
        <div className="bloomberg-border mt-4">
          <div className="bloomberg-header">PLATOON SPLITS</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="px-2 py-1 text-left">SPLIT</th>
                <th className="px-2 py-1 text-right">PA</th>
                <th className="px-2 py-1 text-right">AVG</th>
                <th className="px-2 py-1 text-right">OBP</th>
                <th className="px-2 py-1 text-right">SLG</th>
                <th className="px-2 py-1 text-right">OPS</th>
                <th className="px-2 py-1 text-right">HR</th>
                <th className="px-2 py-1 text-right">BB</th>
                <th className="px-2 py-1 text-right">K</th>
              </tr>
            </thead>
            <tbody>
              {(['vsLHP', 'vsRHP'] as const).map(key => {
                const sp: SplitLine = data.splits![key];
                if (sp.pa === 0) return null;
                return (
                  <tr key={key} className="bloomberg-row">
                    <td className="px-2 py-1 text-gray-400 font-bold">{key === 'vsLHP' ? 'vs LHP' : 'vs RHP'}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-200">{sp.pa}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-200">{sp.avg.toFixed(3)}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-200">{sp.obp.toFixed(3)}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-200">{sp.slg.toFixed(3)}</td>
                    <td className="px-2 py-1 text-right tabular-nums font-bold text-orange-400">{sp.ops.toFixed(3)}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-200">{sp.hr}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-200">{sp.bb}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-200">{sp.k}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Season-by-season career log */}
      {data.seasonLog && data.seasonLog.length > 1 && (
        <div className="bloomberg-border mt-4">
          <div className="bloomberg-header">YEAR-BY-YEAR LOG</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="px-2 py-1 text-left">YR</th>
                  <th className="px-2 py-1 text-left">TEAM</th>
                  <th className="px-2 py-1 text-right">AGE</th>
                  {isPitcher ? (
                    <>
                      <th className="px-2 py-1 text-right">W</th>
                      <th className="px-2 py-1 text-right">L</th>
                      <th className="px-2 py-1 text-right">SV</th>
                      <th className="px-2 py-1 text-right">IP</th>
                      <th className="px-2 py-1 text-right">ERA</th>
                      <th className="px-2 py-1 text-right">K</th>
                      <th className="px-2 py-1 text-right">QS</th>
                    </>
                  ) : (
                    <>
                      <th className="px-2 py-1 text-right">G</th>
                      <th className="px-2 py-1 text-right">PA</th>
                      <th className="px-2 py-1 text-right">H</th>
                      <th className="px-2 py-1 text-right">HR</th>
                      <th className="px-2 py-1 text-right">RBI</th>
                      <th className="px-2 py-1 text-right">SB</th>
                      <th className="px-2 py-1 text-right">AVG</th>
                    </>
                  )}
                  <th className="px-2 py-1 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {data.seasonLog.map(entry => (
                  <tr key={entry.season} className="bloomberg-row">
                    <td className="px-2 py-1 text-gray-400 tabular-nums">{entry.season}</td>
                    <td className="px-2 py-1 text-gray-500">{entry.teamName}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-500">{entry.age}</td>
                    {isPitcher ? (
                      <>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.w}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.l}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.sv}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.ip.toFixed(1)}</td>
                        <td className="px-2 py-1 text-right tabular-nums font-bold text-orange-400">{entry.era.toFixed(2)}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.ka}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.qs}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.g}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.pa}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.h}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.hr}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.rbi}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.sb}</td>
                        <td className="px-2 py-1 text-right tabular-nums font-bold text-orange-400">{entry.avg.toFixed(3)}</td>
                      </>
                    )}
                    <td className="px-2 py-1 text-yellow-500 text-xs">
                      {entry.awards.length > 0 ? entry.awards.join(', ') : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!seasonStats && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">STATISTICS</div>
          <div className="p-4 text-gray-500 text-xs">Simulate a season to see stats.</div>
        </div>
      )}
    </div>
  );
}

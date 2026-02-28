import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import type { Coach, CoachingStaffData } from '../../engine/coaching/coachingStaff';
import { SPECIALTY_LABELS, ROLE_LABELS } from '../../engine/coaching/coachingStaff';
import type { TeamChemistryData } from '../../engine/chemistry/teamChemistry';
import type { OwnerGoalsState } from '../../engine/owner/ownerGoals';
import { MANDATE_LABELS, ARCHETYPE_LABELS } from '../../engine/owner/ownerGoals';

type SubTab = 'staff' | 'chemistry' | 'owner' | 'extensions' | 'waivers';

function QualityBadge({ quality }: { quality: number }) {
  const color = quality >= 65 ? '#4ade80' : quality >= 55 ? '#86efac' : quality >= 45 ? '#fbbf24' : '#ef4444';
  return <span className="font-bold tabular-nums" style={{ color }}>{quality}</span>;
}

function BarFill({ value, max = 100, color = 'orange' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const colors: Record<string, string> = {
    orange: 'bg-orange-500', green: 'bg-green-500', red: 'bg-red-500', blue: 'bg-blue-500', yellow: 'bg-yellow-500',
  };
  return (
    <div className="w-20 h-1.5 bg-gray-800 rounded overflow-hidden inline-block ml-2">
      <div className={`h-full ${colors[color] ?? 'bg-orange-500'} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function CoachingStaffView() {
  const { gameStarted, userTeamId } = useGameStore();
  const [tab, setTab] = useState<SubTab>('staff');
  const [staffData, setStaffData] = useState<CoachingStaffData | null>(null);
  const [chemistry, setChemistry] = useState<TeamChemistryData | null>(null);
  const [ownerState, setOwnerState] = useState<OwnerGoalsState | null>(null);
  const [hiringPool, setHiringPool] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!gameStarted || !userTeamId) return;
    setLoading(true);
    const engine = getEngine();
    const [staff, chem, owner, pool] = await Promise.all([
      engine.getCoachingStaff(userTeamId),
      engine.getTeamChemistry(userTeamId),
      engine.getOwnerGoals(),
      engine.getCoachingPool(),
    ]);
    setStaffData(staff);
    setChemistry(chem);
    setOwnerState(owner);
    setHiringPool(pool);
    setLoading(false);
  }, [gameStarted, userTeamId]);

  useEffect(() => { loadData(); }, [loadData]);

  const hireCoach = async (coachId: number) => {
    const engine = getEngine();
    await engine.hireCoach(coachId);
    loadData();
  };

  const fireCoach = async (coachId: number) => {
    const engine = getEngine();
    await engine.fireCoach(coachId);
    loadData();
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const tabs: Array<{ id: SubTab; label: string }> = [
    { id: 'staff', label: 'COACHING STAFF' },
    { id: 'chemistry', label: 'CHEMISTRY' },
    { id: 'owner', label: 'OWNER & GM' },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>FRONT OFFICE</span>
        <div className="flex items-center gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`text-xs font-bold px-3 py-1 uppercase tracking-wider transition-colors ${
                tab === t.id ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-orange-400 text-xs animate-pulse">Loading front office data...</div>
      ) : (
        <>
          {/* ── Coaching Staff ── */}
          {tab === 'staff' && staffData && (
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 bloomberg-border">
                <div className="bloomberg-header">YOUR COACHING STAFF (${(staffData.totalSalary / 1_000_000).toFixed(1)}M total)</div>
                <div className="space-y-2 p-3">
                  {staffData.coaches.length === 0 ? (
                    <div className="text-gray-600 text-xs text-center py-4">No coaches on staff. Hire from the pool.</div>
                  ) : staffData.coaches.map(c => (
                    <div key={c.coachId} className="flex items-center justify-between bg-gray-900 rounded px-3 py-2">
                      <div className="flex items-center gap-3">
                        <div className="text-center w-10">
                          <QualityBadge quality={c.quality} />
                          <div className="text-gray-700 text-[10px]">OVR</div>
                        </div>
                        <div>
                          <div className="text-orange-300 font-bold text-xs">{c.name}</div>
                          <div className="text-gray-500 text-[10px]">{ROLE_LABELS[c.role]} — {SPECIALTY_LABELS[c.specialty]}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-gray-400 text-xs tabular-nums">${(c.salary / 1_000_000).toFixed(1)}M/yr</div>
                          <div className="text-gray-600 text-[10px]">{c.contractYears}yr left</div>
                        </div>
                        <button onClick={() => fireCoach(c.coachId)}
                          className="text-red-500 text-[10px] px-2 py-1 bg-red-900/20 rounded hover:bg-red-900/40">
                          FIRE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bloomberg-border">
                <div className="bloomberg-header">COACHING EFFECTS</div>
                <div className="p-3 space-y-3">
                  <EffectRow label="Development" value={staffData.devBonus} baseline={1.0} suffix="x" />
                  <EffectRow label="Pitcher Dev" value={staffData.pitcherDevBonus} baseline={1.0} suffix="x" />
                  <EffectRow label="Hitter Dev" value={staffData.hitterDevBonus} baseline={1.0} suffix="x" />
                  <EffectRow label="Chemistry" value={staffData.chemistryBonus} baseline={0} suffix="" pct />
                  <EffectRow label="Injury Reduction" value={staffData.injuryReduction} baseline={0} suffix="" pct />
                  <EffectRow label="Scouting Boost" value={staffData.scoutingBonus} baseline={0} suffix="" pct />
                </div>
                <div className="bloomberg-header mt-4">AVAILABLE COACHES</div>
                <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                  {hiringPool.slice(0, 15).map(c => (
                    <div key={c.coachId} className="flex items-center justify-between bg-gray-900/50 rounded px-2 py-1">
                      <div>
                        <span className="text-orange-300 text-xs font-bold">{c.name}</span>
                        <span className="text-gray-600 text-[10px] ml-2">{ROLE_LABELS[c.role]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <QualityBadge quality={c.quality} />
                        <button onClick={() => hireCoach(c.coachId)}
                          className="text-green-400 text-[10px] px-2 py-0.5 bg-green-900/20 rounded hover:bg-green-900/40">
                          HIRE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Chemistry ── */}
          {tab === 'chemistry' && chemistry && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bloomberg-border p-4">
                <div className="text-gray-600 text-xs mb-3 uppercase tracking-wider">Team Chemistry</div>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold" style={{
                    color: chemistry.overall >= 70 ? '#4ade80' : chemistry.overall >= 50 ? '#fbbf24' : '#ef4444'
                  }}>{chemistry.overall}</div>
                  <div className="text-sm font-bold" style={{
                    color: chemistry.overall >= 70 ? '#4ade80' : chemistry.overall >= 50 ? '#fbbf24' : '#ef4444'
                  }}>{chemistry.clubhouseRating}</div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Cohesion</span><span className="text-gray-300">{chemistry.cohesion}<BarFill value={chemistry.cohesion} /></span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Leadership</span><span className="text-gray-300">{chemistry.leadershipScore}/30<BarFill value={chemistry.leadershipScore} max={30} /></span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Avg Morale</span><span className="text-gray-300">{chemistry.moraleAvg}<BarFill value={chemistry.moraleAvg} /></span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Perf. Bonus</span><span className={chemistry.performanceBonus >= 0 ? 'text-green-400' : 'text-red-400'}>{chemistry.performanceBonus > 0 ? '+' : ''}{(chemistry.performanceBonus * 100).toFixed(1)}%</span></div>
                </div>
              </div>
              <div className="col-span-2 bloomberg-border">
                <div className="bloomberg-header">CHEMISTRY EVENTS</div>
                <div className="p-3 space-y-2 max-h-32 overflow-y-auto mb-3">
                  {chemistry.events.length === 0 ? (
                    <div className="text-gray-600 text-xs text-center py-2">No chemistry events this season.</div>
                  ) : chemistry.events.map((e, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className={`font-bold ${e.impact > 0 ? 'text-green-400' : 'text-red-400'}`}>{e.impact > 0 ? '+' : ''}{e.impact}</span>
                      <span className="text-gray-400">{e.description}</span>
                    </div>
                  ))}
                </div>
                <div className="bloomberg-header">PLAYER MORALE</div>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-600 text-[10px] border-b border-gray-800">
                        <th className="px-2 py-1 text-left">PLAYER</th>
                        <th className="px-2 py-1">ROLE</th>
                        <th className="px-2 py-1">MORALE</th>
                        <th className="px-2 py-1">LEADERSHIP</th>
                        <th className="px-2 py-1">FIT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chemistry.playerMorales.slice(0, 20).map(pm => (
                        <tr key={pm.playerId} className="text-xs hover:bg-gray-800/50">
                          <td className="px-2 py-0.5 text-orange-300 font-bold">{pm.name}</td>
                          <td className="px-2 py-0.5 text-gray-500 text-center capitalize">{pm.role.replace('_', ' ')}</td>
                          <td className="px-2 py-0.5 text-center">
                            <span style={{ color: pm.morale >= 60 ? '#4ade80' : pm.morale >= 40 ? '#fbbf24' : '#ef4444' }}>{pm.morale}</span>
                          </td>
                          <td className="px-2 py-0.5 text-center text-gray-400">{pm.leadershipValue > 0 ? pm.leadershipValue : '—'}</td>
                          <td className="px-2 py-0.5 text-center">
                            <span style={{ color: pm.chemistryFit > 0 ? '#4ade80' : pm.chemistryFit < 0 ? '#ef4444' : '#9ca3af' }}>
                              {pm.chemistryFit > 0 ? '+' : ''}{pm.chemistryFit}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Owner & GM ── */}
          {tab === 'owner' && ownerState && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bloomberg-border p-4">
                <div className="text-gray-600 text-xs mb-3 uppercase tracking-wider">Owner Profile</div>
                <div className="space-y-2 text-xs">
                  <div className="text-orange-300 font-bold text-sm">{ownerState.owner.name}</div>
                  <div className="text-gray-500">{ARCHETYPE_LABELS[ownerState.owner.archetype]}</div>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between"><span className="text-gray-500">Patience</span><span className="text-gray-300">{ownerState.owner.patience}<BarFill value={ownerState.owner.patience} /></span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Spending</span><span className="text-gray-300">{ownerState.owner.spendingWilling}<BarFill value={ownerState.owner.spendingWilling} color="green" /></span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Dev Focus</span><span className="text-gray-300">{ownerState.owner.devFocus}<BarFill value={ownerState.owner.devFocus} color="blue" /></span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Fan Relations</span><span className="text-gray-300">{ownerState.owner.fanRelations}<BarFill value={ownerState.owner.fanRelations} color="yellow" /></span></div>
                  </div>
                </div>
              </div>
              <div className="bloomberg-border p-4">
                <div className="text-gray-600 text-xs mb-3 uppercase tracking-wider">GM Status</div>
                <div className="text-center mb-3">
                  <div className="text-3xl font-bold" style={{
                    color: ownerState.jobSecurity >= 60 ? '#4ade80' : ownerState.jobSecurity >= 35 ? '#fbbf24' : '#ef4444'
                  }}>{ownerState.jobSecurity}</div>
                  <div className="text-gray-500 text-xs">JOB SECURITY</div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Mandate</span><span className="text-blue-400 font-bold">{MANDATE_LABELS[ownerState.mandate]}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Years as GM</span><span className="text-gray-300">{ownerState.yearsAsGM}</span></div>
                </div>
              </div>
              <div className="bloomberg-border">
                <div className="bloomberg-header">SEASON GOALS</div>
                <div className="p-3 space-y-2">
                  {ownerState.seasonGoals.map((g, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={g.met ? 'text-green-400' : 'text-gray-500'}>{g.met ? '✓' : '○'}</span>
                        <span className="text-gray-300">{g.target}</span>
                      </div>
                      <span className="text-gray-600">{Math.round(g.weight * 100)}%</span>
                    </div>
                  ))}
                </div>
                {ownerState.evaluations.length > 0 && (
                  <>
                    <div className="bloomberg-header">EVALUATIONS</div>
                    <div className="p-3 space-y-1 max-h-32 overflow-y-auto">
                      {ownerState.evaluations.map((e, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Season {e.season}</span>
                          <span className="font-bold" style={{
                            color: e.overallGrade.startsWith('A') ? '#4ade80' : e.overallGrade.startsWith('B') ? '#86efac' : e.overallGrade.startsWith('C') ? '#fbbf24' : '#ef4444'
                          }}>{e.overallGrade}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EffectRow({ label, value, baseline, suffix, pct }: { label: string; value: number; baseline: number; suffix: string; pct?: boolean }) {
  const isPositive = value > baseline;
  const display = pct ? `${(value * 100).toFixed(1)}%` : `${value.toFixed(2)}${suffix}`;
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={isPositive ? 'text-green-400 font-bold' : value < baseline ? 'text-red-400 font-bold' : 'text-gray-400'}>
        {display}
      </span>
    </div>
  );
}

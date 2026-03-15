/**
 * DraftGradeReport — Post-draft class evaluation with overall grade
 * and pick-by-pick analysis. Ported from MFD's POST_DRAFT_GRADES_993.
 */

import { classifyPick, ANALYSTS, type ReactionType } from '../../data/draftAnalysts';

interface DraftPickInfo {
  pickNumber: number;
  round: number;
  playerName: string;
  position: string;
  scoutedOvr: number;
}

interface DraftGradeReportProps {
  userPicks: DraftPickInfo[];
  totalPicksInDraft: number;
}

const TYPE_BADGE: Record<ReactionType, { label: string; color: string }> = {
  steal: { label: 'STEAL', color: '#4ade80' },
  value: { label: 'VALUE', color: '#60a5fa' },
  solid: { label: 'SOLID', color: '#94a3b8' },
  reach: { label: 'REACH', color: '#fb923c' },
  bust:  { label: 'BUST',  color: '#ef4444' },
};

function computeGrade(picks: DraftPickInfo[], totalPicks: number): { grade: string; color: string; surplus: number } {
  let totalSurplus = 0;
  for (const pick of picks) {
    const expectedPick = Math.max(1, Math.round(totalPicks * (1 - (pick.scoutedOvr - 20) / 60)));
    totalSurplus += expectedPick - pick.pickNumber;
  }

  // Normalize by number of picks
  const avgSurplus = picks.length > 0 ? totalSurplus / picks.length : 0;

  if (avgSurplus >= 15) return { grade: 'A+', color: '#4ade80', surplus: totalSurplus };
  if (avgSurplus >= 10) return { grade: 'A',  color: '#4ade80', surplus: totalSurplus };
  if (avgSurplus >= 5)  return { grade: 'B+', color: '#60a5fa', surplus: totalSurplus };
  if (avgSurplus >= 0)  return { grade: 'B',  color: '#60a5fa', surplus: totalSurplus };
  if (avgSurplus >= -5) return { grade: 'C',  color: '#fbbf24', surplus: totalSurplus };
  return                        { grade: 'D',  color: '#ef4444', surplus: totalSurplus };
}

export default function DraftGradeReport({ userPicks, totalPicksInDraft }: DraftGradeReportProps) {
  if (userPicks.length === 0) return null;

  const { grade, color, surplus } = computeGrade(userPicks, totalPicksInDraft);

  // Find best and riskiest picks
  const classified = userPicks.map(p => ({
    ...p,
    type: classifyPick(p.scoutedOvr, p.pickNumber, p.round, totalPicksInDraft),
    expectedPick: Math.max(1, Math.round(totalPicksInDraft * (1 - (p.scoutedOvr - 20) / 60))),
  }));

  const bestPick = classified.reduce((best, p) =>
    (p.expectedPick - p.pickNumber) > (best.expectedPick - best.pickNumber) ? p : best
  );
  const riskiestPick = classified.reduce((worst, p) =>
    (p.expectedPick - p.pickNumber) < (worst.expectedPick - worst.pickNumber) ? p : worst
  );

  // Get analyst summary
  const analyst = ANALYSTS[userPicks.length % ANALYSTS.length];
  const steals = classified.filter(p => p.type === 'steal').length;
  const reaches = classified.filter(p => p.type === 'reach' || p.type === 'bust').length;

  return (
    <div className="space-y-3">
      {/* Overall Grade */}
      <div
        className="text-center py-4 rounded-lg"
        style={{
          background: 'rgba(0,0,0,0.4)',
          border: `2px solid ${color}50`,
        }}
      >
        <div className="text-gray-500 text-[10px] font-bold tracking-widest mb-1">DRAFT CLASS GRADE</div>
        <div className="font-black text-5xl tabular-nums" style={{ color }}>{grade}</div>
        <div className="text-gray-500 text-xs mt-1">
          {surplus >= 0 ? '+' : ''}{surplus} total surplus value · {userPicks.length} picks
        </div>
      </div>

      {/* Analyst summary */}
      <div
        className="rounded-lg px-3 py-2"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base">{analyst.emoji}</span>
          <span className="text-xs font-bold text-gray-300">{analyst.name}</span>
          <span className="text-gray-500 text-[9px]">{analyst.title}</span>
        </div>
        <p className="text-gray-400 text-xs italic leading-relaxed">
          &ldquo;Overall, I give this class a {grade}.
          {steals > 0 ? ` ${steals} steal${steals > 1 ? 's' : ''} really boosted the value.` : ''}
          {reaches > 0 ? ` ${reaches} questionable pick${reaches > 1 ? 's' : ''} that could haunt them.` : ''}
          {steals === 0 && reaches === 0 ? ' Solid, no-nonsense drafting across the board.' : ''}
          &rdquo;
        </p>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.15)' }}>
          <div className="text-green-500 text-[9px] font-bold tracking-widest">BEST PICK</div>
          <div className="text-gray-200 text-xs font-bold mt-0.5">{bestPick.playerName}</div>
          <div className="text-gray-500 text-[10px]">
            {bestPick.position} · R{bestPick.round} #{bestPick.pickNumber} · OVR {bestPick.scoutedOvr}
          </div>
        </div>
        <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(251,146,60,0.05)', border: '1px solid rgba(251,146,60,0.15)' }}>
          <div className="text-orange-400 text-[9px] font-bold tracking-widest">RISKIEST PICK</div>
          <div className="text-gray-200 text-xs font-bold mt-0.5">{riskiestPick.playerName}</div>
          <div className="text-gray-500 text-[10px]">
            {riskiestPick.position} · R{riskiestPick.round} #{riskiestPick.pickNumber} · OVR {riskiestPick.scoutedOvr}
          </div>
        </div>
      </div>

      {/* Pick-by-pick breakdown */}
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 tracking-widest" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          PICK-BY-PICK
        </div>
        <div className="divide-y divide-gray-800/50">
          {classified.map(p => {
            const badge = TYPE_BADGE[p.type];
            return (
              <div key={p.pickNumber} className="flex items-center gap-2 px-3 py-1.5 text-xs">
                <span className="text-gray-500 tabular-nums w-6">R{p.round}</span>
                <span className="text-gray-500 tabular-nums w-8">#{p.pickNumber}</span>
                <span className="text-gray-400 w-6 text-center">{p.position}</span>
                <span className="text-gray-300 font-bold flex-1 truncate">{p.playerName}</span>
                <span className="text-gray-500 tabular-nums w-6 text-right">{p.scoutedOvr}</span>
                <span
                  className="text-[9px] font-black tracking-wider w-12 text-right"
                  style={{ color: badge.color }}
                >
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

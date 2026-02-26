/**
 * DevGradeCard.tsx — MFSN Development Grade Card
 *
 * An "analyst" grades your franchise's player development operation each season.
 * Score is based on:
 *   - Breakout Watch hits/busts (weighted most heavily)
 *   - Last season breakout count
 *   - Franchise history consistency
 */

import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';

// ─── Data ─────────────────────────────────────────────────────────────────────

const DEV_SOURCES = [
  'The Pipeline Report',
  'Farm & Field Insider',
  'Development Digest',
  'MFSN Prospect Watch',
];

function getGradeInfo(score: number): { letter: string; color: string; desc: string } {
  if (score >= 90) return { letter: 'S',  color: '#fbbf24', desc: 'Elite development machine' };
  if (score >= 80) return { letter: 'A+', color: '#4ade80', desc: 'Best-in-class farm system' };
  if (score >= 70) return { letter: 'A',  color: '#86efac', desc: 'Top-tier developer' };
  if (score >= 60) return { letter: 'B+', color: '#a3e635', desc: 'Above-average pipeline' };
  if (score >= 50) return { letter: 'B',  color: '#fbbf24', desc: 'Solid development program' };
  if (score >= 40) return { letter: 'C',  color: '#fb923c', desc: 'Below-average development' };
  if (score >= 30) return { letter: 'D',  color: '#ef4444', desc: 'Struggling to develop talent' };
  return                  { letter: 'F',  color: '#dc2626', desc: 'Major pipeline concerns' };
}

function buildAnalystQuote(grade: string, hits: number, busts: number, seasonsManaged: number): string {
  if (grade === 'S' || grade === 'A+') {
    return `This organization is doing something right in the development lab. The infrastructure is elite and producing real results season after season.`;
  }
  if (grade === 'A') {
    return hits > 0
      ? `${hits} Breakout Watch hit${hits > 1 ? 's' : ''} this cycle is encouraging. The process is working.`
      : `Solid overall metrics. The pipeline shows real depth, even if the headliners haven't arrived yet.`;
  }
  if (grade === 'B+') {
    return `A strong development year. Not quite elite, but clearly trending in the right direction.`;
  }
  if (grade === 'B') {
    return `A mixed bag. The farm system has exciting names, but converting potential to production remains inconsistent.`;
  }
  if (grade === 'C') {
    if (busts > 0) return `${busts} Breakout Watch bust${busts > 1 ? 's' : ''} raises questions about the coaching staff's ability to unlock prospect talent.`;
    return `Development metrics are average at best. No disasters, but no standouts either.`;
  }
  if (seasonsManaged <= 2) {
    return `Early days for this front office. Give the development program time before drawing conclusions.`;
  }
  return `Significant red flags in the pipeline. The current approach isn't producing MLB-caliber talent at an acceptable rate.`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DevGradeCard({
  lastSeasonBreakouts = 0,
  lastSeasonBusts     = 0,
}: {
  lastSeasonBreakouts?: number;
  lastSeasonBusts?:     number;
}) {
  const { breakoutWatch, seasonsManaged } = useGameStore();
  const { franchiseHistory } = useLeagueStore();

  if (seasonsManaged === 0) return null;

  // Breakout Watch performance
  const watchResolved = breakoutWatch.filter(c => c.hit !== null);
  const watchHits     = breakoutWatch.filter(c => c.hit === true).length;
  const watchBusts    = breakoutWatch.filter(c => c.hit === false).length;
  const watchTotal    = watchResolved.length;

  // ── Score computation ──────────────────────────────────────────────────────
  let score = 50; // Base: B

  // Breakout Watch component (±30 pts) — only applies if we had a watch
  if (watchTotal > 0) {
    const hitRate = watchHits / watchTotal;
    score += Math.round((hitRate - 0.33) * 90); // 100%=+60, 33%=0, 0%=-30
  }

  // Last season events component (±20 pts)
  score += Math.min(20, lastSeasonBreakouts * 5);
  score -= Math.min(15, lastSeasonBusts * 4);

  // Franchise history consistency (±20 pts) — uses all history
  if (franchiseHistory.length >= 2) {
    const totalHits  = franchiseHistory.reduce((s, h) => s + h.breakoutHits, 0);
    const hitsPerSeason = totalHits / franchiseHistory.length;
    score += Math.round((hitsPerSeason - 0.5) * 20);
  }

  score = Math.max(5, Math.min(100, score));

  const gradeInfo   = getGradeInfo(score);
  const sourceIdx   = seasonsManaged % DEV_SOURCES.length;
  const analystTake = buildAnalystQuote(gradeInfo.letter, watchHits, watchBusts, seasonsManaged);

  return (
    <div className="bloomberg-border bg-gray-900">
      {/* Header */}
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>DEVELOPMENT GRADE</span>
        <span className="text-gray-600 text-xs normal-case font-normal">
          {DEV_SOURCES[sourceIdx]}
        </span>
      </div>

      {/* Content */}
      <div className="px-4 py-3 flex gap-4 items-start">
        {/* Grade bubble */}
        <div
          className="shrink-0 w-16 h-16 rounded-xl flex items-center justify-center font-black text-2xl"
          style={{
            background: `${gradeInfo.color}15`,
            border:     `2px solid ${gradeInfo.color}40`,
            color:      gradeInfo.color,
          }}
        >
          {gradeInfo.letter}
        </div>

        {/* Right side */}
        <div className="flex-1 space-y-2 min-w-0">
          <div>
            <div className="font-bold text-sm" style={{ color: gradeInfo.color }}>
              {gradeInfo.desc}
            </div>
            <div className="text-gray-500 text-xs italic mt-0.5 leading-snug">
              "{analystTake}"
            </div>
          </div>

          {/* Score bar */}
          <div>
            <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${score}%`, background: gradeInfo.color }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-700 mt-0.5">
              <span>Score: {score}/100</span>
              {watchTotal > 0 && (
                <span className="flex gap-2">
                  <span>Watch:</span>
                  <span className="text-green-400">{watchHits}✓</span>
                  {watchBusts > 0 && <span className="text-red-400">{watchBusts}✗</span>}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

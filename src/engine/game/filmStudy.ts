/**
 * Post-Game Film Study
 *
 * Detailed post-game analysis with pitching, hitting, fielding, and
 * baserunning grades, tactical insights, and turning point narratives.
 */

// ─── Grade helpers ──────────────────────────────────────────────────────────

export function letterGrade(n: number): string {
  return n >= 93 ? 'A+' : n >= 87 ? 'A' : n >= 82 ? 'B+' : n >= 76 ? 'B' : n >= 68 ? 'C+' : n >= 58 ? 'C' : n >= 48 ? 'D' : 'F';
}

export function gradeColor(n: number): string {
  return n >= 82 ? '#22c55e' : n >= 68 ? '#eab308' : n >= 48 ? '#f97316' : '#ef4444';
}

// ─── Types ──────────────────────────────────────────────────────────────────

export type PhaseGrade = 'pitching' | 'hitting' | 'fielding' | 'baserunning';

export interface GameInsight {
  emoji: string;
  text: string;
  grade: string;
  phase: PhaseGrade;
}

export interface FilmStudyReport {
  id: number;
  won: boolean;
  userScore: number;
  oppScore: number;
  userTeam: string;
  oppTeam: string;
  date: string;
  grades: Record<PhaseGrade, number>;
  overall: number;
  insights: GameInsight[];
  turningPoint: string;
  keyMoment: string;
  pitcherLine: { name: string; ip: number; h: number; er: number; k: number; bb: number };
  topHitter: { name: string; ab: number; h: number; hr: number; rbi: number };
}

// ─── Insight templates ──────────────────────────────────────────────────────

const PITCHING_INSIGHTS: Array<{ test: (r: FilmStudyReport) => boolean; insight: GameInsight }> = [
  { test: r => r.pitcherLine.k >= 10, insight: { emoji: '🔥', text: 'Starter was dominant — double-digit strikeouts.', grade: 'A', phase: 'pitching' } },
  { test: r => r.pitcherLine.bb >= 5, insight: { emoji: '⚠️', text: 'Walk fest on the mound. Command was a serious issue.', grade: 'D', phase: 'pitching' } },
  { test: r => r.pitcherLine.ip >= 7, insight: { emoji: '✅', text: 'Quality start with 7+ innings. Saved the bullpen.', grade: 'A', phase: 'pitching' } },
  { test: r => r.pitcherLine.er >= 5, insight: { emoji: '💣', text: 'Starter got shelled — 5+ earned runs allowed.', grade: 'F', phase: 'pitching' } },
];

const HITTING_INSIGHTS: Array<{ test: (r: FilmStudyReport) => boolean; insight: GameInsight }> = [
  { test: r => r.topHitter.hr >= 2, insight: { emoji: '💪', text: 'Multi-homer game from the lineup. Power was on display.', grade: 'A', phase: 'hitting' } },
  { test: r => r.userScore >= 8, insight: { emoji: '🏏', text: 'Offense exploded for 8+ runs. Approach was outstanding.', grade: 'A+', phase: 'hitting' } },
  { test: r => r.userScore <= 2, insight: { emoji: '😔', text: 'Bats went silent. Only managed 2 or fewer runs.', grade: 'D', phase: 'hitting' } },
  { test: r => r.topHitter.rbi >= 4, insight: { emoji: '🎯', text: 'Clutch hitting with 4+ RBIs from a single player.', grade: 'A', phase: 'hitting' } },
];

const TURNING_POINTS = [
  { test: (won: boolean, margin: number) => margin <= 1, text: 'One-run game decided in the final at-bat. Pure drama.' },
  { test: (won: boolean, margin: number) => margin <= 2, text: 'Close game throughout — small execution differences decided it.' },
  { test: (won: boolean, margin: number) => won && margin >= 7, text: 'Complete domination from the first pitch to the last.' },
  { test: (won: boolean, margin: number) => !won && margin >= 7, text: 'This was a clinic by the opposition. We need a hard reset.' },
  { test: (won: boolean, margin: number) => won && margin >= 4, text: 'Comfortable win with good pitching and timely hitting.' },
  { test: (_won: boolean, _margin: number) => true, text: 'Competitive game with momentum swings on both sides.' },
];

const KEY_MOMENTS = [
  'Two-out RBI single in the 5th broke the game open',
  'Double play in the 7th killed a rally and changed momentum',
  'Leadoff triple in the 3rd set the tone',
  'Bases-loaded walk in the 6th was the turning point',
  'Diving catch in center field robbed a sure extra-base hit',
  'Wild pitch in the 8th let the tying run score',
  'Three-run homer in the 4th put the game out of reach',
  'Squeeze bunt scored the go-ahead run in the 7th',
  'Pickoff at second base ended a threatening inning',
  'Pinch-hit double drove in the winning runs',
];

// ─── Demo data ──────────────────────────────────────────────────────────────

const PITCHER_NAMES = ['Cole Anderson', 'Marcus Webb', 'Tyler Ohtani', 'Shane Gray', 'Ryan Castillo'];
const HITTER_NAMES = ['Jose Torres', 'Mike Richardson', 'Derek Yamamoto', 'Brandon Cruz', 'Kyle Parker'];
const OPPONENTS = ['NYY', 'BOS', 'LAD', 'CHC', 'ATL', 'HOU', 'SF', 'SD', 'PHI', 'TB'];

export function generateDemoFilmStudy(): FilmStudyReport[] {
  return Array.from({ length: 8 }, (_, i) => {
    const won = i % 3 !== 2;
    const userScore = 3 + (i * 2 + 1) % 7;
    const oppScore = won ? userScore - 1 - (i % 3) : userScore + 1 + (i % 4);
    const margin = Math.abs(userScore - oppScore);

    const pitcherLine = {
      name: PITCHER_NAMES[i % PITCHER_NAMES.length],
      ip: 5 + (i % 4),
      h: 3 + (i * 3) % 6,
      er: Math.max(0, oppScore - (i % 3)),
      k: 4 + (i * 5) % 9,
      bb: (i * 2) % 5,
    };

    const topHitter = {
      name: HITTER_NAMES[i % HITTER_NAMES.length],
      ab: 4 + (i % 2),
      h: 1 + (i * 3) % 4,
      hr: i % 3 === 0 ? 2 : i % 2,
      rbi: 1 + (i * 2) % 5,
    };

    const report: FilmStudyReport = {
      id: i,
      won,
      userScore,
      oppScore,
      userTeam: 'NYM',
      oppTeam: OPPONENTS[i % OPPONENTS.length],
      date: `2024-${String(6 + Math.floor(i / 3)).padStart(2, '0')}-${String(5 + (i * 4) % 25).padStart(2, '0')}`,
      grades: {
        pitching: Math.min(99, Math.max(30, 72 + (won ? 8 : -10) + (pitcherLine.k * 2) - (pitcherLine.bb * 3) - (pitcherLine.er * 4))),
        hitting: Math.min(99, Math.max(30, 65 + (userScore - 4) * 4 + topHitter.hr * 5)),
        fielding: Math.min(99, Math.max(40, 73 + (i * 7) % 15 - 5)),
        baserunning: Math.min(99, Math.max(40, 70 + (i * 11) % 18 - 5)),
      },
      overall: 0,
      insights: [],
      turningPoint: '',
      keyMoment: KEY_MOMENTS[i % KEY_MOMENTS.length],
      pitcherLine,
      topHitter,
    };

    report.overall = Math.round((report.grades.pitching + report.grades.hitting + report.grades.fielding + report.grades.baserunning) / 4);

    // Generate insights
    for (const pi of PITCHING_INSIGHTS) if (pi.test(report)) { report.insights.push(pi.insight); break; }
    for (const hi of HITTING_INSIGHTS) if (hi.test(report)) { report.insights.push(hi.insight); break; }

    if (report.insights.length === 0) {
      report.insights.push(won
        ? { emoji: '✅', text: 'Solid performance across all phases.', grade: 'B', phase: 'pitching' as PhaseGrade }
        : { emoji: '📋', text: 'Competitive effort. Small margins mattered.', grade: 'C', phase: 'hitting' as PhaseGrade }
      );
    }

    const tp = TURNING_POINTS.find(t => t.test(won, margin));
    report.turningPoint = tp ? tp.text : 'Standard game flow.';

    return report;
  });
}

/**
 * countLeverageHeatmap.ts – Count Leverage Heatmap
 *
 * Shows how leverage changes across ball-strike counts in game
 * situations. Displays a 4x3 grid (0-3 balls x 0-2 strikes) with
 * leverage heat colors, run expectancy overlays, and hitter/pitcher
 * advantage badges per count.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CountCell {
  balls: number;
  strikes: number;
  avgLeverage: number;
  runExpectancy: number;
  swingPct: number;
  avgResult: 'pitcher_advantage' | 'neutral' | 'hitter_advantage';
  sampleSize: number;
}

export interface CountLeverageData {
  situation: string;
  matrix: CountCell[];
  description: string;
}

// ─── Display Helpers ────────────────────────────────────────────────────────

export const ADVANTAGE_DISPLAY: Record<CountCell['avgResult'], { label: string; color: string; abbr: string }> = {
  pitcher_advantage: { label: 'Pitcher Advantage', color: '#3b82f6', abbr: 'P' },
  neutral:           { label: 'Neutral',           color: '#9ca3af', abbr: 'N' },
  hitter_advantage:  { label: 'Hitter Advantage',  color: '#22c55e', abbr: 'H' },
};

export function leverageHeatColor(leverage: number): string {
  if (leverage >= 2.5) return '#ef4444';
  if (leverage >= 2.0) return '#f97316';
  if (leverage >= 1.5) return '#f59e0b';
  if (leverage >= 1.0) return '#eab308';
  if (leverage >= 0.7) return '#a3e635';
  return '#22c55e';
}

export function leverageHeatBg(leverage: number): string {
  if (leverage >= 2.5) return '#ef444422';
  if (leverage >= 2.0) return '#f9731622';
  if (leverage >= 1.5) return '#f59e0b22';
  if (leverage >= 1.0) return '#eab30822';
  if (leverage >= 0.7) return '#a3e63522';
  return '#22c55e22';
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function classifyAdvantage(balls: number, strikes: number): CountCell['avgResult'] {
  if (balls >= 3 && strikes <= 1) return 'hitter_advantage';
  if (balls >= 2 && strikes === 0) return 'hitter_advantage';
  if (strikes === 2 && balls <= 1) return 'pitcher_advantage';
  if (strikes >= 2 && balls === 0) return 'pitcher_advantage';
  return 'neutral';
}

function buildMatrix(baseLeverage: number, baseRE: number): CountCell[] {
  const cells: CountCell[] = [];

  for (let b = 0; b <= 3; b++) {
    for (let s = 0; s <= 2; s++) {
      // Leverage tends to increase as count deepens
      const countDepth = b + s;
      const leverageMod = 1 + (countDepth * 0.15) + (s === 2 ? 0.3 : 0) + (b === 3 ? 0.25 : 0);
      const avgLeverage = Math.round((baseLeverage * leverageMod) * 100) / 100;

      // Run expectancy shifts with count
      const reMod = 1 + (b * 0.08) - (s * 0.12) + (b === 3 && s === 0 ? 0.15 : 0);
      const runExpectancy = Math.round((baseRE * reMod) * 1000) / 1000;

      // Swing percentage varies by count
      const baseSwing = 45;
      const swingPct = Math.round(baseSwing + (s * 12) - (b * 5) + (s === 2 ? 8 : 0) + (b >= 3 ? -10 : 0));

      const sampleSize = Math.round(800 - countDepth * 80 + Math.random() * 100);

      cells.push({
        balls: b,
        strikes: s,
        avgLeverage,
        runExpectancy,
        swingPct: Math.max(20, Math.min(85, swingPct)),
        avgResult: classifyAdvantage(b, s),
        sampleSize,
      });
    }
  }

  return cells;
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoCountLeverage(): CountLeverageData[] {
  return [
    {
      situation: 'Bases Empty, 0 Out',
      matrix: buildMatrix(0.85, 0.481),
      description: 'Low-leverage baseline situation. Pitchers can work aggressively early in counts.',
    },
    {
      situation: 'Runner on 1st, 1 Out',
      matrix: buildMatrix(1.10, 0.524),
      description: 'Double play opportunity raises leverage. Count matters for pitch selection.',
    },
    {
      situation: 'Runners on 1st & 2nd, 0 Out',
      matrix: buildMatrix(1.45, 0.888),
      description: 'High run expectancy. Full counts become critical decision points.',
    },
    {
      situation: 'Runner on 3rd, 1 Out',
      matrix: buildMatrix(1.60, 0.897),
      description: 'Scoring position with one out. Pitchers must navigate carefully in deep counts.',
    },
    {
      situation: 'Bases Loaded, 2 Out',
      matrix: buildMatrix(2.20, 0.736),
      description: 'Highest leverage situation. Every pitch is magnified. Full count peaks at extreme leverage.',
    },
    {
      situation: 'Runner on 2nd, 2 Out',
      matrix: buildMatrix(1.35, 0.315),
      description: 'RISP with two outs. Hitter counts become pivotal for driving in runs.',
    },
    {
      situation: 'Tie Game, 8th Inning+',
      matrix: buildMatrix(1.90, 0.650),
      description: 'Late-game tie amplifies all counts. 3-2 counts carry enormous swing in win probability.',
    },
    {
      situation: '1-Run Lead, 9th Inning',
      matrix: buildMatrix(2.05, 0.580),
      description: 'Closer situations. Falling behind in counts dramatically increases leverage.',
    },
  ];
}

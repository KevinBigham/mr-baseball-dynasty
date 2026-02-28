/**
 * Reliever Leverage Index
 *
 * Calculates how often relievers appear in high-leverage situations
 * and their performance. Tracks leverage tiers, appearance logs,
 * hold percentages, and clutch ERA/WHIP metrics.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type LeverageTier = 'low' | 'medium' | 'high' | 'very_high';

export type AppearanceResult = 'hold' | 'blown_save' | 'save' | 'loss' | 'win' | 'no_decision';

export const LEVERAGE_DISPLAY: Record<LeverageTier, { label: string; color: string }> = {
  low:       { label: 'Low',       color: '#6b7280' },
  medium:    { label: 'Medium',    color: '#3b82f6' },
  high:      { label: 'High',      color: '#f59e0b' },
  very_high: { label: 'Very High', color: '#ef4444' },
};

export const RESULT_DISPLAY: Record<AppearanceResult, { label: string; color: string }> = {
  hold:        { label: 'Hold',       color: '#22c55e' },
  blown_save:  { label: 'Blown Save', color: '#ef4444' },
  save:        { label: 'Save',       color: '#f59e0b' },
  loss:        { label: 'Loss',       color: '#ef4444' },
  win:         { label: 'Win',        color: '#22c55e' },
  no_decision: { label: 'ND',         color: '#6b7280' },
};

export type RelieverRole = 'closer' | 'setup' | 'middle' | 'long' | 'mop_up';

export const ROLE_DISPLAY: Record<RelieverRole, { label: string; color: string }> = {
  closer:  { label: 'CL',   color: '#ef4444' },
  setup:   { label: 'SU',   color: '#f97316' },
  middle:  { label: 'MR',   color: '#eab308' },
  long:    { label: 'LR',   color: '#3b82f6' },
  mop_up:  { label: 'MOP',  color: '#6b7280' },
};

export interface LeverageAppearance {
  date: string;
  inning: number;
  leverageTier: LeverageTier;
  result: AppearanceResult;
  pitchCount: number;
  ip: number;
}

export interface RelieverLeverageProfile {
  pitcherId: number;
  name: string;
  role: RelieverRole;
  avgLeverage: number;       // 0-3 scale (1.0 = avg, >1.5 = high, >2.0 = very high)
  highLevPct: number;        // % of appearances in high/very_high leverage
  appearances: LeverageAppearance[];
  era: number;
  whip: number;
  kPer9: number;
  holdPct: number;           // % of hold opportunities converted
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getLeverageTierFromValue(li: number): LeverageTier {
  if (li >= 2.0) return 'very_high';
  if (li >= 1.5) return 'high';
  if (li >= 0.8) return 'medium';
  return 'low';
}

export function getHighLevPct(appearances: LeverageAppearance[]): number {
  if (appearances.length === 0) return 0;
  const highLev = appearances.filter(a => a.leverageTier === 'high' || a.leverageTier === 'very_high');
  return Math.round((highLev.length / appearances.length) * 100);
}

export function getHoldPct(appearances: LeverageAppearance[]): number {
  const holdOpps = appearances.filter(a => a.result === 'hold' || a.result === 'blown_save');
  if (holdOpps.length === 0) return 0;
  const holds = holdOpps.filter(a => a.result === 'hold').length;
  return Math.round((holds / holdOpps.length) * 100);
}

// ─── Demo data ──────────────────────────────────────────────────────────────

function makeDemoAppearances(
  count: number,
  leverageBias: LeverageTier,
  resultBias: AppearanceResult
): LeverageAppearance[] {
  const tiers: LeverageTier[] = ['low', 'medium', 'high', 'very_high'];
  const results: AppearanceResult[] = ['hold', 'blown_save', 'save', 'loss', 'win', 'no_decision'];
  const months = ['04', '05', '06', '07', '08', '09'];
  return Array.from({ length: count }, (_, i) => {
    const month = months[Math.floor(i / (count / 6)) % 6];
    const day = String(1 + (i * 5) % 28).padStart(2, '0');
    // Bias toward the given tier
    const tierRoll = Math.random();
    let tier: LeverageTier;
    if (tierRoll < 0.5) tier = leverageBias;
    else if (tierRoll < 0.7) tier = tiers[(tiers.indexOf(leverageBias) + 1) % 4];
    else tier = tiers[Math.floor(Math.random() * 4)];
    // Bias toward the given result
    const resRoll = Math.random();
    let result: AppearanceResult;
    if (resRoll < 0.5) result = resultBias;
    else if (resRoll < 0.7) result = 'no_decision';
    else result = results[Math.floor(Math.random() * results.length)];
    return {
      date: `2025-${month}-${day}`,
      inning: tier === 'very_high' ? 9 : tier === 'high' ? 8 : 6 + Math.floor(Math.random() * 3),
      leverageTier: tier,
      result,
      pitchCount: 12 + Math.floor(Math.random() * 20),
      ip: Math.round((0.2 + Math.random() * 1.5) * 3) / 3,
    };
  });
}

export function generateDemoRelieverLeverage(): RelieverLeverageProfile[] {
  return [
    {
      pitcherId: 100, name: 'Emmanuel Clase', role: 'closer', avgLeverage: 2.45, highLevPct: 82,
      appearances: makeDemoAppearances(48, 'very_high', 'save'),
      era: 1.15, whip: 0.82, kPer9: 9.8, holdPct: 0,
    },
    {
      pitcherId: 101, name: 'Ryan Helsley', role: 'setup', avgLeverage: 1.92, highLevPct: 68,
      appearances: makeDemoAppearances(52, 'high', 'hold'),
      era: 1.78, whip: 0.91, kPer9: 12.2, holdPct: 88,
    },
    {
      pitcherId: 102, name: 'Devin Williams', role: 'setup', avgLeverage: 1.85, highLevPct: 64,
      appearances: makeDemoAppearances(50, 'high', 'hold'),
      era: 2.45, whip: 1.02, kPer9: 14.1, holdPct: 82,
    },
    {
      pitcherId: 103, name: 'Clay Holmes', role: 'middle', avgLeverage: 1.35, highLevPct: 42,
      appearances: makeDemoAppearances(55, 'medium', 'no_decision'),
      era: 3.52, whip: 1.28, kPer9: 7.8, holdPct: 65,
    },
    {
      pitcherId: 104, name: 'Jose Alvarado', role: 'middle', avgLeverage: 1.48, highLevPct: 48,
      appearances: makeDemoAppearances(50, 'medium', 'hold'),
      era: 3.95, whip: 1.35, kPer9: 10.8, holdPct: 58,
    },
    {
      pitcherId: 105, name: 'Griffin Jax', role: 'setup', avgLeverage: 1.78, highLevPct: 60,
      appearances: makeDemoAppearances(56, 'high', 'hold'),
      era: 2.15, whip: 0.95, kPer9: 11.5, holdPct: 85,
    },
    {
      pitcherId: 106, name: 'Nick Anderson', role: 'long', avgLeverage: 0.85, highLevPct: 18,
      appearances: makeDemoAppearances(42, 'low', 'no_decision'),
      era: 3.80, whip: 1.22, kPer9: 8.5, holdPct: 55,
    },
    {
      pitcherId: 107, name: 'Tim Hill', role: 'mop_up', avgLeverage: 0.55, highLevPct: 8,
      appearances: makeDemoAppearances(35, 'low', 'no_decision'),
      era: 4.65, whip: 1.42, kPer9: 6.2, holdPct: 40,
    },
  ];
}

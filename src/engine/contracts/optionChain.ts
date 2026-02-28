/**
 * optionChain.ts – Contract option chain analysis
 *
 * Tracks club options, player options, vesting options, mutual options,
 * and opt-out clauses across the roster with financial analysis and
 * exercise/decline recommendations.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type OptionType = 'club' | 'player' | 'vesting' | 'mutual' | 'optout';
export type OptionAction = 'exercise' | 'decline' | 'pending' | 'vested';

export interface ContractOption {
  id: string;
  playerId: string;
  playerName: string;
  pos: string;
  team: string;
  age: number;
  overall: number;
  optionType: OptionType;
  optionYear: number;        // season the option covers
  optionSalary: number;      // $M
  buyout: number;            // $M (if declined)
  currentWAR: number;
  projectedWAR: number;
  surplusValue: number;      // projected WAR value minus salary
  recommendation: OptionAction;
  confidence: number;        // 0-100
  vestingThreshold?: string; // e.g. "500 PA" or "150 IP"
  vestingProgress?: number;  // % toward vesting
  notes: string;
}

export const OPTION_TYPE_DISPLAY: Record<OptionType, { label: string; color: string; abbr: string }> = {
  club:    { label: 'Club Option',    color: '#3b82f6', abbr: 'CLB' },
  player:  { label: 'Player Option',  color: '#22c55e', abbr: 'PLR' },
  vesting: { label: 'Vesting Option', color: '#f59e0b', abbr: 'VST' },
  mutual:  { label: 'Mutual Option',  color: '#a855f7', abbr: 'MUT' },
  optout:  { label: 'Opt-Out Clause', color: '#ef4444', abbr: 'OPT' },
};

export const ACTION_DISPLAY: Record<OptionAction, { label: string; color: string }> = {
  exercise: { label: 'Exercise', color: '#22c55e' },
  decline:  { label: 'Decline',  color: '#ef4444' },
  pending:  { label: 'Pending',  color: '#eab308' },
  vested:   { label: 'Vested',   color: '#3b82f6' },
};

// ── Summary ────────────────────────────────────────────────────────────────

export interface OptionChainSummary {
  totalOptions: number;
  exerciseSavings: number;  // total surplus value from exercising
  declineCost: number;      // total buyout cost
  pendingCount: number;
  vestingCount: number;
  commitmentIfExercised: number; // total $ if all exercised
}

export function getOptionChainSummary(options: ContractOption[]): OptionChainSummary {
  const exercisable = options.filter(o => o.recommendation === 'exercise');
  const declinable = options.filter(o => o.recommendation === 'decline');
  const pending = options.filter(o => o.recommendation === 'pending');
  const vesting = options.filter(o => o.optionType === 'vesting');
  const totalCommit = options.reduce((s, o) => s + o.optionSalary, 0);
  return {
    totalOptions: options.length,
    exerciseSavings: Math.round(exercisable.reduce((s, o) => s + o.surplusValue, 0) * 10) / 10,
    declineCost: Math.round(declinable.reduce((s, o) => s + o.buyout, 0) * 10) / 10,
    pendingCount: pending.length,
    vestingCount: vesting.length,
    commitmentIfExercised: Math.round(totalCommit * 10) / 10,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const PLAYERS: Array<{ name: string; pos: string; team: string; age: number; ovr: number }> = [
  { name: 'Freddie Freeman', pos: '1B', team: 'LAD', age: 35, ovr: 88 },
  { name: 'Marcus Semien', pos: '2B', team: 'TEX', age: 34, ovr: 84 },
  { name: 'Justin Verlander', pos: 'SP', team: 'HOU', age: 41, ovr: 79 },
  { name: 'Brandon Nimmo', pos: 'CF', team: 'NYM', age: 31, ovr: 82 },
  { name: 'Eduardo Rodriguez', pos: 'SP', team: 'ARI', age: 31, ovr: 78 },
  { name: 'Josh Hader', pos: 'CL', team: 'HOU', age: 30, ovr: 85 },
  { name: 'Max Scherzer', pos: 'SP', team: 'TEX', age: 40, ovr: 76 },
  { name: 'Patrick Corbin', pos: 'SP', team: 'WSH', age: 35, ovr: 65 },
  { name: 'Teoscar Hernández', pos: 'LF', team: 'LAD', age: 32, ovr: 81 },
  { name: 'Cody Bellinger', pos: '1B', team: 'CHC', age: 29, ovr: 80 },
];

const OPTION_TYPES: OptionType[] = ['club', 'club', 'club', 'player', 'player', 'club', 'mutual', 'club', 'vesting', 'optout'];

export function generateDemoOptionChain(): ContractOption[] {
  return PLAYERS.map((p, i) => {
    const war = 4.5 - i * 0.4 + ((i * 3) % 5) * 0.3;
    const projWar = war - 0.3 + ((i * 7) % 10) * 0.1;
    const salary = 28 - i * 2 + ((i * 5) % 8);
    const buyout = 1 + ((i * 3) % 5);
    const surplus = Math.round((projWar * 8 - salary) * 10) / 10;
    const optType = OPTION_TYPES[i];
    const isVesting = optType === 'vesting';
    const rec: OptionAction = isVesting ? (((i * 7) % 10) > 5 ? 'vested' : 'pending') :
                              surplus > 0 ? 'exercise' : surplus < -5 ? 'decline' : 'pending';
    return {
      id: `opt-${i}`,
      playerId: `p-${i}`,
      playerName: p.name,
      pos: p.pos,
      team: p.team,
      age: p.age,
      overall: p.ovr,
      optionType: optType,
      optionYear: 2026,
      optionSalary: salary,
      buyout,
      currentWAR: Math.round(war * 10) / 10,
      projectedWAR: Math.round(projWar * 10) / 10,
      surplusValue: surplus,
      recommendation: rec,
      confidence: 55 + ((i * 11) % 40),
      vestingThreshold: isVesting ? '500 PA' : undefined,
      vestingProgress: isVesting ? 60 + ((i * 17) % 35) : undefined,
      notes: rec === 'exercise' ? `Strong surplus value at $${salary}M. Clear exercise.` :
             rec === 'decline' ? `Negative surplus. Pay $${buyout}M buyout and reallocate.` :
             rec === 'vested' ? `Option has already vested based on playing time.` :
             `Close call. Monitor performance before decision deadline.`,
    };
  });
}

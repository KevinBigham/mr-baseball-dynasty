/**
 * Trade Package Builder — Mr. Baseball Dynasty
 *
 * Evaluates trade package fairness and value by comparing the total
 * asset value on each side. Supports players, prospects, and draft
 * picks with position-aware valuation and fairness classification.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type PackageSide = 'team_a' | 'team_b';

export interface TradeAsset {
  name: string;
  type: 'player' | 'prospect' | 'pick';
  value: number;
  position: string;
}

export interface TradePackage {
  sideA: TradeAsset[];
  sideB: TradeAsset[];
  valueA: number;
  valueB: number;
  fairness: 'fair' | 'slight_edge_a' | 'slight_edge_b' | 'lopsided_a' | 'lopsided_b';
  differential: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Sum asset values with diminishing returns for depth pieces */
function sumWithDiminishing(assets: TradeAsset[]): number {
  if (assets.length === 0) return 0;
  const sorted = [...assets].sort((a, b) => b.value - a.value);
  let total = sorted[0]!.value;
  for (let i = 1; i < sorted.length; i++) {
    total += sorted[i]!.value * Math.pow(0.75, i);
  }
  return parseFloat(total.toFixed(1));
}

function classifyFairness(valueA: number, valueB: number): TradePackage['fairness'] {
  const diff = valueA - valueB;
  const avg = (valueA + valueB) / 2;
  const pctDiff = avg > 0 ? Math.abs(diff) / avg : 0;

  if (pctDiff <= 0.08) return 'fair';
  if (diff > 0 && pctDiff <= 0.25) return 'slight_edge_a';
  if (diff < 0 && pctDiff <= 0.25) return 'slight_edge_b';
  if (diff > 0) return 'lopsided_a';
  return 'lopsided_b';
}

// ─── Player Name / Prospect Pools ─────────────────────────────────────────────

const PLAYER_NAMES = [
  'Marcus Rivera', 'Jake Morrison', 'Tyler Chen', 'Derek Anderson',
  'Cameron Brooks', 'Kyle Patterson', 'Bryce Nakamura', 'Ryan Torres',
  'Justin Fleming', 'Alex Washington', 'Matt O\'Brien', 'Chris Sullivan',
  'Zach Williams', 'Sam Parker', 'Tommy Lee', 'Nate Kowalski',
];

const PROSPECT_NAMES = [
  'Julio Herrera', 'Ethan Clark', 'Diego Martinez', 'Brandon White',
  'Jayden Scott', 'Caleb Robinson', 'Max Turner', 'Luis Vargas',
  'Owen Mitchell', 'Connor Hayes', 'Isaiah Reyes', 'Gavin Brooks',
];

const POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'SP', 'RP'];

const PICK_LABELS = [
  '2025 1st Round', '2025 2nd Round', '2025 3rd Round',
  '2026 1st Round', '2026 2nd Round', '2025 Comp Round A',
  '2026 Comp Round B', '2025 4th Round',
];

// ─── Demo Trade Generator ─────────────────────────────────────────────────────

function generateOneTrade(seed: number): TradePackage {
  const rand = seededRandom(seed);

  const pickAsset = (pool: string[], type: TradeAsset['type'], baseValue: number): TradeAsset => {
    const idx = Math.floor(rand() * pool.length);
    const name = pool[idx]!;
    const pos = POSITIONS[Math.floor(rand() * POSITIONS.length)]!;
    const value = clamp(Math.round(baseValue + (rand() - 0.5) * baseValue * 0.6), 5, 95);
    return { name, type, value, position: type === 'pick' ? 'PICK' : pos };
  };

  // Side A: 1-3 assets
  const sideA: TradeAsset[] = [];
  const sideACount = 1 + Math.floor(rand() * 3);
  for (let i = 0; i < sideACount; i++) {
    const roll = rand();
    if (roll < 0.5) sideA.push(pickAsset(PLAYER_NAMES, 'player', 55));
    else if (roll < 0.8) sideA.push(pickAsset(PROSPECT_NAMES, 'prospect', 40));
    else sideA.push(pickAsset(PICK_LABELS, 'pick', 30));
  }

  // Side B: 1-3 assets
  const sideB: TradeAsset[] = [];
  const sideBCount = 1 + Math.floor(rand() * 3);
  for (let i = 0; i < sideBCount; i++) {
    const roll = rand();
    if (roll < 0.5) sideB.push(pickAsset(PLAYER_NAMES, 'player', 55));
    else if (roll < 0.8) sideB.push(pickAsset(PROSPECT_NAMES, 'prospect', 40));
    else sideB.push(pickAsset(PICK_LABELS, 'pick', 30));
  }

  const valueA = sumWithDiminishing(sideA);
  const valueB = sumWithDiminishing(sideB);
  const fairness = classifyFairness(valueA, valueB);
  const differential = parseFloat((valueA - valueB).toFixed(1));

  return { sideA, sideB, valueA, valueB, fairness, differential };
}

// ─── Public Demo Generator ────────────────────────────────────────────────────

export function generateDemoTradePackage(): TradePackage[] {
  return [
    generateOneTrade(4001),
    generateOneTrade(4002),
    generateOneTrade(4003),
    generateOneTrade(4004),
    generateOneTrade(4005),
  ];
}

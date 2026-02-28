/**
 * intlScoutingBudget.ts – International Scouting Budget
 *
 * Tracks international signing bonus pool allocation, prospect targets,
 * regional coverage, and ROI on past international signings.
 *
 * Regions covered: Dominican Republic, Venezuela, Cuba, Japan, Korea,
 * Taiwan, Mexico, Other.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type IntlRegion =
  | 'Dominican Republic'
  | 'Venezuela'
  | 'Cuba'
  | 'Japan'
  | 'Korea'
  | 'Taiwan'
  | 'Mexico'
  | 'Other';

export interface IntlProspectTarget {
  name: string;
  region: IntlRegion;
  age: number;
  position: string;
  signingBonus: number;        // in $M
  scoutGrade: number;          // 20-80 scale
  tools: {
    hit: number;
    power: number;
    speed: number;
    arm: number;
    field: number;
  };
  eta: number;                 // projected MLB arrival year
  notes: string;
}

export interface RegionalAllocation {
  region: IntlRegion;
  budget: number;              // in $M
  spent: number;               // in $M
  scouts: number;
  prospectCount: number;
  bestProspect: string;
  roi: number;                 // historical ROI index (0-200, 100 = average)
}

export interface IntlBudgetData {
  teamName: string;
  totalPool: number;           // in $M
  committed: number;           // in $M
  remaining: number;           // in $M
  regions: RegionalAllocation[];
  targets: IntlProspectTarget[];
  historicalROI: number;       // overall ROI index
  notes: string;
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface IntlBudgetSummary {
  totalPool: string;
  committed: string;
  remaining: string;
  topRegion: string;
  topTarget: string;
  avgScoutGrade: number;
}

export function getIntlBudgetSummary(data: IntlBudgetData): IntlBudgetSummary {
  const topRegion = data.regions.reduce((a, b) => a.budget > b.budget ? a : b, data.regions[0]);
  const topTarget = data.targets.reduce((a, b) => a.scoutGrade > b.scoutGrade ? a : b, data.targets[0]);
  const avgGrade = Math.round(data.targets.reduce((s, t) => s + t.scoutGrade, 0) / data.targets.length);

  return {
    totalPool: `$${data.totalPool.toFixed(1)}M`,
    committed: `$${data.committed.toFixed(1)}M`,
    remaining: `$${data.remaining.toFixed(1)}M`,
    topRegion: topRegion.region,
    topTarget: topTarget.name,
    avgScoutGrade: avgGrade,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const PROSPECT_TARGETS: {
  name: string; region: IntlRegion; age: number; position: string;
  bonus: number; grade: number; notes: string;
}[] = [
  { name: 'Yohandry Ramirez',  region: 'Dominican Republic', age: 16, position: 'SS',  bonus: 2.8,  grade: 65, notes: 'Plus bat speed with projectable power. Advanced feel for hitting at his age.' },
  { name: 'Luis Morales',       region: 'Venezuela',          age: 17, position: 'RHP', bonus: 1.5,  grade: 60, notes: 'Live arm already touching 95. Developing slider flashes plus. Raw but electric.' },
  { name: 'Yoel Castillo',      region: 'Cuba',               age: 22, position: 'OF',  bonus: 8.5,  grade: 70, notes: 'Defected from Cuba national team. Five-tool talent with MLB-ready bat speed.' },
  { name: 'Kenji Tanaka',       region: 'Japan',              age: 18, position: 'LHP', bonus: 0.8,  grade: 55, notes: 'Crafty lefty with 4-pitch mix. Command beyond his years. Projects as mid-rotation.' },
  { name: 'Miguel Herrera',     region: 'Dominican Republic', age: 16, position: '3B',  bonus: 3.2,  grade: 60, notes: 'Strong frame, raw power grades 60. Needs refinement at the plate but tools are loud.' },
  { name: 'Andres Gutierrez',   region: 'Venezuela',          age: 17, position: 'OF',  bonus: 1.1,  grade: 55, notes: 'Elite speed tool. Plus runner who can cover center field. Bat is the question.' },
  { name: 'Min-Jun Park',       region: 'Korea',              age: 19, position: 'RHP', bonus: 0.6,  grade: 50, notes: 'Polished command pitcher. Fastball sits 90-93 with good sink. Projects as back-end starter.' },
  { name: 'Hector Diaz',        region: 'Dominican Republic', age: 16, position: 'C',   bonus: 1.8,  grade: 55, notes: 'Defensive-first catcher with strong arm. Plus framing instincts. Bat needs development.' },
  { name: 'Wei-Chen Lin',       region: 'Taiwan',             age: 20, position: '2B',  bonus: 0.4,  grade: 45, notes: 'Contact-oriented middle infielder. Smooth actions. Limited power upside.' },
  { name: 'Carlos Mendoza',     region: 'Mexico',             age: 17, position: 'OF',  bonus: 0.5,  grade: 50, notes: 'Good athlete with above-average tools across the board. Needs at-bats.' },
  { name: 'Johan Reyes',        region: 'Dominican Republic', age: 16, position: 'SS',  bonus: 2.0,  grade: 60, notes: 'Silky smooth actions. Plus glove with arm to stay at short. Hit tool projects average.' },
  { name: 'Raul Ortega',        region: 'Cuba',               age: 24, position: '1B',  bonus: 4.0,  grade: 55, notes: 'Plus raw power with patience at the plate. Older but close to MLB ready.' },
];

const REGIONS: IntlRegion[] = [
  'Dominican Republic', 'Venezuela', 'Cuba', 'Japan', 'Korea', 'Taiwan', 'Mexico', 'Other',
];

export function generateDemoIntlBudget(): IntlBudgetData {
  const rng = seededRandom(2024);

  // Generate tool grades for each prospect
  const targets: IntlProspectTarget[] = PROSPECT_TARGETS.map(pt => {
    const base = pt.grade;
    return {
      name: pt.name,
      region: pt.region,
      age: pt.age,
      position: pt.position,
      signingBonus: pt.bonus,
      scoutGrade: pt.grade,
      tools: {
        hit:   Math.round(base + (rng() * 20 - 10)),
        power: Math.round(base + (rng() * 20 - 10)),
        speed: Math.round(base + (rng() * 20 - 10)),
        arm:   Math.round(base + (rng() * 20 - 10)),
        field: Math.round(base + (rng() * 20 - 10)),
      },
      eta: 2026 + Math.max(0, Math.round((24 - pt.age) * 0.6 + rng() * 1.5 - 0.5)),
      notes: pt.notes,
    };
  });

  // Total pool and committed
  const totalPool = 5.2;
  const committed = Math.round(targets.reduce((s, t) => s + t.signingBonus, 0) * 10) / 10;
  const remaining = Math.round((totalPool - Math.min(committed, totalPool)) * 10) / 10;

  // Regional allocations
  const regionBudgets: Record<IntlRegion, number> = {
    'Dominican Republic': 2.2,
    'Venezuela':          0.9,
    'Cuba':               0.8,
    'Japan':              0.5,
    'Korea':              0.3,
    'Taiwan':             0.2,
    'Mexico':             0.2,
    'Other':              0.1,
  };

  const regions: RegionalAllocation[] = REGIONS.map(region => {
    const regionTargets = targets.filter(t => t.region === region);
    const spent = Math.round(regionTargets.reduce((s, t) => s + t.signingBonus, 0) * 10) / 10;
    const bestTarget = regionTargets.length > 0
      ? regionTargets.reduce((a, b) => a.scoutGrade > b.scoutGrade ? a : b).name
      : '—';
    const roi = Math.round(80 + rng() * 80);

    return {
      region,
      budget: regionBudgets[region],
      spent,
      scouts: region === 'Dominican Republic' ? 5 : region === 'Venezuela' ? 3 : region === 'Cuba' ? 2 : 1,
      prospectCount: regionTargets.length,
      bestProspect: bestTarget,
      roi,
    };
  });

  const historicalROI = Math.round(regions.reduce((s, r) => s + r.roi, 0) / regions.length);

  return {
    teamName: 'My Team',
    totalPool,
    committed: Math.min(committed, totalPool),
    remaining: Math.max(remaining, 0),
    regions,
    targets,
    historicalROI,
    notes: committed > totalPool
      ? 'WARNING: Committed signings exceed pool allocation. Must shed commitments or acquire additional pool money via trade.'
      : remaining < 0.5
      ? 'Pool nearly exhausted. Remaining funds limited to late-signing bargains.'
      : `$${remaining.toFixed(1)}M remaining. Prioritize high-upside Dominican and Cuban targets.`,
  };
}

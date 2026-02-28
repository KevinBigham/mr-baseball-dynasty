/**
 * luxuryTax.ts – Luxury tax (CBT) dashboard
 *
 * Tracks competitive balance tax thresholds, current payroll position,
 * surcharge tiers, draft pick penalties, and projected tax liability.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type TaxTier = 'under' | 'base' | 'second' | 'third' | 'cohen';

export interface LuxuryTaxThreshold {
  tier: TaxTier;
  label: string;
  amount: number;       // $M
  rate: number;          // tax rate %
  exceeded: boolean;
}

export interface LuxuryTaxDashboard {
  teamName: string;
  season: number;
  currentPayroll: number;        // $M CBT payroll
  baseThreshold: number;
  secondThreshold: number;
  thirdThreshold: number;
  cohenThreshold: number;
  currentTier: TaxTier;
  projectedTax: number;          // $M
  consecutiveYearsOver: number;
  surchargeRate: number;         // additional % for repeat offenders
  draftPickPenalty: boolean;
  intlPoolReduction: boolean;
  spaceUnderBase: number;        // $M (negative = over)
  thresholds: LuxuryTaxThreshold[];
  yearByYear: Array<{
    season: number;
    payroll: number;
    threshold: number;
    taxPaid: number;
    tier: TaxTier;
  }>;
  biggestContracts: Array<{
    name: string;
    aav: number;
    yearsLeft: number;
  }>;
  notes: string;
}

export const TAX_TIER_DISPLAY: Record<TaxTier, { label: string; color: string }> = {
  under:  { label: 'Under Threshold', color: '#22c55e' },
  base:   { label: 'Base Tax',        color: '#f59e0b' },
  second: { label: 'Second Tier',     color: '#f97316' },
  third:  { label: 'Third Tier',      color: '#ef4444' },
  cohen:  { label: 'Cohen Tax',       color: '#dc2626' },
};

// ── Demo Data ──────────────────────────────────────────────────────────────

function makeThresholds(payroll: number): LuxuryTaxThreshold[] {
  const base = 237;
  const second = 257;
  const third = 277;
  const cohen = 297;
  return [
    { tier: 'base', label: 'Base Threshold', amount: base, rate: 20, exceeded: payroll > base },
    { tier: 'second', label: 'Second Tier', amount: second, rate: 32, exceeded: payroll > second },
    { tier: 'third', label: 'Third Tier', amount: third, rate: 75, exceeded: payroll > third },
    { tier: 'cohen', label: 'Cohen Tax', amount: cohen, rate: 100, exceeded: payroll > cohen },
  ];
}

function computeTier(payroll: number): TaxTier {
  if (payroll > 297) return 'cohen';
  if (payroll > 277) return 'third';
  if (payroll > 257) return 'second';
  if (payroll > 237) return 'base';
  return 'under';
}

function computeTax(payroll: number, consec: number): number {
  if (payroll <= 237) return 0;
  let tax = 0;
  const overBase = Math.min(payroll - 237, 20);
  tax += overBase * 0.20;
  if (payroll > 257) {
    const overSecond = Math.min(payroll - 257, 20);
    tax += overSecond * 0.32;
  }
  if (payroll > 277) {
    const overThird = Math.min(payroll - 277, 20);
    tax += overThird * 0.75;
  }
  if (payroll > 297) {
    tax += (payroll - 297) * 1.00;
  }
  if (consec >= 2) tax *= 1.12;
  if (consec >= 3) tax *= 1.25;
  return Math.round(tax * 10) / 10;
}

const TEAMS_DATA = [
  { name: 'New York Mets', payroll: 312, consec: 2 },
  { name: 'Los Angeles Dodgers', payroll: 295, consec: 3 },
  { name: 'New York Yankees', payroll: 280, consec: 4 },
  { name: 'Philadelphia Phillies', payroll: 260, consec: 1 },
  { name: 'Atlanta Braves', payroll: 245, consec: 1 },
  { name: 'San Diego Padres', payroll: 235, consec: 0 },
  { name: 'Texas Rangers', payroll: 228, consec: 0 },
  { name: 'Houston Astros', payroll: 242, consec: 2 },
];

const CONTRACTS: Array<Array<{ name: string; aav: number; yrs: number }>> = [
  [{ name: 'Francisco Lindor', aav: 34.1, yrs: 7 }, { name: 'Justin Verlander', aav: 43.3, yrs: 1 }, { name: 'Max Scherzer', aav: 43.3, yrs: 1 }, { name: 'Brandon Nimmo', aav: 20.5, yrs: 6 }],
  [{ name: 'Shohei Ohtani', aav: 70.0, yrs: 8 }, { name: 'Freddie Freeman', aav: 27.0, yrs: 4 }, { name: 'Mookie Betts', aav: 30.4, yrs: 9 }, { name: 'Yoshinobu Yamamoto', aav: 32.5, yrs: 10 }],
  [{ name: 'Aaron Judge', aav: 40.0, yrs: 6 }, { name: 'Gerrit Cole', aav: 36.0, yrs: 4 }, { name: 'Juan Soto', aav: 51.0, yrs: 14 }, { name: 'Carlos Rodón', aav: 27.0, yrs: 4 }],
  [{ name: 'Trea Turner', aav: 30.0, yrs: 8 }, { name: 'Bryce Harper', aav: 25.4, yrs: 8 }, { name: 'Kyle Schwarber', aav: 20.0, yrs: 2 }],
  [{ name: 'Ronald Acuña Jr.', aav: 17.0, yrs: 6 }, { name: 'Matt Olson', aav: 21.0, yrs: 6 }, { name: 'Austin Riley', aav: 21.2, yrs: 8 }],
  [{ name: 'Manny Machado', aav: 35.0, yrs: 8 }, { name: 'Xander Bogaerts', aav: 25.5, yrs: 8 }, { name: 'Yu Darvish', aav: 18.0, yrs: 3 }],
  [{ name: 'Corey Seager', aav: 32.5, yrs: 8 }, { name: 'Marcus Semien', aav: 25.0, yrs: 4 }, { name: 'Jacob deGrom', aav: 37.0, yrs: 3 }],
  [{ name: 'José Altuve', aav: 29.0, yrs: 3 }, { name: 'Alex Bregman', aav: 28.5, yrs: 5 }, { name: 'Framber Valdez', aav: 22.0, yrs: 4 }],
];

export function generateDemoLuxuryTax(): LuxuryTaxDashboard[] {
  return TEAMS_DATA.map((t, i) => {
    const tier = computeTier(t.payroll);
    const tax = computeTax(t.payroll, t.consec);
    const yearByYear = [];
    for (let y = 0; y < 4; y++) {
      const p = t.payroll - y * 12 + ((i * 5 + y * 3) % 15);
      yearByYear.push({
        season: 2026 - y,
        payroll: p,
        threshold: 237 - y * 4,
        taxPaid: computeTax(p, Math.max(0, t.consec - y)),
        tier: computeTier(p),
      });
    }
    return {
      teamName: t.name,
      season: 2026,
      currentPayroll: t.payroll,
      baseThreshold: 237,
      secondThreshold: 257,
      thirdThreshold: 277,
      cohenThreshold: 297,
      currentTier: tier,
      projectedTax: tax,
      consecutiveYearsOver: t.consec,
      surchargeRate: t.consec >= 3 ? 25 : t.consec >= 2 ? 12 : 0,
      draftPickPenalty: t.payroll > 257,
      intlPoolReduction: t.payroll > 257,
      spaceUnderBase: Math.round((237 - t.payroll) * 10) / 10,
      thresholds: makeThresholds(t.payroll),
      yearByYear,
      biggestContracts: CONTRACTS[i]?.map(c => ({ name: c.name, aav: c.aav, yearsLeft: c.yrs })) ?? [],
      notes: tier === 'under' ? 'Under the luxury tax. Full draft pick and IFA pool access.' :
             tier === 'base' ? 'Over the base threshold. 20% tax on overage.' :
             tier === 'cohen' ? 'Over the Cohen tax. Maximum penalties including 100% tax rate on excess.' :
             `Over the ${tier} threshold. Escalating tax rates and potential draft/IFA penalties.`,
    };
  });
}

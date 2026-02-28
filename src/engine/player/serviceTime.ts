/**
 * Service Time Tracker
 *
 * Tracks player service time for free agency eligibility,
 * Super Two status, and arbitration year calculations.
 * MLB service time is measured in years and days (172 days = 1 year).
 * 6 years of service time = free agency eligible.
 */

// ─── Constants ──────────────────────────────────────────────────────────────

export const DAYS_PER_SERVICE_YEAR = 172;
export const FA_YEARS = 6;
export const SUPER_TWO_THRESHOLD = 2.130; // ~2 years, 130 days

// ─── Types ──────────────────────────────────────────────────────────────────

export type ServiceStatus = 'pre_arb' | 'arb_1' | 'arb_2' | 'arb_3' | 'arb_4' | 'free_agent' | 'super_two';

export const STATUS_DISPLAY: Record<ServiceStatus, { label: string; color: string; desc: string }> = {
  pre_arb:     { label: 'Pre-Arb',       color: '#6b7280', desc: 'Under team control at minimum salary' },
  arb_1:       { label: 'Arb Year 1',    color: '#eab308', desc: 'First year of salary arbitration' },
  arb_2:       { label: 'Arb Year 2',    color: '#f97316', desc: 'Second year of salary arbitration' },
  arb_3:       { label: 'Arb Year 3',    color: '#ef4444', desc: 'Final arbitration year before free agency' },
  arb_4:       { label: 'Arb Year 4',    color: '#ef4444', desc: 'Super Two extended arbitration' },
  free_agent:  { label: 'Free Agent',    color: '#22c55e', desc: 'Eligible for unrestricted free agency' },
  super_two:   { label: 'Super Two',     color: '#8b5cf6', desc: 'Early arbitration eligibility (top 22% of 2-3 yr players)' },
};

export interface ServiceTimePlayer {
  id: number;
  name: string;
  pos: string;
  age: number;
  overall: number;
  serviceYears: number;
  serviceDays: number;
  totalServiceDays: number;
  status: ServiceStatus;
  isSuperTwo: boolean;
  daysToNextYear: number;
  daysToFA: number;
  currentSalary: number;   // M
  projectedArbSalary: number;  // M
  manipulationRisk: boolean;  // flagged if team may be gaming service time
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function calcServiceTime(totalDays: number): { years: number; days: number } {
  const years = Math.floor(totalDays / DAYS_PER_SERVICE_YEAR);
  const days = totalDays % DAYS_PER_SERVICE_YEAR;
  return { years, days };
}

export function getServiceStatus(totalDays: number, isSuperTwo: boolean): ServiceStatus {
  const { years } = calcServiceTime(totalDays);
  if (years >= FA_YEARS) return 'free_agent';
  if (isSuperTwo && years === 2) return 'super_two';
  if (years >= 5) return 'arb_3';
  if (years >= 4) return 'arb_2';
  if (years >= 3) return 'arb_1';
  return 'pre_arb';
}

export function daysToFA(totalDays: number): number {
  return Math.max(0, FA_YEARS * DAYS_PER_SERVICE_YEAR - totalDays);
}

// ─── Demo data ──────────────────────────────────────────────────────────────

const PLAYER_DATA = [
  { name: 'Gunnar Henderson', pos: 'SS', age: 23, ovr: 84, days: 340, salary: 0.72, superTwo: false },
  { name: 'Elly De La Cruz', pos: 'SS', age: 22, ovr: 82, days: 260, salary: 0.72, superTwo: false },
  { name: 'Corbin Carroll', pos: 'CF', age: 24, ovr: 80, days: 380, salary: 0.72, superTwo: true },
  { name: 'Spencer Strider', pos: 'SP', age: 25, ovr: 78, days: 520, salary: 3.5, superTwo: true },
  { name: 'Julio Rodriguez', pos: 'CF', age: 23, ovr: 81, days: 690, salary: 7.5, superTwo: false },
  { name: 'Bobby Witt Jr.', pos: 'SS', age: 24, ovr: 86, days: 560, salary: 4.2, superTwo: false },
  { name: 'Vladimir Guerrero Jr.', pos: '1B', age: 25, ovr: 85, days: 850, salary: 14.5, superTwo: false },
  { name: 'Wander Franco', pos: 'SS', age: 23, ovr: 77, days: 450, salary: 2.0, superTwo: false },
  { name: 'Adley Rutschman', pos: 'C', age: 26, ovr: 79, days: 400, salary: 0.72, superTwo: true },
  { name: 'CJ Abrams', pos: 'SS', age: 24, ovr: 75, days: 310, salary: 0.72, superTwo: false },
  { name: 'Grayson Rodriguez', pos: 'SP', age: 24, ovr: 76, days: 290, salary: 0.72, superTwo: false },
  { name: 'Andrew Painter', pos: 'SP', age: 21, ovr: 70, days: 45, salary: 0.72, superTwo: false },
];

export function generateDemoServiceTime(): ServiceTimePlayer[] {
  return PLAYER_DATA.map((p, i) => {
    const st = calcServiceTime(p.days);
    const status = getServiceStatus(p.days, p.superTwo);
    const dToFA = daysToFA(p.days);

    return {
      id: i,
      name: p.name,
      pos: p.pos,
      age: p.age,
      overall: p.ovr,
      serviceYears: st.years,
      serviceDays: st.days,
      totalServiceDays: p.days,
      status,
      isSuperTwo: p.superTwo,
      daysToNextYear: DAYS_PER_SERVICE_YEAR - st.days,
      daysToFA: dToFA,
      currentSalary: p.salary,
      projectedArbSalary: status === 'pre_arb' ? 0.72 : Math.round(p.salary * 1.4 * 10) / 10,
      manipulationRisk: p.days >= 155 && p.days <= 172 && st.years < 3,
    };
  });
}

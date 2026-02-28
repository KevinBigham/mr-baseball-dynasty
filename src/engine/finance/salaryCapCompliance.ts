// Salary Cap Compliance — monitors luxury tax and CBT compliance status
// Mr. Baseball Dynasty

export type ComplianceStatus = 'under' | 'first_time' | 'repeat' | 'severe';

export interface TaxBracket {
  threshold: number;
  rate: number;
  exceeded: boolean;
  overage: number;
  taxOwed: number;
}

export interface CompliancePlayer {
  name: string;
  position: string;
  aav: number;
  pctOfPayroll: number;
  isTopEarner: boolean;
}

export interface SalaryCapComplianceData {
  teamId: number;
  teamName: string;
  totalPayroll: number;
  cbtThreshold: number;
  status: ComplianceStatus;
  brackets: TaxBracket[];
  totalTaxOwed: number;
  topContracts: CompliancePlayer[];
  deadMoney: number;
  effectivePayroll: number;
  yearsOverCBT: number;
  projectedNextYear: number;
}

export function generateDemoSalaryCompliance(): SalaryCapComplianceData[] {
  const teams = [
    { name: 'New York Navigators', id: 1 },
    { name: 'Los Angeles Stars', id: 2 },
    { name: 'Chicago Windrunners', id: 3 },
    { name: 'Houston Oilmen', id: 4 },
    { name: 'Boston Harbormasters', id: 5 },
    { name: 'Atlanta Firebirds', id: 6 },
    { name: 'Tampa Bay Stingrays', id: 7 },
    { name: 'Oakland Mountaineers', id: 8 },
  ];

  const cbtThreshold = 233_000_000;
  const thresholds = [233_000_000, 253_000_000, 273_000_000, 293_000_000];
  const rates = [0.20, 0.32, 0.62, 0.80];

  return teams.map((t, i) => {
    const payroll = Math.floor(140_000_000 + Math.random() * 160_000_000);
    const deadMoney = Math.floor(Math.random() * 15_000_000);
    const effective = payroll + deadMoney;

    const brackets: TaxBracket[] = thresholds.map((th, j) => {
      const exceeded = effective > th;
      const prevTh = j > 0 ? thresholds[j - 1] : 0;
      const overage = exceeded ? Math.min(effective - th, (thresholds[j + 1] || Infinity) - th) : 0;
      return { threshold: th, rate: rates[j], exceeded, overage: Math.max(0, overage), taxOwed: Math.floor(overage * rates[j]) };
    });

    const totalTax = brackets.reduce((s, b) => s + b.taxOwed, 0);
    const yearsOver = effective > cbtThreshold ? 1 + Math.floor(Math.random() * 4) : 0;
    const status: ComplianceStatus = effective <= cbtThreshold ? 'under' :
      yearsOver <= 1 ? 'first_time' : yearsOver <= 3 ? 'repeat' : 'severe';

    const positions = ['SP', 'OF', 'SS', '1B', 'C', 'RP', '3B', '2B'];
    const names = ['Marcus Rivera', 'Tyler Brooks', 'Jake Morrison', 'Carlos Delgado', 'Sam Whitfield'];
    const topContracts: CompliancePlayer[] = Array.from({ length: 5 }, (_, j) => {
      const aav = Math.floor(15_000_000 + Math.random() * 25_000_000);
      return {
        name: names[j],
        position: positions[Math.floor(Math.random() * positions.length)],
        aav,
        pctOfPayroll: +((aav / payroll) * 100).toFixed(1),
        isTopEarner: j === 0,
      };
    }).sort((a, b) => b.aav - a.aav);

    return {
      teamId: t.id,
      teamName: t.name,
      totalPayroll: payroll,
      cbtThreshold,
      status,
      brackets,
      totalTaxOwed: totalTax,
      topContracts,
      deadMoney,
      effectivePayroll: effective,
      yearsOverCBT: yearsOver,
      projectedNextYear: Math.floor(payroll * (0.9 + Math.random() * 0.25)),
    };
  });
}

/**
 * intlScoutingBoard.ts – International amateur scouting board
 *
 * Tracks international amateur prospects with signing bonus estimates,
 * tool grades, country of origin, and signing period status.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type SigningStatus = 'committed' | 'strong_interest' | 'scouted' | 'early_look' | 'signed';

export interface IntlProspectEntry {
  id: string;
  name: string;
  country: string;
  age: number;
  pos: string;
  throws: string;
  bats: string;
  height: string;
  weight: number;
  signingClass: number;        // year
  projectedBonus: number;      // $M
  status: SigningStatus;
  committedTeam?: string;
  overallGrade: number;        // 20-80 scale
  tools: { tool: string; grade: number }[];
  scoutingReport: string;
  comp: string;
  riskLevel: 'low' | 'medium' | 'high' | 'very_high';
}

export const STATUS_DISPLAY: Record<SigningStatus, { label: string; color: string }> = {
  signed: { label: 'SIGNED', color: '#22c55e' },
  committed: { label: 'COMMITTED', color: '#4ade80' },
  strong_interest: { label: 'STRONG INT.', color: '#facc15' },
  scouted: { label: 'SCOUTED', color: '#f59e0b' },
  early_look: { label: 'EARLY LOOK', color: '#888' },
};

export const RISK_DISPLAY: Record<string, { label: string; color: string }> = {
  low: { label: 'LOW', color: '#22c55e' },
  medium: { label: 'MEDIUM', color: '#facc15' },
  high: { label: 'HIGH', color: '#f97316' },
  very_high: { label: 'VERY HIGH', color: '#ef4444' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

export function gradeColor(g: number): string {
  if (g >= 70) return '#22c55e';
  if (g >= 60) return '#4ade80';
  if (g >= 55) return '#a3e635';
  if (g >= 50) return '#facc15';
  if (g >= 45) return '#f59e0b';
  return '#ef4444';
}

// ─── Summary ────────────────────────────────────────────────────────────────

export interface IntlScoutingSummary {
  totalProspects: number;
  signedCount: number;
  committedCount: number;
  topCountry: string;
  totalBonusPool: number;
  topProspect: string;
}

export function getIntlScoutingSummary(prospects: IntlProspectEntry[]): IntlScoutingSummary {
  const countryCount: Record<string, number> = {};
  for (const p of prospects) {
    countryCount[p.country] = (countryCount[p.country] || 0) + 1;
  }
  const topCountry = Object.entries(countryCount).sort((a, b) => b[1] - a[1])[0][0];
  const totalBonus = prospects.reduce((s, p) => s + p.projectedBonus, 0);
  const top = prospects.reduce((a, b) => a.overallGrade > b.overallGrade ? a : b);

  return {
    totalProspects: prospects.length,
    signedCount: prospects.filter(p => p.status === 'signed').length,
    committedCount: prospects.filter(p => p.status === 'committed').length,
    topCountry,
    totalBonusPool: Math.round(totalBonus * 10) / 10,
    topProspect: top.name,
  };
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoIntlScoutingBoard(): IntlProspectEntry[] {
  const data: Omit<IntlProspectEntry, 'id'>[] = [
    {
      name: 'Yoelkis Rodriguez', country: 'Cuba', age: 17, pos: 'SS', throws: 'R', bats: 'R',
      height: '6\'1"', weight: 180, signingClass: 2026, projectedBonus: 5.2,
      status: 'committed', committedTeam: 'LAD', overallGrade: 65,
      tools: [{ tool: 'Hit', grade: 60 }, { tool: 'Power', grade: 55 }, { tool: 'Speed', grade: 65 }, { tool: 'Field', grade: 60 }, { tool: 'Arm', grade: 55 }],
      scoutingReport: 'Premium athlete with advanced bat-to-ball skills. Quick hands through the zone. Potential plus defender at SS. Needs to grow into power.',
      comp: 'Xander Bogaerts', riskLevel: 'medium',
    },
    {
      name: 'Luis Vargas', country: 'Dominican Republic', age: 16, pos: 'OF', throws: 'R', bats: 'L',
      height: '6\'3"', weight: 195, signingClass: 2026, projectedBonus: 4.8,
      status: 'strong_interest', overallGrade: 60,
      tools: [{ tool: 'Hit', grade: 55 }, { tool: 'Power', grade: 65 }, { tool: 'Speed', grade: 55 }, { tool: 'Field', grade: 50 }, { tool: 'Arm', grade: 60 }],
      scoutingReport: 'Projectable frame with big raw power potential. Swing has length but bat speed is impressive. Could be an impact bat if he develops approach.',
      comp: 'Yordan Alvarez (raw)', riskLevel: 'high',
    },
    {
      name: 'Kenji Tanaka', country: 'Japan', age: 17, pos: 'RHP', throws: 'R', bats: 'R',
      height: '6\'2"', weight: 185, signingClass: 2026, projectedBonus: 3.5,
      status: 'scouted', overallGrade: 55,
      tools: [{ tool: 'Fastball', grade: 60 }, { tool: 'Slider', grade: 55 }, { tool: 'Change', grade: 45 }, { tool: 'Command', grade: 55 }, { tool: 'Makeup', grade: 65 }],
      scoutingReport: 'Polished RHP with feel for three pitches. FB sits 92-95 with good life. Slider flashes plus. Advanced pitchability for his age. Elite makeup.',
      comp: 'Shota Imanaga style', riskLevel: 'low',
    },
    {
      name: 'Pedro Castillo', country: 'Venezuela', age: 16, pos: 'C', throws: 'R', bats: 'R',
      height: '6\'0"', weight: 200, signingClass: 2026, projectedBonus: 2.8,
      status: 'strong_interest', overallGrade: 55,
      tools: [{ tool: 'Hit', grade: 50 }, { tool: 'Power', grade: 55 }, { tool: 'Speed', grade: 35 }, { tool: 'Field', grade: 60 }, { tool: 'Arm', grade: 65 }],
      scoutingReport: 'Advanced defensive catcher with plus arm. Receiving skills are already above-average. Bat needs development but shows flashes of pull-side power.',
      comp: 'Salvador Perez (tools)', riskLevel: 'medium',
    },
    {
      name: 'Santiago Mejia', country: 'Dominican Republic', age: 17, pos: 'SS/2B', throws: 'R', bats: 'S',
      height: '5\'10"', weight: 170, signingClass: 2026, projectedBonus: 3.2,
      status: 'signed', committedTeam: 'NYM', overallGrade: 55,
      tools: [{ tool: 'Hit', grade: 60 }, { tool: 'Power', grade: 40 }, { tool: 'Speed', grade: 60 }, { tool: 'Field', grade: 55 }, { tool: 'Arm', grade: 50 }],
      scoutingReport: 'Switch-hitting middle infielder with advanced contact skills. Quick-twitch athlete. Lacks power projection but hit tool could carry him.',
      comp: 'Jose Altuve (body type)', riskLevel: 'medium',
    },
    {
      name: 'Diego Herrera', country: 'Mexico', age: 16, pos: 'LHP', throws: 'L', bats: 'L',
      height: '6\'4"', weight: 200, signingClass: 2026, projectedBonus: 2.0,
      status: 'early_look', overallGrade: 50,
      tools: [{ tool: 'Fastball', grade: 55 }, { tool: 'Curve', grade: 50 }, { tool: 'Change', grade: 45 }, { tool: 'Command', grade: 45 }, { tool: 'Makeup', grade: 55 }],
      scoutingReport: 'Big-bodied LHP with projection remaining. FB sits 88-92 now, could tick up. Curve shows 12-6 break. Very raw but physical upside is significant.',
      comp: 'Julio Urias (frame)', riskLevel: 'very_high',
    },
    {
      name: 'Ryu Hayashi', country: 'Japan', age: 17, pos: 'OF', throws: 'R', bats: 'L',
      height: '5\'11"', weight: 175, signingClass: 2026, projectedBonus: 1.8,
      status: 'scouted', overallGrade: 50,
      tools: [{ tool: 'Hit', grade: 55 }, { tool: 'Power', grade: 45 }, { tool: 'Speed', grade: 70 }, { tool: 'Field', grade: 55 }, { tool: 'Arm', grade: 45 }],
      scoutingReport: 'Electric speed player who is a true burner. Solid contact skills with gap-to-gap approach. Premium CF defender. Power projection limited.',
      comp: 'Ichiro Suzuki (tools)', riskLevel: 'medium',
    },
    {
      name: 'Carlos Bautista', country: 'Dominican Republic', age: 16, pos: '3B', throws: 'R', bats: 'R',
      height: '6\'2"', weight: 210, signingClass: 2026, projectedBonus: 4.0,
      status: 'committed', committedTeam: 'ATL', overallGrade: 60,
      tools: [{ tool: 'Hit', grade: 55 }, { tool: 'Power', grade: 65 }, { tool: 'Speed', grade: 40 }, { tool: 'Field', grade: 50 }, { tool: 'Arm', grade: 60 }],
      scoutingReport: 'Physical third baseman with big-time raw power. Can drive the ball to all fields. Needs work on pitch recognition. Strong arm for the hot corner.',
      comp: 'Manny Machado (raw power)', riskLevel: 'high',
    },
  ];

  return data.map((d, i) => ({ ...d, id: `intl-${i}` }));
}

// ─── Prospect Graduation Tracker ──────────────────────────────────────────
// Tracks when top prospects exhaust rookie eligibility (130 AB / 50 IP / 45 days).

export interface ProspectGrad {
  id: number;
  name: string;
  pos: string;
  age: number;
  overall: number;
  potential: number;
  prospectRank: number;
  atBats: number;
  inningsPitched: number;
  daysOnRoster: number;
  abThreshold: number;     // 130 AB for hitters
  ipThreshold: number;     // 50 IP for pitchers
  daysThreshold: number;   // 45 days
  graduatedVia: 'ab' | 'ip' | 'days' | null;
  pctToGraduation: number; // 0-100
  team: string;
  callUpDate: string;
  impact: 'elite' | 'solid' | 'average' | 'struggling';
}

export function getImpactLabel(impact: ProspectGrad['impact']): { label: string; color: string; emoji: string } {
  switch (impact) {
    case 'elite':      return { label: 'Elite', color: '#22c55e', emoji: '🌟' };
    case 'solid':      return { label: 'Solid', color: '#a3e635', emoji: '👍' };
    case 'average':    return { label: 'Average', color: '#eab308', emoji: '😐' };
    case 'struggling': return { label: 'Struggling', color: '#ef4444', emoji: '😰' };
  }
}

export function calculateGraduationPct(prospect: ProspectGrad): number {
  const isPitcher = prospect.pos === 'SP' || prospect.pos === 'RP';
  const abPct = isPitcher ? 0 : (prospect.atBats / prospect.abThreshold) * 100;
  const ipPct = isPitcher ? (prospect.inningsPitched / prospect.ipThreshold) * 100 : 0;
  const daysPct = (prospect.daysOnRoster / prospect.daysThreshold) * 100;
  return Math.min(100, Math.round(Math.max(abPct, ipPct, daysPct)));
}

export function checkGraduation(prospect: ProspectGrad): ProspectGrad {
  const isPitcher = prospect.pos === 'SP' || prospect.pos === 'RP';
  let via: ProspectGrad['graduatedVia'] = null;
  if (!isPitcher && prospect.atBats >= prospect.abThreshold) via = 'ab';
  else if (isPitcher && prospect.inningsPitched >= prospect.ipThreshold) via = 'ip';
  else if (prospect.daysOnRoster >= prospect.daysThreshold) via = 'days';
  return {
    ...prospect,
    graduatedVia: via,
    pctToGraduation: calculateGraduationPct(prospect),
  };
}

export function getGradSummary(prospects: ProspectGrad[]) {
  const graduated = prospects.filter(p => p.graduatedVia !== null).length;
  const nearGrad = prospects.filter(p => !p.graduatedVia && p.pctToGraduation >= 75).length;
  const eliteImpact = prospects.filter(p => p.impact === 'elite').length;
  return { total: prospects.length, graduated, nearGrad, eliteImpact };
}

// ─── Demo data ────────────────────────────────────────────────────────────

export function generateDemoProspectGrads(): ProspectGrad[] {
  const raw: ProspectGrad[] = [
    { id: 401, name: 'Tyler Davis', pos: 'SS', age: 23, overall: 70, potential: 82, prospectRank: 3, atBats: 142, inningsPitched: 0, daysOnRoster: 52, abThreshold: 130, ipThreshold: 50, daysThreshold: 45, graduatedVia: null, pctToGraduation: 0, team: 'MIN', callUpDate: 'Apr 15', impact: 'elite' },
    { id: 402, name: 'Shota Yamamoto', pos: 'SP', age: 22, overall: 66, potential: 86, prospectRank: 1, atBats: 0, inningsPitched: 38, daysOnRoster: 35, abThreshold: 130, ipThreshold: 50, daysThreshold: 45, graduatedVia: null, pctToGraduation: 0, team: 'MIN', callUpDate: 'May 2', impact: 'solid' },
    { id: 403, name: 'Leo Castillo', pos: 'CF', age: 23, overall: 65, potential: 80, prospectRank: 5, atBats: 98, inningsPitched: 0, daysOnRoster: 30, abThreshold: 130, ipThreshold: 50, daysThreshold: 45, graduatedVia: null, pctToGraduation: 0, team: 'MIN', callUpDate: 'May 20', impact: 'solid' },
    { id: 404, name: 'Pedro Alvarez Jr.', pos: 'C', age: 21, overall: 58, potential: 78, prospectRank: 8, atBats: 22, inningsPitched: 0, daysOnRoster: 10, abThreshold: 130, ipThreshold: 50, daysThreshold: 45, graduatedVia: null, pctToGraduation: 0, team: 'MIN', callUpDate: 'Jul 1', impact: 'average' },
    { id: 405, name: 'Dmitri Volkov', pos: 'RP', age: 24, overall: 63, potential: 73, prospectRank: 12, atBats: 0, inningsPitched: 55, daysOnRoster: 48, abThreshold: 130, ipThreshold: 50, daysThreshold: 45, graduatedVia: null, pctToGraduation: 0, team: 'MIN', callUpDate: 'Apr 8', impact: 'elite' },
    { id: 406, name: 'Angel Medina', pos: 'SS', age: 20, overall: 52, potential: 84, prospectRank: 2, atBats: 5, inningsPitched: 0, daysOnRoster: 3, abThreshold: 130, ipThreshold: 50, daysThreshold: 45, graduatedVia: null, pctToGraduation: 0, team: 'MIN', callUpDate: 'Sep 1', impact: 'struggling' },
  ];
  return raw.map(p => checkGraduation(p));
}

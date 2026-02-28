/**
 * Compensatory Draft Picks
 *
 * MLB awards compensatory picks between rounds 1 and 2 for qualifying
 * free agents who sign elsewhere. Higher-rated departed FAs earn higher
 * comp picks. Maximum 2 comp picks per team per year.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type CompPickTier = 'A' | 'B' | 'C' | 'D';

export const TIER_DISPLAY: Record<CompPickTier, { label: string; color: string; round: string; desc: string }> = {
  A: { label: 'Tier A', color: '#22c55e', round: 'After Rd 1', desc: 'Elite FA lost (80+ OVR, QO rejected)' },
  B: { label: 'Tier B', color: '#3b82f6', round: 'End of Rd 1', desc: 'High-value FA lost (75-79 OVR, QO rejected)' },
  C: { label: 'Tier C', color: '#eab308', round: 'After Rd 2', desc: 'Quality FA lost (70-74 OVR, QO rejected)' },
  D: { label: 'Tier D', color: '#94a3b8', round: 'After Rd 4', desc: 'Solid FA lost (65-69 OVR, QO rejected)' },
};

export interface DepartedFA {
  id: number;
  name: string;
  pos: string;
  overall: number;
  age: number;
  qualifyingOfferMade: boolean;
  qualifyingOfferAccepted: boolean;
  signedWith: string | null;
  contractYears: number;
  contractAAV: number;  // millions
}

export interface CompPickResult {
  id: number;
  tier: CompPickTier;
  reason: string;
  player: DepartedFA;
  pickPosition: string;
}

export interface GainedFA {
  id: number;
  name: string;
  pos: string;
  overall: number;
  signedFrom: string;
}

export interface CompPickSummary {
  departedFAs: DepartedFA[];
  gainedFAs: GainedFA[];
  compPicks: CompPickResult[];
  netFABalance: number;  // negative = lost more
}

// ─── Logic ──────────────────────────────────────────────────────────────────

function getTier(ovr: number): CompPickTier {
  if (ovr >= 80) return 'A';
  if (ovr >= 75) return 'B';
  if (ovr >= 70) return 'C';
  return 'D';
}

export function calculateCompPicks(departed: DepartedFA[], gained: GainedFA[]): CompPickResult[] {
  // Only QO-rejected FAs who signed elsewhere qualify
  const qualifying = departed.filter(d =>
    d.qualifyingOfferMade && !d.qualifyingOfferAccepted && d.signedWith && d.overall >= 65
  );

  // Check if gained FAs offset (signed a QO FA from another team = lose comp pick)
  const gained80Plus = gained.filter(g => g.overall >= 75).length;
  const maxPicks = Math.max(0, 2 - gained80Plus);

  const sorted = qualifying.sort((a, b) => b.overall - a.overall);

  return sorted.slice(0, maxPicks).map((player, i) => {
    const tier = getTier(player.overall);
    const tierInfo = TIER_DISPLAY[tier];
    return {
      id: i,
      tier,
      reason: `${player.name} (${player.pos}, ${player.overall} OVR) signed with ${player.signedWith} — ${player.contractYears}yr/$${player.contractAAV}M AAV`,
      player,
      pickPosition: tierInfo.round,
    };
  });
}

// ─── Demo data ──────────────────────────────────────────────────────────────

const FA_NAMES = [
  { name: 'Marcus Cole', pos: 'SP' },
  { name: 'Brandon Rivera', pos: '1B' },
  { name: 'Derek Chen', pos: 'SS' },
  { name: 'Kyle Washington', pos: 'RF' },
  { name: 'Tyler Martinez', pos: 'CP' },
  { name: 'Jake Anderson', pos: '2B' },
  { name: 'Chris Park', pos: 'CF' },
  { name: 'Ryan O\'Brien', pos: '3B' },
];

const TEAMS = ['NYY', 'LAD', 'BOS', 'CHC', 'SF', 'SD', 'PHI', 'HOU', 'ATL', 'TEX'];

export function generateDemoCompPicks(): CompPickSummary {
  const departedFAs: DepartedFA[] = FA_NAMES.map((p, i) => {
    const overall = 62 + ((i * 7 + 3) % 25);
    const qoMade = overall >= 70;
    const qoAccepted = qoMade && (i === 4); // one accepted

    return {
      id: i,
      name: p.name,
      pos: p.pos,
      overall,
      age: 27 + (i % 6),
      qualifyingOfferMade: qoMade,
      qualifyingOfferAccepted: qoAccepted,
      signedWith: qoAccepted ? null : TEAMS[i % TEAMS.length],
      contractYears: qoAccepted ? 1 : 2 + (i % 4),
      contractAAV: Math.round((overall * 0.25 - 10) * 10) / 10,
    };
  });

  const gainedFAs: GainedFA[] = [
    { id: 100, name: 'Austin Reed', pos: 'LF', overall: 72, signedFrom: 'MIN' },
    { id: 101, name: 'Sam Cooper', pos: 'RP', overall: 65, signedFrom: 'SEA' },
  ];

  const compPicks = calculateCompPicks(departedFAs, gainedFAs);

  return {
    departedFAs,
    gainedFAs,
    compPicks,
    netFABalance: gainedFAs.length - departedFAs.filter(d => d.signedWith).length,
  };
}

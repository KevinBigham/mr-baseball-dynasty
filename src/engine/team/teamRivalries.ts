// ─── Team Rivalries ───────────────────────────────────────────────────────
// Rivalry heat, historical matchup records, and rivalry game effects.

export interface Rivalry {
  id: string;
  teamA: string;
  teamB: string;
  teamAAbbr: string;
  teamBAbbr: string;
  heat: number;           // 0-100
  tier: RivalryTier;
  history: string;
  recordA: number;        // all-time wins for team A in rivalry
  recordB: number;
  currentStreakTeam: string;
  currentStreak: number;
  lastMemorable: string;
  boost: number;          // OVR boost for rivalry games
}

export type RivalryTier = 'legendary' | 'heated' | 'budding' | 'geographic';

export const TIER_DISPLAY: Record<RivalryTier, { label: string; color: string; emoji: string }> = {
  legendary:  { label: 'Legendary', color: '#ef4444', emoji: '🔥' },
  heated:     { label: 'Heated', color: '#f97316', emoji: '😤' },
  budding:    { label: 'Budding', color: '#eab308', emoji: '🌱' },
  geographic: { label: 'Geographic', color: '#94a3b8', emoji: '📍' },
};

export function getHeatLabel(heat: number): { label: string; color: string } {
  if (heat >= 80) return { label: 'White Hot', color: '#ef4444' };
  if (heat >= 60) return { label: 'Intense', color: '#f97316' };
  if (heat >= 40) return { label: 'Competitive', color: '#eab308' };
  if (heat >= 20) return { label: 'Mild', color: '#a3e635' };
  return { label: 'Dormant', color: '#94a3b8' };
}

export function getRivalryBoost(rivalry: Rivalry): number {
  if (rivalry.heat >= 80) return 5;
  if (rivalry.heat >= 60) return 3;
  if (rivalry.heat >= 40) return 2;
  return 1;
}

export function getWinPct(wins: number, total: number): string {
  if (total === 0) return '.000';
  return (wins / total).toFixed(3).replace(/^0/, '');
}

// ─── Demo data ────────────────────────────────────────────────────────────

export function generateDemoRivalries(): Rivalry[] {
  return [
    {
      id: 'nyy_bos',
      teamA: 'New York Yankees',
      teamB: 'Boston Red Sox',
      teamAAbbr: 'NYY',
      teamBAbbr: 'BOS',
      heat: 92,
      tier: 'legendary',
      history: 'The greatest rivalry in American sports. Over a century of battles.',
      recordA: 1242,
      recordB: 1078,
      currentStreakTeam: 'NYY',
      currentStreak: 3,
      lastMemorable: 'Yankees walked off on a 3-run HR in the 9th',
      boost: 5,
    },
    {
      id: 'lad_sfg',
      teamA: 'Los Angeles Dodgers',
      teamB: 'San Francisco Giants',
      teamAAbbr: 'LAD',
      teamBAbbr: 'SFG',
      heat: 85,
      tier: 'legendary',
      history: 'From New York to California — a rivalry that spans coasts and decades.',
      recordA: 1188,
      recordB: 1152,
      currentStreakTeam: 'LAD',
      currentStreak: 2,
      lastMemorable: 'Benches cleared after a high-and-tight fastball',
      boost: 5,
    },
    {
      id: 'chc_stl',
      teamA: 'Chicago Cubs',
      teamB: 'St. Louis Cardinals',
      teamAAbbr: 'CHC',
      teamBAbbr: 'STL',
      heat: 78,
      tier: 'heated',
      history: 'The heart of NL Central — two historic franchises separated by 300 miles.',
      recordA: 1160,
      recordB: 1210,
      currentStreakTeam: 'STL',
      currentStreak: 4,
      lastMemorable: 'Cardinals completed a 3-game sweep in Wrigley',
      boost: 3,
    },
    {
      id: 'hou_tex',
      teamA: 'Houston Astros',
      teamB: 'Texas Rangers',
      teamAAbbr: 'HOU',
      teamBAbbr: 'TEX',
      heat: 68,
      tier: 'heated',
      history: 'Lone Star showdown — Texas bragging rights at stake every series.',
      recordA: 285,
      recordB: 265,
      currentStreakTeam: 'HOU',
      currentStreak: 5,
      lastMemorable: 'Astros ace struck out 14 in a dominant complete game',
      boost: 3,
    },
    {
      id: 'nym_phi',
      teamA: 'New York Mets',
      teamB: 'Philadelphia Phillies',
      teamAAbbr: 'NYM',
      teamBAbbr: 'PHI',
      heat: 72,
      tier: 'heated',
      history: 'NL East firebrands — loud fans, louder baseball.',
      recordA: 418,
      recordB: 430,
      currentStreakTeam: 'PHI',
      currentStreak: 2,
      lastMemorable: 'Phillies hit back-to-back-to-back HRs to take the lead',
      boost: 3,
    },
    {
      id: 'atl_nym',
      teamA: 'Atlanta Braves',
      teamB: 'New York Mets',
      teamAAbbr: 'ATL',
      teamBAbbr: 'NYM',
      heat: 55,
      tier: 'budding',
      history: 'Recent playoff battles have turned up the heat in the NL East.',
      recordA: 380,
      recordB: 365,
      currentStreakTeam: 'ATL',
      currentStreak: 1,
      lastMemorable: 'Braves clinched the division in a head-to-head series',
      boost: 2,
    },
    {
      id: 'cws_chc',
      teamA: 'Chicago White Sox',
      teamB: 'Chicago Cubs',
      teamAAbbr: 'CWS',
      teamBAbbr: 'CHC',
      heat: 48,
      tier: 'geographic',
      history: 'The crosstown classic — North Side vs South Side.',
      recordA: 56,
      recordB: 72,
      currentStreakTeam: 'CHC',
      currentStreak: 3,
      lastMemorable: 'Sold-out Wrigley for the weekend Crosstown Classic',
      boost: 2,
    },
    {
      id: 'oak_sfg',
      teamA: 'Oakland Athletics',
      teamB: 'San Francisco Giants',
      teamAAbbr: 'OAK',
      teamBAbbr: 'SFG',
      heat: 35,
      tier: 'geographic',
      history: 'Bay Bridge Series — respect across the water.',
      recordA: 62,
      recordB: 68,
      currentStreakTeam: 'SFG',
      currentStreak: 2,
      lastMemorable: 'Giants swept the Bay Bridge Series',
      boost: 1,
    },
  ];
}

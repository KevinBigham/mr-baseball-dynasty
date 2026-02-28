/**
 * careerMilestones.ts – Career Milestones Tracker Engine
 *
 * Bloomberg-terminal-style tracking of players approaching or
 * surpassing career milestones (hits, HRs, Ks, wins, saves, WAR).
 * All demo data — no sim engine changes.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type MilestoneCategory = 'Hits' | 'HR' | 'RBI' | 'SB' | 'Wins' | 'Strikeouts' | 'Saves' | 'WAR';
export type MilestoneStatus = 'achieved' | 'imminent' | 'on_track' | 'distant';

export interface MilestoneTarget {
  milestone: string;       // e.g. "3,000 Hits", "500 HR"
  category: MilestoneCategory;
  threshold: number;
  current: number;
  remaining: number;
  pace: number;            // projected end-of-career total
  eta: string;             // e.g. "Aug 2025" or "2027 season"
  status: MilestoneStatus;
}

export interface MilestonePlayer {
  id: string;
  name: string;
  team: string;
  position: string;
  age: number;
  yearsPlayed: number;
  milestones: MilestoneTarget[];
  achievedCount: number;
  imminentCount: number;
  hofProbability: number;   // 0-100
  notes: string;
}

// ── Display Map ────────────────────────────────────────────────────────────

export const STATUS_DISPLAY: Record<MilestoneStatus, { label: string; color: string }> = {
  achieved:  { label: 'Achieved',  color: '#22c55e' },
  imminent:  { label: 'Imminent',  color: '#4ade80' },
  on_track:  { label: 'On Track',  color: '#f59e0b' },
  distant:   { label: 'Distant',   color: '#888888' },
};

// ── Summary ────────────────────────────────────────────────────────────────

export interface MilestoneSummary {
  totalPlayers: number;
  achievedThisSeason: number;
  imminent: number;
  nextMilestone: string;
  highestHOFProb: string;
}

export function getMilestoneSummary(players: MilestonePlayer[]): MilestoneSummary {
  const achieved = players.reduce((s, p) => s + p.achievedCount, 0);
  const imminent = players.reduce((s, p) => s + p.imminentCount, 0);
  const highestHOF = [...players].sort((a, b) => b.hofProbability - a.hofProbability)[0];

  // Find next imminent milestone
  let nextMS = 'None';
  for (const p of players) {
    for (const m of p.milestones) {
      if (m.status === 'imminent') {
        nextMS = `${p.name}: ${m.milestone}`;
        break;
      }
    }
    if (nextMS !== 'None') break;
  }

  return {
    totalPlayers: players.length,
    achievedThisSeason: achieved,
    imminent,
    nextMilestone: nextMS,
    highestHOFProb: `${highestHOF.name} (${highestHOF.hofProbability}%)`,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoMilestones(): MilestonePlayer[] {
  return [
    {
      id: 'ms-1',
      name: 'Albert Pujols',
      team: 'Retired',
      position: '1B',
      age: 44,
      yearsPlayed: 22,
      milestones: [
        { milestone: '700 HR', category: 'HR', threshold: 700, current: 703, remaining: 0, pace: 703, eta: 'Achieved', status: 'achieved' },
        { milestone: '3,000 Hits', category: 'Hits', threshold: 3000, current: 3384, remaining: 0, pace: 3384, eta: 'Achieved', status: 'achieved' },
        { milestone: '2,000 RBI', category: 'RBI', threshold: 2000, current: 2218, remaining: 0, pace: 2218, eta: 'Achieved', status: 'achieved' },
      ],
      achievedCount: 3, imminentCount: 0, hofProbability: 99,
      notes: 'First ballot Hall of Famer. One of the greatest right-handed hitters ever.',
    },
    {
      id: 'ms-2',
      name: 'Miguel Cabrera',
      team: 'Retired',
      position: '1B/DH',
      age: 41,
      yearsPlayed: 21,
      milestones: [
        { milestone: '3,000 Hits', category: 'Hits', threshold: 3000, current: 3174, remaining: 0, pace: 3174, eta: 'Achieved', status: 'achieved' },
        { milestone: '500 HR', category: 'HR', threshold: 500, current: 511, remaining: 0, pace: 511, eta: 'Achieved', status: 'achieved' },
      ],
      achievedCount: 2, imminentCount: 0, hofProbability: 98,
      notes: 'Triple Crown winner. Last to achieve the feat in the AL.',
    },
    {
      id: 'ms-3',
      name: 'Mike Trout',
      team: 'LAA',
      position: 'CF',
      age: 33,
      yearsPlayed: 13,
      milestones: [
        { milestone: '400 HR', category: 'HR', threshold: 400, current: 378, remaining: 22, pace: 420, eta: 'Jul 2026', status: 'on_track' },
        { milestone: '100 WAR', category: 'WAR', threshold: 100, current: 85.2, remaining: 14.8, pace: 96, eta: '2028', status: 'on_track' },
        { milestone: '1,500 RBI', category: 'RBI', threshold: 1500, current: 982, remaining: 518, pace: 1320, eta: 'Unlikely', status: 'distant' },
      ],
      achievedCount: 0, imminentCount: 0, hofProbability: 96,
      notes: 'Injuries have slowed pace. 400 HR still achievable with health. WAR milestone needs 3+ healthy seasons.',
    },
    {
      id: 'ms-4',
      name: 'Justin Verlander',
      team: 'HOU',
      position: 'SP',
      age: 41,
      yearsPlayed: 19,
      milestones: [
        { milestone: '3,500 K', category: 'Strikeouts', threshold: 3500, current: 3416, remaining: 84, pace: 3510, eta: 'Jul 2025', status: 'imminent' },
        { milestone: '260 Wins', category: 'Wins', threshold: 260, current: 254, remaining: 6, pace: 262, eta: 'Sep 2025', status: 'imminent' },
      ],
      achievedCount: 0, imminentCount: 2, hofProbability: 95,
      notes: 'Two milestones within reach this season. 3,500 K would join elite company.',
    },
    {
      id: 'ms-5',
      name: 'Freddie Freeman',
      team: 'LAD',
      position: '1B',
      age: 35,
      yearsPlayed: 15,
      milestones: [
        { milestone: '2,500 Hits', category: 'Hits', threshold: 2500, current: 2,422, remaining: 78, pace: 2,620, eta: 'Jun 2025', status: 'imminent' },
        { milestone: '350 HR', category: 'HR', threshold: 350, current: 326, remaining: 24, pace: 365, eta: '2026', status: 'on_track' },
      ],
      achievedCount: 0, imminentCount: 1, hofProbability: 72,
      notes: '2,500 hits within reach this season. HOF case building with continued production.',
    },
    {
      id: 'ms-6',
      name: 'Manny Machado',
      team: 'SD',
      position: '3B',
      age: 32,
      yearsPlayed: 13,
      milestones: [
        { milestone: '2,000 Hits', category: 'Hits', threshold: 2000, current: 1886, remaining: 114, pace: 2400, eta: '2026', status: 'on_track' },
        { milestone: '350 HR', category: 'HR', threshold: 350, current: 318, remaining: 32, pace: 420, eta: '2026', status: 'on_track' },
      ],
      achievedCount: 0, imminentCount: 0, hofProbability: 62,
      notes: 'Compiling impressive career numbers. On pace for 2,000+ hits and 400+ HR.',
    },
    {
      id: 'ms-7',
      name: 'Aaron Judge',
      team: 'NYY',
      position: 'CF',
      age: 32,
      yearsPlayed: 8,
      milestones: [
        { milestone: '300 HR', category: 'HR', threshold: 300, current: 284, remaining: 16, pace: 340, eta: 'Jun 2025', status: 'imminent' },
        { milestone: '100 WAR', category: 'WAR', threshold: 100, current: 42.8, remaining: 57.2, pace: 72, eta: 'Unlikely', status: 'distant' },
      ],
      achievedCount: 0, imminentCount: 1, hofProbability: 48,
      notes: '300 HR within reach. Late start limits career totals for HOF consideration.',
    },
    {
      id: 'ms-8',
      name: 'Kenley Jansen',
      team: 'BOS',
      position: 'CL',
      age: 37,
      yearsPlayed: 14,
      milestones: [
        { milestone: '425 Saves', category: 'Saves', threshold: 425, current: 418, remaining: 7, pace: 430, eta: 'May 2025', status: 'imminent' },
      ],
      achievedCount: 0, imminentCount: 1, hofProbability: 35,
      notes: '425 saves within reach. Would join exclusive 425+ saves club.',
    },
  ];
}

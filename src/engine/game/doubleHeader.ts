/**
 * Double-Header Management
 *
 * MLB doubleheaders require roster management, pitcher allocation,
 * lineup rotation, and stamina tracking across both games.
 * Split doubleheaders and traditional doubleheaders have different rules.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type DHType = 'traditional' | 'split' | 'makeup';

export const DH_TYPE_DISPLAY: Record<DHType, { label: string; color: string; desc: string }> = {
  traditional: { label: 'Traditional',  color: '#f97316', desc: 'Back-to-back 7-inning games (no gap)' },
  split:       { label: 'Split',        color: '#3b82f6', desc: 'Day-night split with gap between games' },
  makeup:      { label: 'Makeup',       color: '#eab308', desc: 'Rescheduled rainout as doubleheader' },
};

export type GameStatus = 'upcoming' | 'in_progress' | 'complete';

export interface DHGame {
  gameNumber: 1 | 2;
  status: GameStatus;
  startingPitcher: string;
  pitcherOvr: number;
  pitcherFatigue: number;
  innings: number;        // 7 or 9
  lineupChanges: number;
  score: { us: number; them: number } | null;
  note: string;
}

export interface DHRosterState {
  availableRelievers: number;
  totalRelievers: number;
  positionPlayersFatigued: number;
  benchPlayersUsed: number;
  benchPlayersRemaining: number;
  twentySixthManActive: boolean;  // MLB rule: 26th man added for DH
  rosterSize: number;
}

export interface DoubleHeaderState {
  id: number;
  date: string;
  opponent: string;
  type: DHType;
  game1: DHGame;
  game2: DHGame;
  roster: DHRosterState;
  fatigueWarnings: string[];
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getStaminaImpact(game1Used: boolean): { staminaHit: number; desc: string } {
  if (game1Used) return { staminaHit: -15, desc: 'Played game 1 — reduced stamina for game 2' };
  return { staminaHit: 0, desc: 'Fresh for game 2' };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoDoubleHeaders(): DoubleHeaderState[] {
  return [
    {
      id: 0,
      date: '2024-07-15',
      opponent: 'NYY',
      type: 'split',
      game1: {
        gameNumber: 1, status: 'complete',
        startingPitcher: 'Gerrit Cole', pitcherOvr: 89, pitcherFatigue: 0,
        innings: 7, lineupChanges: 2,
        score: { us: 5, them: 3 },
        note: 'Cole dominated — 6 IP, 2 ER, 9 K',
      },
      game2: {
        gameNumber: 2, status: 'in_progress',
        startingPitcher: 'Carlos Rodon', pitcherOvr: 78, pitcherFatigue: 20,
        innings: 7, lineupChanges: 0,
        score: { us: 2, them: 2 },
        note: 'Tight game — Rodon battling through 4th',
      },
      roster: {
        availableRelievers: 5, totalRelievers: 8,
        positionPlayersFatigued: 3, benchPlayersUsed: 2,
        benchPlayersRemaining: 3, twentySixthManActive: true, rosterSize: 27,
      },
      fatigueWarnings: ['SS Henderson played both games — tired legs', 'CF Mullins banged up from game 1 collision'],
    },
    {
      id: 1,
      date: '2024-08-22',
      opponent: 'BOS',
      type: 'traditional',
      game1: {
        gameNumber: 1, status: 'upcoming',
        startingPitcher: 'Zack Wheeler', pitcherOvr: 86, pitcherFatigue: 0,
        innings: 7, lineupChanges: 0,
        score: null,
        note: 'Wheeler on regular rest — bullpen fresh',
      },
      game2: {
        gameNumber: 2, status: 'upcoming',
        startingPitcher: 'TBD (Bullpen)', pitcherOvr: 72, pitcherFatigue: 0,
        innings: 7, lineupChanges: 0,
        score: null,
        note: 'Opener strategy — need to manage pen carefully',
      },
      roster: {
        availableRelievers: 8, totalRelievers: 8,
        positionPlayersFatigued: 0, benchPlayersUsed: 0,
        benchPlayersRemaining: 5, twentySixthManActive: true, rosterSize: 27,
      },
      fatigueWarnings: ['Back-to-back games — monitor C fatigue', 'Wheeler on short rest concern'],
    },
    {
      id: 2,
      date: '2024-09-05',
      opponent: 'ATL',
      type: 'makeup',
      game1: {
        gameNumber: 1, status: 'complete',
        startingPitcher: 'Spencer Strider', pitcherOvr: 84, pitcherFatigue: 0,
        innings: 7, lineupChanges: 3,
        score: { us: 8, them: 1 },
        note: 'Strider brilliant — 6 IP, 0 ER, 12 K',
      },
      game2: {
        gameNumber: 2, status: 'complete',
        startingPitcher: 'Max Fried', pitcherOvr: 83, pitcherFatigue: 10,
        innings: 7, lineupChanges: 4,
        score: { us: 3, them: 4 },
        note: 'Fried solid but pen blew lead in 7th',
      },
      roster: {
        availableRelievers: 2, totalRelievers: 8,
        positionPlayersFatigued: 5, benchPlayersUsed: 4,
        benchPlayersRemaining: 1, twentySixthManActive: true, rosterSize: 27,
      },
      fatigueWarnings: ['Bullpen exhausted — 6 relievers used across both games', 'Multiple position players at max fatigue'],
    },
  ];
}

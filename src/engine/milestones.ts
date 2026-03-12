/**
 * Career milestone detection.
 * Scans career history after each season to detect landmark achievements.
 */

import type { PlayerSeason } from '../types/player';

export interface CareerMilestone {
  playerId: number;
  playerName: string;
  milestone: string;
  value: number;
  season: number;
  category: 'hitting' | 'pitching';
}

interface MilestoneThreshold {
  stat: string;
  thresholds: number[];
  label: (value: number) => string;
  category: 'hitting' | 'pitching';
  accumulate: (seasons: PlayerSeason[]) => number;
}

const MILESTONES: MilestoneThreshold[] = [
  {
    stat: 'hr',
    thresholds: [100, 200, 300, 400, 500, 600, 700],
    label: (v) => `${v} Career Home Runs`,
    category: 'hitting',
    accumulate: (s) => s.reduce((sum, ps) => sum + ps.hr, 0),
  },
  {
    stat: 'hits',
    thresholds: [500, 1000, 1500, 2000, 2500, 3000],
    label: (v) => `${v} Career Hits`,
    category: 'hitting',
    accumulate: (s) => s.reduce((sum, ps) => sum + ps.hits, 0),
  },
  {
    stat: 'rbi',
    thresholds: [500, 1000, 1500, 2000],
    label: (v) => `${v} Career RBI`,
    category: 'hitting',
    accumulate: (s) => s.reduce((sum, ps) => sum + ps.rbi, 0),
  },
  {
    stat: 'wins',
    thresholds: [50, 100, 150, 200, 250, 300],
    label: (v) => `${v} Career Wins`,
    category: 'pitching',
    accumulate: (s) => s.reduce((sum, ps) => sum + ps.wins, 0),
  },
  {
    stat: 'kPitching',
    thresholds: [500, 1000, 1500, 2000, 2500, 3000],
    label: (v) => `${v} Career Strikeouts`,
    category: 'pitching',
    accumulate: (s) => s.reduce((sum, ps) => sum + ps.kPitching, 0),
  },
  {
    stat: 'saves',
    thresholds: [100, 200, 300, 400, 500],
    label: (v) => `${v} Career Saves`,
    category: 'pitching',
    accumulate: (s) => s.reduce((sum, ps) => sum + ps.saves, 0),
  },
];

/**
 * Check all players' career histories for newly reached milestones.
 * Pass previousTotals from the prior check to avoid re-firing.
 */
export function detectMilestones(
  careerHistory: Map<number, PlayerSeason[]>,
  playerNames: Map<number, string>,
  currentSeason: number,
  previousMilestones: Set<string>,
): CareerMilestone[] {
  const newMilestones: CareerMilestone[] = [];

  for (const [playerId, seasons] of careerHistory) {
    const name = playerNames.get(playerId) ?? `Player ${playerId}`;

    for (const def of MILESTONES) {
      const total = def.accumulate(seasons);

      for (const threshold of def.thresholds) {
        const key = `${playerId}-${def.stat}-${threshold}`;
        if (previousMilestones.has(key)) continue;
        if (total >= threshold) {
          previousMilestones.add(key);
          newMilestones.push({
            playerId,
            playerName: name,
            milestone: def.label(threshold),
            value: total,
            season: currentSeason,
            category: def.category,
          });
        }
      }
    }
  }

  return newMilestones;
}

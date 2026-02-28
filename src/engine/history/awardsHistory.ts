/**
 * Awards History & Record Book — Mr. Baseball Dynasty
 *
 * Tracks historical awards and records across all seasons:
 *   - Season-by-season award winners (MVP, Cy Young, ROY)
 *   - Championship history
 *   - Notable transactions log
 *   - Season milestone tracking
 *
 * Inspired by OOTP's award history and Hardball Dynasty's record book.
 */

import type { SeasonAwards } from '../player/awards';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface AwardHistoryEntry {
  season:    number;
  award:     string;        // "MVP (AL)", "Cy Young (NL)", etc.
  playerId:  number;
  name:      string;
  teamName:  string;
  position:  string;
  statLine:  string;        // "42 HR, .303 AVG, 121 RBI" etc.
}

export interface ChampionHistoryEntry {
  season:     number;
  teamId:     number;
  teamName:   string;
  record:     string;       // "98-64"
  mvpPlayerId?: number;
  mvpName?:    string;
}

export interface TransactionLog {
  season:      number;
  date:        string;      // "Offseason" or "Mid-season"
  type:        string;      // "Trade", "Signing", "Draft", "DFA", "Rule 5", etc.
  description: string;
  teamIds:     number[];
}

export interface SeasonMilestone {
  season:    number;
  playerId:  number;
  name:      string;
  milestone: string;        // "3000th Hit", "500th HR", etc.
}

// ─── State ──────────────────────────────────────────────────────────────────────

const _awardHistory: AwardHistoryEntry[] = [];
const _championHistory: ChampionHistoryEntry[] = [];
const _transactionLog: TransactionLog[] = [];
const _milestones: SeasonMilestone[] = [];

// ─── Record awards ──────────────────────────────────────────────────────────────

export function recordSeasonAwards(
  season: number,
  awards: SeasonAwards,
  teams: Array<{ teamId: number; name: string }>,
  playerStats: Map<number, { pa: number; ab: number; h: number; hr: number; rbi: number; outs: number; er: number; w: number; ka: number; sv: number }>,
): void {
  const teamMap = new Map(teams.map(t => [t.teamId, t.name]));

  const addAward = (award: string, w: { playerId: number; name: string; teamId: number; position: string } | null) => {
    if (!w) return;
    const s = playerStats.get(w.playerId);
    let statLine = '';
    if (s) {
      if (award.includes('Cy Young')) {
        const era = s.outs > 0 ? ((s.er / s.outs) * 27).toFixed(2) : '0.00';
        const ip = (s.outs / 3).toFixed(1);
        statLine = `${s.w}W, ${era} ERA, ${s.ka} K, ${ip} IP`;
      } else {
        const avg = s.ab > 0 ? (s.h / s.ab).toFixed(3) : '.000';
        statLine = `${s.hr} HR, ${avg} AVG, ${s.rbi} RBI`;
      }
    }
    _awardHistory.push({
      season,
      award,
      playerId: w.playerId,
      name: w.name,
      teamName: teamMap.get(w.teamId) ?? '???',
      position: w.position,
      statLine,
    });
  };

  addAward('MVP (AL)', awards.mvpAL);
  addAward('MVP (NL)', awards.mvpNL);
  addAward('Cy Young (AL)', awards.cyYoungAL);
  addAward('Cy Young (NL)', awards.cyYoungNL);
  addAward('ROY (AL)', awards.royAL);
  addAward('ROY (NL)', awards.royNL);
}

// ─── Record champion ────────────────────────────────────────────────────────────

export function recordChampion(
  season: number,
  teamId: number,
  teamName: string,
  record: string,
  wsMvpId?: number,
  wsMvpName?: string,
): void {
  _championHistory.push({
    season,
    teamId,
    teamName,
    record,
    mvpPlayerId: wsMvpId,
    mvpName: wsMvpName,
  });
}

// ─── Record transaction ─────────────────────────────────────────────────────────

export function recordTransaction(
  season: number,
  date: string,
  type: string,
  description: string,
  teamIds: number[],
): void {
  _transactionLog.push({ season, date, type, description, teamIds });
}

// ─── Record milestone ───────────────────────────────────────────────────────────

export function checkMilestones(
  season: number,
  careerStats: Map<number, { name: string; h: number; hr: number; ka: number; w: number; sv: number }>,
): SeasonMilestone[] {
  const newMilestones: SeasonMilestone[] = [];

  for (const [pid, stats] of careerStats) {
    const thresholds = [
      { stat: stats.h, levels: [1000, 2000, 3000], label: 'Hit' },
      { stat: stats.hr, levels: [100, 200, 300, 400, 500, 600], label: 'HR' },
      { stat: stats.ka, levels: [1000, 2000, 3000], label: 'K (pitching)' },
      { stat: stats.w, levels: [100, 150, 200, 250, 300], label: 'Win' },
      { stat: stats.sv, levels: [100, 200, 300, 400, 500], label: 'Save' },
    ];

    for (const t of thresholds) {
      for (const level of t.levels) {
        if (t.stat >= level) {
          const milestone = `${level}th ${t.label}`;
          // Check if already recorded
          if (!_milestones.some(m => m.playerId === pid && m.milestone === milestone)) {
            _milestones.push({ season, playerId: pid, name: stats.name, milestone });
            newMilestones.push({ season, playerId: pid, name: stats.name, milestone });
          }
        }
      }
    }
  }

  return newMilestones;
}

// ─── Getters ────────────────────────────────────────────────────────────────────

export function getAwardHistory(): AwardHistoryEntry[] {
  return [..._awardHistory].sort((a, b) => b.season - a.season);
}

export function getChampionHistory(): ChampionHistoryEntry[] {
  return [..._championHistory].sort((a, b) => b.season - a.season);
}

export function getTransactionLog(teamId?: number, limit = 100): TransactionLog[] {
  let log = _transactionLog;
  if (teamId !== undefined) {
    log = log.filter(t => t.teamIds.includes(teamId));
  }
  return log.slice(-limit).reverse();
}

export function getMilestones(): SeasonMilestone[] {
  return [..._milestones].sort((a, b) => b.season - a.season);
}

// ─── Restore from save ──────────────────────────────────────────────────────────

export function restoreAwardsHistory(data: {
  awardHistory: AwardHistoryEntry[];
  championHistory: ChampionHistoryEntry[];
  transactionLog: TransactionLog[];
  milestones: SeasonMilestone[];
}): void {
  _awardHistory.length = 0;
  _awardHistory.push(...data.awardHistory);
  _championHistory.length = 0;
  _championHistory.push(...data.championHistory);
  _transactionLog.length = 0;
  _transactionLog.push(...data.transactionLog);
  _milestones.length = 0;
  _milestones.push(...data.milestones);
}

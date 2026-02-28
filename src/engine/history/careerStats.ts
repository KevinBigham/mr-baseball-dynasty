/**
 * Career Stats & Hall of Fame Engine — Mr. Baseball Dynasty
 *
 * Tracks multi-season statistics:
 *   - Career totals for every player
 *   - Historical season-by-season records
 *   - Hall of Fame eligibility and induction
 *   - All-time leaderboards
 *   - Franchise records
 *
 * Inspired by OOTP's historical stats and Hardball Dynasty's record books.
 */

import type { PlayerSeasonStats } from '../../types/player';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface CareerRecord {
  playerId:   number;
  name:       string;
  seasons:    number;
  // Cumulative batting
  g: number; pa: number; ab: number; r: number; h: number;
  doubles: number; triples: number; hr: number;
  rbi: number; bb: number; k: number; sb: number; cs: number; hbp: number;
  // Cumulative pitching
  w: number; l: number; sv: number; outs: number;
  ha: number; er: number; bba: number; ka: number; hra: number;
  gs: number; qs: number; cg: number; sho: number;
  pitchCount: number;   // cumulative pitch count
  // Derived (computed on read)
  avg?: number;
  obp?: number;
  slg?: number;
  era?: number;
  whip?: number;
  // Season history
  seasonLog: SeasonLogEntry[];
  // HOF tracking
  hofEligible:  boolean;
  hofInducted:  boolean;
  hofYear?:     number;
  hofVotePct?:  number;
}

export interface SeasonLogEntry {
  season:   number;
  teamId:   number;
  teamName: string;
  age:      number;
  // Key stats
  g: number; pa: number; ab: number; h: number; hr: number;
  rbi: number; bb: number; k: number; sb: number;
  avg: number;
  // Pitching
  w: number; l: number; sv: number; era: number; ip: number; ka: number;
  gs: number; qs: number; cg: number; sho: number;
  // Awards
  awards: string[];
}

export interface HOFCandidate {
  playerId:    number;
  name:        string;
  position:    string;
  isPitcher:   boolean;
  seasons:     number;
  keyStats:    string;   // "3012 H, 342 HR, .302 AVG" or "214 W, 3.21 ERA, 2854 K"
  hofScore:    number;   // 0-100 HOF worthiness
  votePct:     number;   // Simulated vote percentage
  inducted:    boolean;
}

// ─── Career stats store ─────────────────────────────────────────────────────────

const _careerRecords = new Map<number, CareerRecord>();

export function getCareerRecords(): Map<number, CareerRecord> {
  return _careerRecords;
}

export function getCareerRecord(playerId: number): CareerRecord | undefined {
  return _careerRecords.get(playerId);
}

export function restoreCareerRecords(records: Array<[number, CareerRecord]>): void {
  _careerRecords.clear();
  for (const [id, record] of records) {
    _careerRecords.set(id, record);
  }
}

// ─── Record season stats ────────────────────────────────────────────────────────

export function recordSeasonStats(
  stats: PlayerSeasonStats[],
  players: Array<{ playerId: number; name: string; age: number; position: string; isPitcher: boolean }>,
  teams: Array<{ teamId: number; name: string }>,
  season: number,
  awards: Array<{ playerId: number; award: string }>,
): void {
  const teamMap = new Map(teams.map(t => [t.teamId, t.name]));
  const awardMap = new Map<number, string[]>();
  for (const a of awards) {
    const list = awardMap.get(a.playerId) ?? [];
    list.push(a.award);
    awardMap.set(a.playerId, list);
  }

  for (const s of stats) {
    // Skip players with minimal playing time
    if (s.pa < 10 && s.outs < 10) continue;

    const player = players.find(p => p.playerId === s.playerId);
    if (!player) continue;

    let career = _careerRecords.get(s.playerId);
    if (!career) {
      career = {
        playerId: s.playerId,
        name: player.name,
        seasons: 0,
        g: 0, pa: 0, ab: 0, r: 0, h: 0,
        doubles: 0, triples: 0, hr: 0,
        rbi: 0, bb: 0, k: 0, sb: 0, cs: 0, hbp: 0,
        w: 0, l: 0, sv: 0, outs: 0,
        ha: 0, er: 0, bba: 0, ka: 0, hra: 0,
        gs: 0, qs: 0, cg: 0, sho: 0, pitchCount: 0,
        seasonLog: [],
        hofEligible: false,
        hofInducted: false,
      };
      _careerRecords.set(s.playerId, career);
    }

    career.seasons++;
    career.g += s.g;
    career.pa += s.pa;
    career.ab += s.ab;
    career.r += s.r;
    career.h += s.h;
    career.doubles += s.doubles;
    career.triples += s.triples;
    career.hr += s.hr;
    career.rbi += s.rbi;
    career.bb += s.bb;
    career.k += s.k;
    career.sb += s.sb;
    career.cs += s.cs;
    career.hbp += s.hbp;
    career.w += s.w;
    career.l += s.l;
    career.sv += s.sv;
    career.outs += s.outs;
    career.ha += s.ha;
    career.er += s.er;
    career.bba += s.bba;
    career.ka += s.ka;
    career.hra += s.hra;
    career.gs += s.gs;
    career.qs += s.qs ?? 0;
    career.cg += s.cg ?? 0;
    career.sho += s.sho ?? 0;
    career.pitchCount += s.pitchCount ?? 0;

    // Season log entry
    const ip = s.outs / 3;
    const avg = s.ab > 0 ? s.h / s.ab : 0;
    const era = s.outs > 0 ? (s.er / s.outs) * 27 : 0;

    career.seasonLog.push({
      season,
      teamId: s.teamId,
      teamName: teamMap.get(s.teamId) ?? '???',
      age: player.age,
      g: s.g, pa: s.pa, ab: s.ab, h: s.h, hr: s.hr,
      rbi: s.rbi, bb: s.bb, k: s.k, sb: s.sb,
      avg: Number(avg.toFixed(3)),
      w: s.w, l: s.l, sv: s.sv,
      era: Number(era.toFixed(2)),
      ip: Number(ip.toFixed(1)),
      ka: s.ka,
      gs: s.gs, qs: s.qs ?? 0, cg: s.cg ?? 0, sho: s.sho ?? 0,
      awards: awardMap.get(s.playerId) ?? [],
    });
  }
}

// ─── HOF evaluation ─────────────────────────────────────────────────────────────

function computeHOFScore(career: CareerRecord, isPitcher: boolean): number {
  if (isPitcher) {
    let score = 0;
    score += Math.min(25, career.w * 0.12);     // 200W ≈ 24 pts
    score += Math.min(20, career.ka * 0.007);    // 3000K ≈ 21 pts
    score += Math.min(15, career.sv * 0.03);     // 500SV ≈ 15 pts
    const ip = career.outs / 3;
    score += Math.min(15, ip * 0.005);            // 3000IP ≈ 15 pts
    const era = career.outs > 0 ? (career.er / career.outs) * 27 : 9;
    if (era < 3.0) score += 15;
    else if (era < 3.5) score += 10;
    else if (era < 4.0) score += 5;
    score += Math.min(10, career.seasons * 0.7);  // Longevity
    return Math.min(100, score);
  } else {
    let score = 0;
    score += Math.min(25, career.h * 0.008);      // 3000H ≈ 24 pts
    score += Math.min(20, career.hr * 0.04);       // 500HR ≈ 20 pts
    score += Math.min(10, career.rbi * 0.006);     // 1500RBI ≈ 9 pts
    score += Math.min(10, career.sb * 0.02);       // 500SB ≈ 10 pts
    const avg = career.ab > 0 ? career.h / career.ab : 0;
    if (avg >= 0.320) score += 15;
    else if (avg >= 0.300) score += 10;
    else if (avg >= 0.280) score += 5;
    score += Math.min(10, career.r * 0.005);       // 2000R ≈ 10 pts
    score += Math.min(10, career.seasons * 0.7);   // Longevity
    return Math.min(100, score);
  }
}

export function evaluateHOFCandidates(
  retiredPlayerIds: number[],
  playerInfo: Array<{ playerId: number; position: string; isPitcher: boolean }>,
): HOFCandidate[] {
  const candidates: HOFCandidate[] = [];

  for (const pid of retiredPlayerIds) {
    const career = _careerRecords.get(pid);
    if (!career) continue;
    if (career.seasons < 5) continue; // Need at least 5 seasons
    if (career.hofInducted) continue;

    const info = playerInfo.find(p => p.playerId === pid);
    if (!info) continue;

    const hofScore = computeHOFScore(career, info.isPitcher);
    if (hofScore < 30) continue; // Below threshold

    // Simulate vote percentage
    const votePct = Math.min(100, Math.max(5, hofScore * 1.1 + (Math.random() - 0.5) * 15));
    const inducted = votePct >= 75; // 75% threshold

    if (inducted) {
      career.hofInducted = true;
      career.hofYear = career.seasonLog.length > 0 ? career.seasonLog[career.seasonLog.length - 1].season + 5 : 2030;
      career.hofVotePct = votePct;
    }

    let keyStats: string;
    if (info.isPitcher) {
      const era = career.outs > 0 ? ((career.er / career.outs) * 27).toFixed(2) : '0.00';
      keyStats = `${career.w}W, ${era} ERA, ${career.ka} K`;
    } else {
      const avg = career.ab > 0 ? (career.h / career.ab).toFixed(3) : '.000';
      keyStats = `${career.h} H, ${career.hr} HR, ${avg} AVG`;
    }

    candidates.push({
      playerId: pid,
      name: career.name,
      position: info.position,
      isPitcher: info.isPitcher,
      seasons: career.seasons,
      keyStats,
      hofScore,
      votePct: Number(votePct.toFixed(1)),
      inducted,
    });
  }

  candidates.sort((a, b) => b.hofScore - a.hofScore);
  return candidates;
}

// ─── All-time leaderboards ──────────────────────────────────────────────────────

export type CareerStat = 'h' | 'hr' | 'rbi' | 'sb' | 'r' | 'avg' | 'w' | 'ka' | 'sv' | 'era';

export interface AllTimeLeader {
  rank:     number;
  playerId: number;
  name:     string;
  value:    number;
  display:  string;
  seasons:  number;
  hofInducted: boolean;
}

export function getAllTimeLeaders(stat: CareerStat, limit = 25): AllTimeLeader[] {
  const records = Array.from(_careerRecords.values());
  const results: Array<{ record: CareerRecord; value: number }> = [];

  for (const r of records) {
    let value = 0;
    switch (stat) {
      case 'h':   value = r.h; break;
      case 'hr':  value = r.hr; break;
      case 'rbi': value = r.rbi; break;
      case 'sb':  value = r.sb; break;
      case 'r':   value = r.r; break;
      case 'avg': value = r.ab > 300 ? r.h / r.ab : -1; break;
      case 'w':   value = r.w; break;
      case 'ka':  value = r.ka; break;
      case 'sv':  value = r.sv; break;
      case 'era': value = r.outs > 100 ? -((r.er / r.outs) * 27) : -99; break;
    }
    if (value > -1 || stat === 'era') results.push({ record: r, value });
  }

  results.sort((a, b) => b.value - a.value);

  return results.slice(0, limit).map((r, i) => {
    let display = r.value.toFixed(stat === 'avg' ? 3 : stat === 'era' ? 2 : 0);
    if (stat === 'era') display = (-r.value).toFixed(2);
    return {
      rank: i + 1,
      playerId: r.record.playerId,
      name: r.record.name,
      value: r.value,
      display,
      seasons: r.record.seasons,
      hofInducted: r.record.hofInducted,
    };
  });
}

// ─── Franchise records ──────────────────────────────────────────────────────────

export interface FranchiseRecord {
  type: 'single_season' | 'career';
  stat: string;
  playerId: number;
  name: string;
  value: number;
  display: string;
  season?: number;
}

export function getFranchiseRecords(teamId: number): FranchiseRecord[] {
  const records: FranchiseRecord[] = [];

  for (const career of _careerRecords.values()) {
    for (const entry of career.seasonLog) {
      if (entry.teamId !== teamId) continue;

      // Check single-season records
      const candidates: Array<{ stat: string; value: number; display: string }> = [
        { stat: 'HR', value: entry.hr, display: String(entry.hr) },
        { stat: 'RBI', value: entry.rbi, display: String(entry.rbi) },
        { stat: 'Hits', value: entry.h, display: String(entry.h) },
        { stat: 'SB', value: entry.sb, display: String(entry.sb) },
        { stat: 'AVG', value: entry.avg, display: entry.avg.toFixed(3) },
        { stat: 'Wins', value: entry.w, display: String(entry.w) },
        { stat: 'ERA', value: entry.era > 0 ? -entry.era : -99, display: entry.era.toFixed(2) },
        { stat: 'K', value: entry.ka, display: String(entry.ka) },
        { stat: 'SV', value: entry.sv, display: String(entry.sv) },
      ];

      for (const c of candidates) {
        const existing = records.find(r => r.stat === c.stat && r.type === 'single_season');
        if (!existing || c.value > existing.value) {
          const idx = records.findIndex(r => r.stat === c.stat && r.type === 'single_season');
          const rec: FranchiseRecord = {
            type: 'single_season',
            stat: c.stat,
            playerId: career.playerId,
            name: career.name,
            value: c.value,
            display: c.display,
            season: entry.season,
          };
          if (idx >= 0) records[idx] = rec;
          else records.push(rec);
        }
      }
    }
  }

  // Sort ERA records correctly (lower is better)
  return records;
}

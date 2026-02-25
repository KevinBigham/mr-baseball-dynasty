/// <reference lib="webworker" />
import * as Comlink from 'comlink';
import type { Player } from '../types/player';
import type { Team } from '../types/team';
import type {
  LeagueState, SeasonResult, StandingsData, RosterData,
  LeaderboardEntry, PlayerProfileData, RosterPlayer, StandingsRow,
} from '../types/league';
import type { ScheduleEntry } from '../types/game';
import { createPRNG, serializeState, deserializeState } from './math/prng';
import { generateLeaguePlayers } from './player/generation';
import { buildInitialTeams } from '../data/teams';
import { generateScheduleTemplate as generateSchedule } from '../data/scheduleTemplate';
import { simulateSeason, advanceServiceTime, resetSeasonCounters } from './sim/seasonSimulator';
import { pythagenpatWinPct } from './math/bayesian';
import { toScoutingScale } from './player/attributes';
import { PARK_FACTORS } from '../data/parkFactors';

// ─── Worker-side state ────────────────────────────────────────────────────────
// The worker owns the canonical game state. The UI queries for what it needs.

let _state: LeagueState | null = null;
let _playerMap = new Map<number, Player>();
let _teamMap = new Map<number, Team>();
let _playerSeasonStats = new Map<number, import('../types/player').PlayerSeasonStats>();
let _seasonResults: SeasonResult[] = [];

// ─── Internal helpers ─────────────────────────────────────────────────────────

function requireState(): LeagueState {
  if (!_state) throw new Error('No game loaded. Call newGame() first.');
  return _state;
}

function rebuildMaps(): void {
  if (!_state) return;
  _playerMap = new Map(_state.players.map(p => [p.playerId, p]));
  _teamMap   = new Map(_state.teams.map(t => [t.teamId, t]));
}

function computeOverall(player: Player): number {
  return player.overall;
}

function playerToRosterPlayer(p: Player, stats: import('../types/player').PlayerSeasonStats | undefined): RosterPlayer {
  const s = stats;
  const ip = s ? s.outs / 3 : 0;
  const era = (s && s.outs > 0) ? (s.er / s.outs) * 27 : 0;
  const whip = (s && s.outs > 0) ? ((s.bba + s.ha) / (s.outs / 3)) : 0;
  const k9 = (s && s.outs > 0) ? (s.ka / (s.outs / 3)) * 9 : 0;
  const bb9 = (s && s.outs > 0) ? (s.bba / (s.outs / 3)) * 9 : 0;
  const avg = (s && s.ab > 0) ? s.h / s.ab : 0;
  const obp = (s && (s.pa > 0)) ? (s.h + s.bb + s.hbp) / s.pa : 0;
  const slg = (s && s.ab > 0) ? (s.h - s.doubles - s.triples - s.hr + s.doubles * 2 + s.triples * 3 + s.hr * 4) / s.ab : 0;

  return {
    playerId: p.playerId,
    name: p.name,
    position: p.position,
    age: p.age,
    bats: p.bats,
    throws: p.throws,
    isPitcher: p.isPitcher,
    overall: p.overall,
    potential: p.potential,
    rosterStatus: p.rosterData.rosterStatus,
    isOn40Man: p.rosterData.isOn40Man,
    optionYearsRemaining: p.rosterData.optionYearsRemaining,
    serviceTimeDays: p.rosterData.serviceTimeDays,
    salary: p.rosterData.salary,
    contractYearsRemaining: p.rosterData.contractYearsRemaining,
    stats: p.isPitcher
      ? { w: s?.w, l: s?.l, sv: s?.sv, era: Number(era.toFixed(2)), ip: Number(ip.toFixed(1)), k9: Number(k9.toFixed(1)), bb9: Number(bb9.toFixed(1)), whip: Number(whip.toFixed(2)) }
      : { pa: s?.pa, avg: Number(avg.toFixed(3)), obp: Number(obp.toFixed(3)), slg: Number(slg.toFixed(3)), hr: s?.hr, rbi: s?.rbi, sb: s?.sb, k: s?.k, bb: s?.bb },
  };
}

// ─── Public API (Comlink-exposed) ─────────────────────────────────────────────
const api = {

  // ── New game ───────────────────────────────────────────────────────────────
  async newGame(seed: number, userTeamId: number): Promise<{ ok: boolean; season: number; teamCount: number }> {
    const gen = createPRNG(seed);
    const teams = buildInitialTeams();
    const [players, nextGen] = generateLeaguePlayers(gen, teams, 2026);
    const schedule: ScheduleEntry[] = generateSchedule();

    _state = {
      season: 2026,
      teams,
      players,
      schedule,
      environment: { pitcherBuffFactor: 1.0, hitterBuffFactor: 1.0, babipAdjustment: 0 },
      prngState: serializeState(nextGen),
      userTeamId,
    };
    _playerSeasonStats = new Map();
    _seasonResults = [];
    rebuildMaps();

    return { ok: true, season: _state.season, teamCount: teams.length };
  },

  // ── Simulate a season ─────────────────────────────────────────────────────
  async simulateSeason(onProgressCallback?: (pct: number) => void): Promise<SeasonResult> {
    const state = requireState();
    let gen = deserializeState(state.prngState);

    // Reset counters at season start
    resetSeasonCounters(state.players);

    const result = await simulateSeason(
      state.teams,
      state.players,
      state.schedule,
      Number(gen.next()[0]),
      onProgressCallback,
    );

    // Advance the gen
    [, gen] = gen.next();
    state.prngState = serializeState(gen);

    // Update team records from result
    for (const ts of result.teamSeasons) {
      const team = _teamMap.get(ts.teamId);
      if (team) {
        team.seasonRecord = ts.record;
      }
    }

    // Store player season stats for queries
    for (const ps of result.playerSeasons) {
      _playerSeasonStats.set(ps.playerId, ps);
    }

    // Advance service time (172 game-days)
    for (let d = 0; d < 172; d++) {
      advanceServiceTime(state.players, d);
    }

    _seasonResults.push(result);
    state.season++;

    return result;
  },

  // ── Standings ──────────────────────────────────────────────────────────────
  async getStandings(): Promise<StandingsData> {
    const state = requireState();
    const rows: StandingsRow[] = state.teams.map(team => {
      const { wins, losses, runsScored, runsAllowed } = team.seasonRecord;
      const total = wins + losses;
      const pct = total > 0 ? wins / total : 0;
      const pythagWins = Math.round(pythagenpatWinPct(runsScored, runsAllowed) * (total || 162));

      return {
        teamId: team.teamId,
        name: team.name,
        abbreviation: team.abbreviation,
        league: team.league,
        division: team.division,
        wins,
        losses,
        pct: Number(pct.toFixed(3)),
        gb: 0, // computed client-side per division
        runsScored,
        runsAllowed,
        pythagWins,
      };
    });

    return { season: state.season, standings: rows };
  },

  // ── Roster ─────────────────────────────────────────────────────────────────
  async getRoster(teamId: number): Promise<RosterData> {
    const state = requireState();
    const teamPlayers = state.players.filter(p => p.teamId === teamId);

    const toRP = (p: Player) => playerToRosterPlayer(p, _playerSeasonStats.get(p.playerId));

    return {
      teamId,
      season: state.season,
      active:  teamPlayers.filter(p => p.rosterData.rosterStatus === 'MLB_ACTIVE').map(toRP),
      il:      teamPlayers.filter(p => p.rosterData.rosterStatus === 'MLB_IL_10' || p.rosterData.rosterStatus === 'MLB_IL_60').map(toRP),
      minors:  teamPlayers.filter(p => ['MINORS_AAA', 'MINORS_AA', 'MINORS_ROOKIE'].includes(p.rosterData.rosterStatus) && p.rosterData.isOn40Man).map(toRP),
      dfa:     teamPlayers.filter(p => p.rosterData.rosterStatus === 'DFA').map(toRP),
    };
  },

  // ── Leaderboard ────────────────────────────────────────────────────────────
  async getLeaderboard(stat: string, limit = 50): Promise<LeaderboardEntry[]> {
    const state = requireState();
    const results: Array<{ player: Player; value: number }> = [];

    for (const [playerId, s] of _playerSeasonStats) {
      const player = _playerMap.get(playerId);
      if (!player) continue;

      let value = 0;
      switch (stat) {
        case 'hr':   value = s.hr; break;
        case 'rbi':  value = s.rbi; break;
        case 'avg':  value = s.ab > 100 ? s.h / s.ab : 0; break;
        case 'obp':  value = s.pa > 100 ? (s.h + s.bb + s.hbp) / s.pa : 0; break;
        case 'sb':   value = s.sb; break;
        case 'era':  value = s.outs > 10 ? -((s.er / s.outs) * 27) : -99; break; // negative for sorting
        case 'k':    value = s.ka; break;
        case 'wins': value = s.w; break;
        case 'whip': value = s.outs > 10 ? -((s.bba + s.ha) / (s.outs / 3)) : -99; break;
        default:     value = 0;
      }
      if (value !== 0 || stat === 'avg') results.push({ player, value });
    }

    results.sort((a, b) => b.value - a.value);
    const top = results.slice(0, limit);

    return top.map((r, i) => {
      const team = _teamMap.get(r.player.teamId);
      let displayValue = r.value.toFixed(stat === 'avg' || stat === 'obp' ? 3 : 0);
      if (stat === 'era' || stat === 'whip') displayValue = (-r.value).toFixed(2);
      return {
        rank: i + 1,
        playerId: r.player.playerId,
        name: r.player.name,
        teamAbbr: team?.abbreviation ?? '---',
        position: r.player.position,
        age: r.player.age,
        value: r.value,
        displayValue,
      };
    });
  },

  // ── Player profile ─────────────────────────────────────────────────────────
  async getPlayerProfile(playerId: number): Promise<PlayerProfileData> {
    const state = requireState();
    const player = _playerMap.get(playerId);
    if (!player) throw new Error(`Player ${playerId} not found`);

    const s = _playerSeasonStats.get(playerId);
    const grades: Record<string, number> = {};

    if (player.hitterAttributes) {
      const h = player.hitterAttributes;
      grades['CON'] = toScoutingScale(h.contact);
      grades['PWR'] = toScoutingScale(h.power);
      grades['EYE'] = toScoutingScale(h.eye);
      grades['SPD'] = toScoutingScale(h.speed);
      grades['FLD'] = toScoutingScale(h.fielding);
      grades['ARM'] = toScoutingScale(h.armStrength);
    } else if (player.pitcherAttributes) {
      const p = player.pitcherAttributes;
      grades['STF'] = toScoutingScale(p.stuff);
      grades['MOV'] = toScoutingScale(p.movement);
      grades['CMD'] = toScoutingScale(p.command);
      grades['STM'] = toScoutingScale(p.stamina);
    }

    const seasonStats: Record<string, number> = s ? {
      season: state.season - 1,
      pa: s.pa, ab: s.ab, h: s.h, hr: s.hr, rbi: s.rbi, bb: s.bb, k: s.k, sb: s.sb,
      avg: s.ab > 0 ? Number((s.h / s.ab).toFixed(3)) : 0,
      obp: s.pa > 0 ? Number(((s.h + s.bb + s.hbp) / s.pa).toFixed(3)) : 0,
      w: s.w, l: s.l, sv: s.sv, era: s.outs > 0 ? Number(((s.er / s.outs) * 27).toFixed(2)) : 0,
      ip: Number((s.outs / 3).toFixed(1)), ka: s.ka, bba: s.bba,
    } : {};

    return {
      player: {
        playerId: player.playerId,
        name: player.name,
        age: player.age,
        position: player.position,
        bats: player.bats,
        throws: player.throws,
        overall: player.overall,
        potential: player.potential,
        grades,
        rosterStatus: player.rosterData.rosterStatus,
        serviceTimeDays: player.rosterData.serviceTimeDays,
        salary: player.rosterData.salary,
        contractYearsRemaining: player.rosterData.contractYearsRemaining,
      },
      seasonStats: s ? { ...seasonStats } : null,
      careerStats: { seasons: 1, ...seasonStats },
    };
  },

  // ── Save / Load ────────────────────────────────────────────────────────────
  async getFullState(): Promise<LeagueState | null> {
    return _state;
  },

  async loadState(state: LeagueState): Promise<void> {
    _state = state;
    _playerSeasonStats = new Map();
    rebuildMaps();
  },

  // ── Utility ────────────────────────────────────────────────────────────────
  async ping(): Promise<string> {
    return 'pong';
  },
};

export type WorkerAPI = typeof api;
Comlink.expose(api);

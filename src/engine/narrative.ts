/**
 * narrative.ts — Narrative engine for Mr. Baseball Dynasty
 *
 * Powers four systems inspired by Mr. Football Dynasty:
 *   1. Owner Patience — archetype-based mandate tracking
 *   2. Team Morale    — chemistry & clubhouse pulse
 *   3. News Feed      — generated story items from season data
 *   4. Breakout Watch — prospect spotlight + resolution
 */

import type { SeasonResult } from '../types/league';
import type { TeamSeasonStats } from '../types/team';

// ─── Types ────────────────────────────────────────────────────────────────────

export type OwnerArchetype = 'win_now' | 'patient_builder' | 'penny_pincher';
export type OwnerStatus    = 'ECSTATIC' | 'PLEASED' | 'CONTENT' | 'CONCERNED' | 'HOT_SEAT' | 'CRISIS';

export interface OwnerStatusInfo {
  label:    string;
  emoji:    string;
  color:    string;
  barColor: string;
  desc:     string;
}

export interface NewsItem {
  id:          string;
  headline:    string;
  body:        string;
  type:        'award' | 'division' | 'development' | 'retirement' | 'league' | 'rumor' | 'milestone';
  icon:        string;
  priority:    number;  // 1–5, higher = more prominent
  season:      number;
  isUserTeam?: boolean;
}

export interface BreakoutCandidate {
  playerId:   number;
  name:       string;
  position:   string;
  age:        number;
  ovr:        number;
  potential:  number;
  level:      string;  // 'AAA' | 'AA' | 'A+' | 'MLB'
  targetOvr:  number;
  statusLine: string;
  hit:        boolean | null;  // null = in progress, true = hit, false = busted
}

// ─── Owner Archetypes per team ────────────────────────────────────────────────
// Designed to reflect typical big-market / mid-market / small-market ownership personalities

const TEAM_ARCHETYPES: Record<number, OwnerArchetype> = {
  1:  'win_now',        // New Harbor Admirals      — big market
  2:  'win_now',        // Capitol City Colonials   — win-now
  3:  'patient_builder',// Boston Bay Lobsters      — methodical
  4:  'win_now',        // Steel City Steamers      — aggressive
  5:  'penny_pincher',  // Lake City Hammers        — budget market
  6:  'patient_builder',// River City Wolves        — rebuild style
  7:  'win_now',        // South City Crushers      — win-now
  8:  'penny_pincher',  // Prairie City Foxes       — Moneyball market
  9:  'penny_pincher',  // Twin Peaks Miners        — small market
  10: 'win_now',        // Crown City Monarchs      — aggressive
  11: 'win_now',        // Bay City Gulls           — big market
  12: 'penny_pincher',  // Desert City Rattlers     — budget market
  13: 'patient_builder',// Sun Valley Cougars       — rebuild
  14: 'penny_pincher',  // Northwest City Lumberjacks — small market
  15: 'win_now',        // Anaheim Hills Angels     — big budget
  16: 'win_now',        // New Harbor Metros        — NL flagship
  17: 'patient_builder',// Peach City Brawlers      — deep farm
  18: 'patient_builder',// Palmetto City Tides      — patient
  19: 'win_now',        // Brick City Patriots      — win-now
  20: 'penny_pincher',  // Swamp City Hurricanes    — budget
  21: 'patient_builder',// Lake City Cubs           — historic rebuild
  22: 'win_now',        // Gateway City Redbirds    — contender
  23: 'penny_pincher',  // Blue Grass City Reds     — small market
  24: 'win_now',        // Bayou City Astros        — analytics + win
  25: 'penny_pincher',  // Lake Front Brewers       — classic small market
  26: 'win_now',        // Harbor Bay Dodgers       — superteam budget
  27: 'patient_builder',// Bay City Giants          — steady builder
  28: 'win_now',        // Harbor Lights Padres     — spend now
  29: 'penny_pincher',  // Mile High City Rockies   — budget market
  30: 'patient_builder',// Sandstone Park Diamondbacks — farm-first
};

export function getOwnerArchetype(teamId: number): OwnerArchetype {
  return TEAM_ARCHETYPES[teamId] ?? 'patient_builder';
}

// ─── Archetype display info ───────────────────────────────────────────────────

interface ArchetypeInfo { label: string; emoji: string; color: string; mandate: string }

const ARCHETYPE_INFO: Record<OwnerArchetype, ArchetypeInfo> = {
  win_now: {
    label:   'Win-Now Owner',
    emoji:   '🏆',
    color:   '#f97316',
    mandate: 'Playoff appearances expected every year. World Series or bust.',
  },
  patient_builder: {
    label:   'Patient Builder',
    emoji:   '🌱',
    color:   '#4ade80',
    mandate: 'Build through the farm. Sustained winning over time.',
  },
  penny_pincher: {
    label:   'Cost-Conscious Owner',
    emoji:   '💰',
    color:   '#fbbf24',
    mandate: 'Payroll discipline. Efficiency wins championships.',
  },
};

export function getArchetypeInfo(archetype: OwnerArchetype): ArchetypeInfo {
  return ARCHETYPE_INFO[archetype];
}

// ─── Owner patience status tiers ─────────────────────────────────────────────

export function getOwnerStatus(patience: number): OwnerStatusInfo {
  if (patience >= 90) return {
    label: 'ECSTATIC',   emoji: '🤩', color: '#4ade80', barColor: '#22c55e',
    desc: 'Owner is thrilled. Full resources and a long-term extension are on the table.',
  };
  if (patience >= 75) return {
    label: 'PLEASED',    emoji: '😊', color: '#86efac', barColor: '#4ade80',
    desc: 'Owner is happy with the direction. Keep winning.',
  };
  if (patience >= 55) return {
    label: 'CONTENT',    emoji: '😐', color: '#fbbf24', barColor: '#fbbf24',
    desc: 'Owner is watching closely. Postseason expectations are building.',
  };
  if (patience >= 35) return {
    label: 'CONCERNED',  emoji: '😟', color: '#fb923c', barColor: '#f97316',
    desc: 'Owner is nervous. Changes may be demanded this offseason.',
  };
  if (patience >= 15) return {
    label: 'HOT SEAT',   emoji: '🔥', color: '#ef4444', barColor: '#dc2626',
    desc: 'Your job is in danger. Make the playoffs or face the consequences.',
  };
  return {
    label: 'CRISIS',     emoji: '💀', color: '#dc2626', barColor: '#991b1b',
    desc: 'Ownership is furious. An immediate turnaround is required to keep your job.',
  };
}

// ─── Owner patience delta ─────────────────────────────────────────────────────

export function calcOwnerPatienceDelta(
  archetype:            OwnerArchetype,
  userTeamSeason:       TeamSeasonStats,
  isPlayoff:            boolean,
  isChampion:           boolean,
  difficulty:           'rookie' | 'normal' | 'hard',
  breakoutsOnUserTeam:  number,
): number {
  const wins = userTeamSeason.record.wins;
  const diffMult = difficulty === 'rookie' ? 0.5 : difficulty === 'hard' ? 1.4 : 1.0;
  let delta = 0;

  // Championship / playoff outcome
  if (isChampion) {
    delta += archetype === 'win_now' ? 25 : archetype === 'patient_builder' ? 20 : 18;
  } else if (isPlayoff) {
    delta += archetype === 'win_now' ? 7 : archetype === 'patient_builder' ? 5 : 3;
  } else {
    // Missed playoffs — harshest for win_now owners
    delta += archetype === 'win_now' ? -8 : archetype === 'patient_builder' ? -3 : -4;
  }

  // Season record bonus/penalty
  if      (wins >= 95)                    delta += 4;
  else if (wins >= 81)                    delta += archetype === 'win_now' ? 0 : 2;
  else if (wins >= 70 && wins < 81)       delta += archetype === 'win_now' ? -4 : -1;
  else                                    delta += archetype === 'win_now' ? -6 : archetype === 'patient_builder' ? -2 : -3;

  // Patient builders get rewarded for developing prospects
  if (breakoutsOnUserTeam > 0 && archetype === 'patient_builder') {
    delta += breakoutsOnUserTeam * 2;
  }

  return Math.max(-20, Math.min(25, Math.round(delta * diffMult)));
}

// ─── Team morale ──────────────────────────────────────────────────────────────

export interface MoraleStatusInfo { label: string; emoji: string; color: string }

export function getMoraleStatus(morale: number): MoraleStatusInfo {
  if (morale >= 85) return { label: 'ELECTRIC',    emoji: '⚡', color: '#4ade80' };
  if (morale >= 70) return { label: 'FIRED UP',    emoji: '🔥', color: '#86efac' };
  if (morale >= 55) return { label: 'STEADY',      emoji: '😤', color: '#fbbf24' };
  if (morale >= 40) return { label: 'UNCERTAIN',   emoji: '😕', color: '#fb923c' };
  if (morale >= 25) return { label: 'DEMORALIZED', emoji: '😞', color: '#ef4444' };
  return                   { label: 'TOXIC',        emoji: '💀', color: '#dc2626' };
}

export function calcMoraleDelta(
  wins:        number,
  isPlayoff:   boolean,
  isChampion:  boolean,
  breakouts:   number,
  retirements: number,
  busts:       number,
): number {
  let delta = 0;
  if (isChampion)    delta += 15;
  else if (isPlayoff) delta += 8;
  else if (wins >= 90) delta += 4;
  else if (wins >= 81) delta += 2;
  else if (wins < 70)  delta -= 7;
  else                 delta -= 3;

  delta += breakouts   * 2;
  delta -= busts       * 1;
  delta -= retirements * 1;

  return Math.max(-15, Math.min(15, Math.round(delta)));
}

// ─── Deterministic helpers ────────────────────────────────────────────────────

let _newsCounter = 0;

/** Deterministic news item ID — only used as React keys */
function nid(): string {
  return 'n' + (++_newsCounter);
}

/** Simple deterministic hash for seeded sorting */
function hashStr(str: string, seed: number): number {
  let h = seed | 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995);
    h ^= h >>> 15;
  }
  return h >>> 0;
}

const OFFSEASON_RUMORS = [
  { headline: 'Trade Deadline Fallout Reshaping Front Offices',
    body: 'Multiple GMs report ongoing conversations as franchises reassess their windows entering the new season.',
    icon: '🔄' },
  { headline: 'International Market Sees Historic Signing Class',
    body: 'Scouts report a particularly strong crop of Latin American prospects, with several 16-year-old outfielders drawing elite comparisons.',
    icon: '🌎' },
  { headline: 'Free Agent Pitching Market Expected to Be Historically Deep',
    body: 'Analytics departments across the league project an unusually strong pitching class entering the market this winter.',
    icon: '💰' },
  { headline: 'Multiple Clubs Enter Full Rebuild Mode',
    body: 'League sources indicate several franchises shifting focus entirely to prospects and draft capital.',
    icon: '🏗️' },
  { headline: 'Amateur Draft Class Draws Rave Reviews',
    body: 'College scouts are buzzing about exceptional depth at shortstop, catcher, and left-handed pitching in the upcoming draft.',
    icon: '🎓' },
  { headline: 'Velocity Recovery Program Producing Results Leaguewide',
    body: 'Several clubs report pitchers posting career-best spin rates after adopting new biomechanical training protocols.',
    icon: '🔬' },
  { headline: 'Analytics Arms Race Intensifies This Offseason',
    body: 'Front offices across both leagues are poaching quant analysts at record rates, further blurring lines between traditional and modern scouting.',
    icon: '📊' },
  { headline: 'Winter Meetings Expected to Produce Blockbuster Activity',
    body: 'Sources at multiple teams confirm serious contract negotiations in play heading into the offseason meetings.',
    icon: '🤝' },
];

export function generateSeasonNews(result: SeasonResult, userTeamId: number): NewsItem[] {
  const items: NewsItem[] = [];
  const s = result.season;

  // ── Awards ────────────────────────────────────────────────────────────────
  if (result.awards) {
    const { mvpAL, mvpNL, cyYoungAL, cyYoungNL, royAL, royNL } = result.awards;
    if (mvpAL) items.push({ id: nid(), season: s, type: 'award', icon: '🏆', priority: 5,
      headline: `${mvpAL.name} Captures the AL MVP Award`,
      body: `${mvpAL.teamAbbr}'s ${mvpAL.name} wins AL Most Valuable Player honors in a dominant season. ${mvpAL.statLine}`,
    });
    if (mvpNL) items.push({ id: nid(), season: s, type: 'award', icon: '🏆', priority: 5,
      headline: `${mvpNL.name} Named NL Most Valuable Player`,
      body: `${mvpNL.teamAbbr}'s ${mvpNL.name} takes home the NL MVP in a unanimous decision. ${mvpNL.statLine}`,
    });
    if (cyYoungAL) items.push({ id: nid(), season: s, type: 'award', icon: '⚾', priority: 4,
      headline: `${cyYoungAL.name} Wins the AL Cy Young Award`,
      body: `${cyYoungAL.teamAbbr}'s ${cyYoungAL.name} cements himself as the AL's premier pitcher. ${cyYoungAL.statLine}`,
    });
    if (cyYoungNL) items.push({ id: nid(), season: s, type: 'award', icon: '⚾', priority: 4,
      headline: `${cyYoungNL.name} Takes Home NL Cy Young`,
      body: `A masterful season earns ${cyYoungNL.teamAbbr}'s ${cyYoungNL.name} the NL's highest pitching honor. ${cyYoungNL.statLine}`,
    });
    if (royAL) items.push({ id: nid(), season: s, type: 'award', icon: '⭐', priority: 4,
      headline: `Rookie Sensation ${royAL.name} Wins AL ROY`,
      body: `${royAL.teamAbbr}'s ${royAL.name} announces himself to the league in an electric debut season. ${royAL.statLine}`,
    });
    if (royNL) items.push({ id: nid(), season: s, type: 'award', icon: '⭐', priority: 4,
      headline: `${royNL.name} Named NL Rookie of the Year`,
      body: `${royNL.teamAbbr}'s ${royNL.name} earns NL Rookie of the Year honors after a breathtaking introduction. ${royNL.statLine}`,
    });
  }

  // ── Division Champions ────────────────────────────────────────────────────
  if (result.divisionChampions) {
    for (const champ of result.divisionChampions) {
      const userTs = result.teamSeasons.find(ts => ts.teamId === userTeamId);
      const isUser = userTs?.record.wins === champ.wins && userTs?.record.losses === champ.losses;
      items.push({
        id: nid(), season: s, type: 'division', icon: '🥇', priority: isUser ? 5 : 2,
        isUserTeam: isUser,
        headline: `${champ.name} Clinch the ${champ.league} ${champ.division} Crown`,
        body: `${champ.name} (${champ.wins}–${champ.losses}) secure the ${champ.league} ${champ.division} title and earn home-field advantage in the postseason.`,
      });
    }
  }

  // ── Development Events ────────────────────────────────────────────────────
  if (result.developmentEvents) {
    const breakouts  = result.developmentEvents.filter(e => e.type === 'breakout').slice(0, 5);
    const busts      = result.developmentEvents.filter(e => e.type === 'bust').slice(0, 2);
    const retirements = result.developmentEvents.filter(e => e.type === 'retirement').slice(0, 4);

    for (const b of breakouts) {
      items.push({ id: nid(), season: s, type: 'development', icon: '📈', priority: 3,
        headline: `${b.playerName} Breaks Out in a Big Way`,
        body: `${b.playerName} surges +${b.overallDelta} OVR this offseason — a name to circle in your depth charts heading into ${s + 1}.`,
      });
    }
    for (const b of busts) {
      items.push({ id: nid(), season: s, type: 'development', icon: '📉', priority: 2,
        headline: `Concerning Reports Surface on ${b.playerName}`,
        body: `${b.playerName} regressed ${b.overallDelta} OVR this winter. Camp sources indicate he may need to re-prove himself on a smaller stage.`,
      });
    }
    for (const r of retirements) {
      items.push({ id: nid(), season: s, type: 'retirement', icon: '👋', priority: 3,
        headline: `${r.playerName} Officially Hangs Up the Cleats`,
        body: `After a storied career, ${r.playerName} announces his retirement. A true professional who gave everything to the game.`,
      });
    }
  }

  // ── League Environment ────────────────────────────────────────────────────
  if (result.leagueERA <= 3.85) {
    items.push({ id: nid(), season: s, type: 'league', icon: '⚾', priority: 2,
      headline: `${s} Goes Down as a Golden Era of Pitching`,
      body: `League-wide ERA finished at ${result.leagueERA.toFixed(2)} — among the lowest in recent memory. Arms dominated every lineup this year.`,
    });
  } else if (result.leagueERA >= 4.35) {
    items.push({ id: nid(), season: s, type: 'league', icon: '🏏', priority: 2,
      headline: `Offense Explodes Across Both Leagues in ${s}`,
      body: `League ERA ballooned to ${result.leagueERA.toFixed(2)}, the highest in years. Hitters feasted and run totals shattered expectations.`,
    });
  }

  if (result.teamWinsSD <= 8.5) {
    items.push({ id: nid(), season: s, type: 'league', icon: '⚖️', priority: 1,
      headline: `Historic Parity Defines the ${s} Season`,
      body: `Win totals compressed across the league — the most balanced campaign in recent memory, with nearly every club fighting deep into September.`,
    });
  } else if (result.teamWinsSD >= 11.5) {
    items.push({ id: nid(), season: s, type: 'league', icon: '📊', priority: 1,
      headline: `Clear Haves and Have-Nots in ${s}`,
      body: `A handful of dominant clubs separated themselves early. The talent gap between the best and worst teams was among the widest in years.`,
    });
  }

  // ── Offseason Rumors (always 2–3) ─────────────────────────────────────────
  const shuffled = [...OFFSEASON_RUMORS].sort((a, b) => hashStr(a.headline, s) - hashStr(b.headline, s));
  for (const r of shuffled.slice(0, 3)) {
    items.push({ id: nid(), season: s, type: 'rumor', icon: r.icon, priority: 1,
      headline: r.headline, body: r.body,
    });
  }

  return items.sort((a, b) => b.priority - a.priority);
}

// ─── Breakout Watch generation ────────────────────────────────────────────────
// Called client-side using the roster data after game starts.
// Returns up to 3 candidates from the user's minor/young MLB players.

import type { RosterPlayer } from '../types/league';

export function generateBreakoutWatch(rosterPlayers: RosterPlayer[]): BreakoutCandidate[] {
  // Eligible: age 18-26, OVR 45-74, potential > OVR + 5, in minors or MLB service < 1yr
  const eligible = rosterPlayers.filter(p =>
    p.age >= 18 && p.age <= 26 &&
    p.overall >= 45 && p.overall <= 74 &&
    p.potential > p.overall + 5 &&
    (p.rosterStatus.startsWith('MINORS') || p.serviceTimeDays < 172)
  );

  if (eligible.length === 0) return [];

  // Score by: (potential - ovr) * 2 + (27 - age) — high upside young players first
  const scored = eligible
    .map(p => ({ p, score: (p.potential - p.overall) * 2 + (27 - p.age) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored.map(({ p }) => {
    const targetOvr = Math.min(p.potential, p.overall + Math.floor((p.potential - p.overall) * 0.4 + 5));
    const levelMap: Record<string, string> = {
      MINORS_AAA:   'AAA', MINORS_AA: 'AA', MINORS_APLUS: 'A+',
      MINORS_AMINUS:'A-',  MINORS_ROOKIE: 'Rk', MINORS_INTL: 'INTL',
      ACTIVE: 'MLB', IL: 'IL',
    };
    const level = levelMap[p.rosterStatus] ?? p.rosterStatus;
    return {
      playerId:   p.playerId,
      name:       p.name,
      position:   p.position,
      age:        p.age,
      ovr:        p.overall,
      potential:  p.potential,
      level,
      targetOvr,
      statusLine: `${p.position} · Age ${p.age} · ${level} · OVR ${p.overall} → TGT ${targetOvr}`,
      hit:        null,
    };
  });
}

// After a season, resolve the watch — did they hit target OVR?
export function resolveBreakoutWatch(
  candidates: BreakoutCandidate[],
  updatedRosterPlayers: RosterPlayer[],
): BreakoutCandidate[] {
  return candidates.map(c => {
    const updated = updatedRosterPlayers.find(p => p.playerId === c.playerId);
    if (!updated) return { ...c, hit: false };
    const hit = updated.overall >= c.targetOvr;
    return { ...c, ovr: updated.overall, hit };
  });
}

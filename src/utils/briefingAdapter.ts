/**
 * briefingAdapter.ts — Pure functions that derive briefing data from existing store state.
 * No store mutations. No side effects. Prop-driven data for the briefing stack.
 */

import type { BriefingDial, StoryThread, ActionQueueTask, DigestBlock, CoachStep } from '../types/briefing';
import type { RosterData, StandingsRow } from '../types/league';
import type { GamePhase, SeasonPhase } from '../store/gameStore';
import type { OwnerArchetype } from '../engine/narrative';
import type { SeasonSummary } from '../store/leagueStore';
import { getOwnerStatus } from '../engine/narrative';
import { getMoraleStatus } from '../engine/narrative';
import { getArchetypeInfo } from '../engine/narrative';

// ─── Dials ───────────────────────────────────────────────────────────────────

export function buildDials(opts: {
  ownerPatience: number;
  teamMorale: number;
  scoutingQuality: number;
  roster: RosterData | null;
  standings: StandingsRow[] | null;
  userTeamId: number;
  gamePhase: GamePhase;
}): BriefingDial[] {
  const ownerStatus = getOwnerStatus(opts.ownerPatience);
  const moraleStatus = getMoraleStatus(opts.teamMorale);

  // Contention Confidence: composite of win%, games back, and win count.
  // Formula: 60% win-pct weight + 20 if any wins + 0/10/20 based on GB proximity.
  // Clamped to 0–100. Defaults to 50 before standings exist (preseason).
  const userRow = opts.standings?.find(s => s.teamId === opts.userTeamId);
  const contentionValue = userRow
    ? Math.min(100, Math.max(0, Math.round((userRow.pct * 100) * 0.6 + (userRow.wins > 0 ? 20 : 0) + (userRow.gb <= 5 ? 20 : userRow.gb <= 10 ? 10 : 0))))
    : 50;
  const contentionLabel = contentionValue >= 75 ? 'STRONG' : contentionValue >= 50 ? 'IN THE MIX' : contentionValue >= 30 ? 'FRINGE' : 'REBUILDING';
  const contentionColor = contentionValue >= 75 ? '#4ade80' : contentionValue >= 50 ? '#fbbf24' : contentionValue >= 30 ? '#fb923c' : '#6b7280';

  // Market Heat: phase-based proxy until real trade activity data is exposed.
  // TODO(codex): Replace with actual trade offer count when available.
  const marketValue = opts.gamePhase === 'offseason' ? 80
    : opts.gamePhase === 'in_season' ? 55
    : opts.gamePhase === 'preseason' ? 40 : 30;
  const marketLabel = marketValue >= 70 ? 'ACTIVE' : marketValue >= 45 ? 'WARMING' : 'QUIET';
  const marketColor = marketValue >= 70 ? '#f97316' : marketValue >= 45 ? '#fbbf24' : '#6b7280';

  // Scouting Certainty: maps scoutingQuality (0.0–1.0) to 0–100 dial.
  // TODO(codex): Currently hardcoded to 0.6 at call site. Wire real value.
  const scoutValue = Math.round(opts.scoutingQuality * 100);
  const scoutLabel = scoutValue >= 80 ? 'HIGH' : scoutValue >= 55 ? 'MODERATE' : 'LOW';
  const scoutColor = scoutValue >= 80 ? '#4ade80' : scoutValue >= 55 ? '#fbbf24' : '#ef4444';

  return [
    {
      id: 'contention',
      label: 'Contention Confidence',
      value: contentionValue,
      status: contentionLabel,
      color: contentionColor,
      desc: userRow
        ? `${userRow.wins}–${userRow.losses} (${userRow.gb === 0 ? 'Division lead' : userRow.gb + ' GB'})`
        : 'Season has not started yet',
    },
    {
      id: 'owner',
      label: 'Owner Patience',
      value: opts.ownerPatience,
      status: ownerStatus.label,
      color: ownerStatus.color,
      desc: ownerStatus.desc,
    },
    {
      id: 'market',
      label: 'Market Heat',
      value: marketValue,
      status: marketLabel,
      color: marketColor,
      desc: opts.gamePhase === 'offseason'
        ? 'Free agency and trades are active.'
        : opts.gamePhase === 'in_season'
        ? 'Trade talks are ongoing.'
        : 'The market is quiet.',
    },
    {
      id: 'scouting',
      label: 'Scouting Certainty',
      value: scoutValue,
      status: scoutLabel,
      color: scoutColor,
      desc: `Scouting accuracy: ${scoutValue}%. Higher means better prospect evaluations.`,
    },
    {
      id: 'clubhouse',
      label: 'Clubhouse Temperature',
      value: opts.teamMorale,
      status: moraleStatus.label,
      color: moraleStatus.color,
      desc: opts.teamMorale >= 70
        ? 'The clubhouse is energized and unified.'
        : opts.teamMorale >= 40
        ? 'The clubhouse is stable but watchful.'
        : 'Clubhouse tension is rising.',
    },
  ];
}

// ─── Story Threads ───────────────────────────────────────────────────────────

export function buildStoryThreads(opts: {
  ownerPatience: number;
  teamMorale: number;
  ownerArchetype: OwnerArchetype;
  roster: RosterData | null;
  standings: StandingsRow[] | null;
  userTeamId: number;
  gamePhase: GamePhase;
  seasonPhase: SeasonPhase;
  seasonsManaged: number;
  franchiseHistory: SeasonSummary[];
}): { urgent: StoryThread | null; mystery: StoryThread | null; longArc: StoryThread | null } {
  const arcInfo = getArchetypeInfo(opts.ownerArchetype);

  // ── Urgent Problem ──
  let urgent: StoryThread | null = null;
  if (opts.ownerPatience <= 25) {
    urgent = {
      type: 'urgent', icon: '🔥', color: '#ef4444',
      title: 'Owner Patience Critical',
      body: `Patience at ${opts.ownerPatience}%. ${arcInfo.mandate} You need results now or face termination.`,
      actionLabel: 'VIEW ROSTER', actionTab: 'roster',
    };
  } else if (opts.roster && opts.roster.active.length < 25) {
    const short = 25 - opts.roster.active.length;
    urgent = {
      type: 'urgent', icon: '⚠️', color: '#fbbf24',
      title: `Roster Short — ${short} Spot${short > 1 ? 's' : ''} Open`,
      body: `Your 26-man roster has only ${opts.roster.active.length} active players. Fill the gaps before the next sim.`,
      actionLabel: 'MANAGE ROSTER', actionTab: 'roster',
    };
  } else if (opts.roster && opts.roster.il.length > 0) {
    const ilCount = opts.roster.il.length;
    const readySoon = opts.roster.il.filter(p => p.injuryInfo && p.injuryInfo.daysRemaining <= 7);
    if (readySoon.length > 0) {
      urgent = {
        type: 'urgent', icon: '🏥', color: '#60a5fa',
        title: `${readySoon.length} Player${readySoon.length > 1 ? 's' : ''} Nearing Return`,
        body: `${readySoon.map(p => p.name).join(', ')} ${readySoon.length === 1 ? 'is' : 'are'} close to coming off the IL. Make room on the roster.`,
        actionLabel: 'ROSTER MOVES', actionTab: 'roster',
      };
    } else if (ilCount >= 3) {
      urgent = {
        type: 'urgent', icon: '🏥', color: '#fb923c',
        title: `${ilCount} Players on the IL`,
        body: 'Multiple injuries are straining your depth. Monitor recovery timelines and consider replacements.',
        actionLabel: 'VIEW IL', actionTab: 'roster',
      };
    }
  } else if (opts.teamMorale <= 30) {
    urgent = {
      type: 'urgent', icon: '💀', color: '#ef4444',
      title: 'Clubhouse Morale Collapsing',
      body: `Team morale at ${opts.teamMorale}%. Players are frustrated. Winning fixes everything — but so do roster moves.`,
      actionLabel: 'VIEW ROSTER', actionTab: 'roster',
    };
  }

  // ── Open Mystery ──
  let mystery: StoryThread | null = null;
  if (opts.roster) {
    const prospects = opts.roster.minors.filter(p => p.potential > p.overall + 20);
    if (prospects.length > 0) {
      const top = prospects.sort((a, b) => (b.potential - b.overall) - (a.potential - a.overall))[0];
      mystery = {
        type: 'mystery', icon: '🔮', color: '#a78bfa',
        title: `Will ${top.name} Break Out?`,
        body: `${top.name} (${top.position}, Age ${top.age}) has a ceiling far above his current level. OVR ${top.overall} → POT ${top.potential}. The development clock is ticking.`,
        actionLabel: 'SCOUTING', actionTab: 'roster',
      };
    }
  }
  if (!mystery && opts.standings) {
    const userRow = opts.standings.find(s => s.teamId === opts.userTeamId);
    if (userRow && userRow.gb <= 3 && userRow.gb > 0) {
      mystery = {
        type: 'mystery', icon: '🏁', color: '#60a5fa',
        title: 'Can You Catch the Division Leader?',
        body: `You're ${userRow.gb} games back. The margin is razor-thin. Every series matters.`,
        actionLabel: 'STANDINGS', actionTab: 'standings',
      };
    }
  }
  if (!mystery) {
    mystery = {
      type: 'mystery', icon: '📊', color: '#9ca3af',
      title: opts.seasonsManaged <= 1 ? 'What Kind of GM Will You Be?' : 'Next Season\'s Identity',
      body: opts.seasonsManaged <= 1
        ? 'Your first moves will define the franchise philosophy. Contend now or build for the future?'
        : 'Every offseason reshapes the roster. What story will next season tell?',
      actionLabel: 'VIEW FINANCES', actionTab: 'finance',
    };
  }

  // ── Long-Term Arc ──
  let longArc: StoryThread | null = null;
  if (opts.franchiseHistory.length > 0) {
    const last = opts.franchiseHistory[0];
    if (last.playoffResult === 'Champion') {
      longArc = {
        type: 'long_arc', icon: '🏆', color: '#fbbf24',
        title: 'Defending the Title',
        body: 'Last season you won it all. The target is on your back now. Can the dynasty sustain itself?',
        actionLabel: 'HISTORY', actionTab: 'history',
      };
    } else if (opts.franchiseHistory.length >= 3 && opts.franchiseHistory.slice(0, 3).every(h => h.wins >= 85)) {
      longArc = {
        type: 'long_arc', icon: '🔺', color: '#f97316',
        title: 'Dynasty Rising',
        body: `Three straight 85+ win seasons. The window is wide open. This is your moment to push for hardware.`,
        actionLabel: 'HISTORY', actionTab: 'history',
      };
    } else if (opts.franchiseHistory.filter(h => h.wins < 70).length >= 2) {
      longArc = {
        type: 'long_arc', icon: '🏗️', color: '#6b7280',
        title: 'The Long Rebuild',
        body: 'Multiple losing seasons in recent memory. The prospect pipeline must deliver. Stay the course or pivot?',
        actionLabel: 'HISTORY', actionTab: 'history',
      };
    }
  }
  if (!longArc) {
    longArc = {
      type: 'long_arc', icon: '📈', color: '#4ade80',
      title: `Season ${opts.seasonsManaged + 1} — Write the Next Chapter`,
      body: `Every decision you make shapes the franchise legacy. What will this season be remembered for?`,
      actionLabel: 'HISTORY', actionTab: 'history',
    };
  }

  return { urgent, mystery, longArc };
}

// ─── Action Queue ────────────────────────────────────────────────────────────

// Counter resets each render cycle since buildActionQueue is called inside useMemo.
// IDs only need uniqueness within a single render pass.
let _actionId = 0;
function aid(): string { return `aq-${++_actionId}`; }

export function buildActionQueue(opts: {
  roster: RosterData | null;
  ownerPatience: number;
  gamePhase: GamePhase;
  seasonPhase: SeasonPhase;
  teamMorale: number;
}): ActionQueueTask[] {
  const tasks: ActionQueueTask[] = [];

  // Roster illegality
  if (opts.roster) {
    if (opts.roster.active.length > 26) {
      tasks.push({
        id: aid(), category: 'roster_illegality', priority: 'critical',
        title: 'ROSTER OVER LIMIT',
        subtitle: `${opts.roster.active.length}/26 active — must DFA or option players`,
        icon: '🚨', actionLabel: 'FIX ROSTER', actionTab: 'roster',
      });
    }
    if (opts.roster.active.length < 25) {
      tasks.push({
        id: aid(), category: 'roster_illegality', priority: 'high',
        title: 'ROSTER BELOW MINIMUM',
        subtitle: `${opts.roster.active.length}/26 active — call up or sign players`,
        icon: '⚠️', actionLabel: 'FILL ROSTER', actionTab: 'roster',
      });
    }

    // IL / Rehab decisions
    const returning = opts.roster.il.filter(p => p.injuryInfo && p.injuryInfo.daysRemaining <= 3);
    for (const p of returning) {
      tasks.push({
        id: aid(), category: 'il_rehab', priority: 'high',
        title: `${p.name} Ready to Return`,
        subtitle: `${p.position} — ${p.injuryInfo?.type ?? 'Injury'} recovery complete`,
        icon: '🏥', actionLabel: 'ACTIVATE', actionTab: 'roster',
      });
    }

    // Prospect pressure
    const hotProspects = opts.roster.minors
      .filter(p => p.overall >= 55 && p.age <= 24)
      .sort((a, b) => b.overall - a.overall)
      .slice(0, 2);
    for (const p of hotProspects) {
      tasks.push({
        id: aid(), category: 'prospect_pressure', priority: 'medium',
        title: `${p.name} Pushing for Call-Up`,
        subtitle: `OVR ${p.overall} ${p.position}, Age ${p.age} — ready for the show?`,
        icon: '🌟', actionLabel: 'EVALUATE', actionTab: 'roster',
      });
    }

    // DFA players lingering
    if (opts.roster.dfa.length > 0) {
      tasks.push({
        id: aid(), category: 'roster_illegality', priority: 'medium',
        title: `${opts.roster.dfa.length} Player${opts.roster.dfa.length > 1 ? 's' : ''} on DFA`,
        subtitle: 'Resolve DFA assignments before next sim',
        icon: '📋', actionLabel: 'RESOLVE', actionTab: 'roster',
      });
    }
  }

  // Owner warning
  if (opts.ownerPatience <= 30) {
    tasks.push({
      id: aid(), category: 'owner_warning', priority: opts.ownerPatience <= 15 ? 'critical' : 'high',
      title: 'OWNER PATIENCE WARNING',
      subtitle: `Patience at ${opts.ownerPatience}% — results needed immediately`,
      icon: '🔥', actionLabel: 'REVIEW', actionTab: 'roster',
    });
  }

  // Clubhouse issues
  if (opts.teamMorale <= 35) {
    tasks.push({
      id: aid(), category: 'general', priority: 'medium',
      title: 'LOW CLUBHOUSE MORALE',
      subtitle: `Morale at ${opts.teamMorale}% — winning or roster moves can help`,
      icon: '😞', actionLabel: 'ROSTER', actionTab: 'roster',
    });
  }

  // Phase-specific
  if (opts.gamePhase === 'offseason') {
    tasks.push({
      id: aid(), category: 'contract_arb', priority: 'medium',
      title: 'OFFSEASON MOVES AVAILABLE',
      subtitle: 'Free agency, arbitration, and trades are open',
      icon: '📝', actionLabel: 'GO', actionTab: 'roster',
    });
  }

  // Sort by priority
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  tasks.sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3));

  return tasks;
}

// ─── Digest ──────────────────────────────────────────────────────────────────

export function buildDigest(opts: {
  standings: StandingsRow[] | null;
  userTeamId: number;
  roster: RosterData | null;
  ownerPatience: number;
  teamMorale: number;
  gamePhase: GamePhase;
  newsItems: Array<{ headline: string; icon: string; type: string }>;
}): DigestBlock[] {
  const blocks: DigestBlock[] = [];

  // Results
  if (opts.standings) {
    const userRow = opts.standings.find(s => s.teamId === opts.userTeamId);
    if (userRow) {
      const sorted = [...opts.standings].sort((a, b) => b.wins - a.wins);
      const rank = sorted.findIndex(s => s.teamId === opts.userTeamId) + 1;
      blocks.push({
        section: 'STANDINGS',
        entries: [
          { icon: '📊', label: 'Record', detail: `${userRow.wins}–${userRow.losses} (.${(userRow.pct * 1000).toFixed(0).padStart(3, '0')})` },
          { icon: '🏁', label: 'Division', detail: userRow.gb === 0 ? 'Leading division' : `${userRow.gb} GB`, color: userRow.gb === 0 ? '#4ade80' : undefined },
          { icon: '⚡', label: 'League Rank', detail: `#${rank} of ${sorted.length}` },
          { icon: '📈', label: 'Run Differential', detail: `${userRow.runsScored - userRow.runsAllowed >= 0 ? '+' : ''}${userRow.runsScored - userRow.runsAllowed}`, color: userRow.runsScored >= userRow.runsAllowed ? '#4ade80' : '#ef4444' },
        ],
      });
    }
  }

  // Injuries
  if (opts.roster && opts.roster.il.length > 0) {
    blocks.push({
      section: 'INJURY REPORT',
      entries: opts.roster.il.slice(0, 5).map(p => ({
        icon: '🏥',
        label: `${p.name} (${p.position})`,
        detail: p.injuryInfo ? `${p.injuryInfo.type} — ${p.injuryInfo.daysRemaining}d remaining` : 'On IL',
        color: p.injuryInfo && p.injuryInfo.daysRemaining <= 7 ? '#4ade80' : '#fb923c',
      })),
    });
  }

  // Front Office Pulse
  blocks.push({
    section: 'FRONT OFFICE PULSE',
    entries: [
      {
        icon: '👔',
        label: 'Owner Patience',
        detail: `${opts.ownerPatience}%`,
        color: opts.ownerPatience >= 55 ? '#4ade80' : opts.ownerPatience >= 30 ? '#fbbf24' : '#ef4444',
      },
      {
        icon: '🏟️',
        label: 'Clubhouse Morale',
        detail: `${opts.teamMorale}%`,
        color: opts.teamMorale >= 55 ? '#4ade80' : opts.teamMorale >= 30 ? '#fbbf24' : '#ef4444',
      },
    ],
  });

  // News highlights
  if (opts.newsItems.length > 0) {
    blocks.push({
      section: 'HEADLINES',
      entries: opts.newsItems.slice(0, 4).map(n => ({
        icon: n.icon,
        label: n.headline,
        detail: n.type.toUpperCase(),
      })),
    });
  }

  return blocks;
}

// ─── First-Week Coach Steps ──────────────────────────────────────────────────

export function buildCoachSteps(opts: {
  gamePhase: GamePhase;
  seasonsManaged: number;
  roster: RosterData | null;
  standings: StandingsRow[] | null;
}): CoachStep[] {
  if (opts.seasonsManaged > 0) return [];

  const hasCheckedRoster = opts.roster !== null;
  const hasCheckedStandings = opts.standings !== null;

  return [
    {
      id: 'review-roster',
      title: 'Review Your Roster',
      body: 'See who you have: starters, bench, bullpen, and minor-leaguers. Identify your strengths and weaknesses.',
      actionLabel: 'GO TO ROSTER',
      actionTab: 'roster',
      completed: hasCheckedRoster,
    },
    {
      id: 'check-standings',
      title: 'Check the Standings',
      body: 'See where you stand in the division and league. Know your competition.',
      actionLabel: 'VIEW STANDINGS',
      actionTab: 'standings',
      completed: hasCheckedStandings,
    },
    {
      id: 'review-finances',
      title: 'Understand Your Budget',
      body: 'Your payroll, luxury tax situation, and available cap space determine what moves you can make.',
      actionLabel: 'VIEW FINANCES',
      actionTab: 'finance',
      completed: false,
    },
    {
      id: 'first-sim',
      title: 'Simulate Your First Games',
      body: 'Start the season and watch the results roll in. After each chunk, you can make roster adjustments.',
      actionLabel: 'PLAY SEASON',
      actionTab: 'dashboard',
      completed: opts.gamePhase === 'in_season' || opts.gamePhase === 'postseason',
    },
    {
      id: 'make-a-move',
      title: 'Make Your First Move',
      body: 'Call up a prospect, sign a free agent, or propose a trade. Your decisions shape the franchise.',
      actionLabel: 'ROSTER MOVES',
      actionTab: 'roster',
      completed: false,
    },
  ];
}

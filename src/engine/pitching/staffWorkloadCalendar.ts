/**
 * staffWorkloadCalendar.ts – Pitching Staff Workload Calendar
 *
 * Weekly calendar grid model tracking pitcher usage across the
 * entire staff (starters + relievers). Monitors:
 *   - Daily usage: starts, relief appearances, rest days
 *   - Innings pitched per week, pitch counts, consecutive-day usage
 *   - Overuse alert flags (3+ consecutive appearances, 30+ IP/week)
 *   - Workload status color coding (green/yellow/red)
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type DayUsageType = 'start' | 'relief' | 'rest' | 'off';
export type WorkloadStatus = 'well-rested' | 'moderate' | 'overworked';

export interface DayEntry {
  date: string;            // e.g. "Mon 4/7"
  dayOfWeek: string;       // "Mon", "Tue", etc.
  usage: DayUsageType;
  innings: number;         // IP for that day (0 if rest/off)
  pitchCount: number;      // pitches thrown (0 if rest/off)
  earnedRuns: number;
  decision: string;        // "W", "L", "S", "H", "ND", ""
}

export interface WeeklyLog {
  weekLabel: string;       // e.g. "Week 2 (Apr 7-13)"
  days: DayEntry[];
  totalIP: number;
  totalPitches: number;
  appearances: number;
  starts: number;
  consecutiveDays: number; // max consecutive appearance streak in that week
  restDays: number;
}

export interface PitcherWorkloadProfile {
  id: string;
  name: string;
  team: string;
  role: 'SP' | 'CL' | 'SU' | 'MID' | 'LONG';
  overall: number;
  age: number;
  throws: 'L' | 'R';
  era: number;
  seasonIP: number;
  seasonPitches: number;
  weeklyLogs: WeeklyLog[];
  currentStatus: WorkloadStatus;
  alerts: WorkloadAlert[];
  avgPitchesPerStart: number;   // starters only (0 for relievers)
  avgPitchesPerRelief: number;  // relievers only (0 for starters)
  daysOnConsecutive: number;    // current consecutive-day streak
  seasonAppearances: number;
}

export interface WorkloadAlert {
  type: 'consecutive' | 'overuse-ip' | 'high-pitch' | 'no-rest';
  message: string;
  severity: 'warning' | 'danger';
}

export interface StaffWorkloadData {
  teamName: string;
  teamAbbr: string;
  currentWeek: number;
  weekDates: string;
  pitchers: PitcherWorkloadProfile[];
  staffSummary: StaffWorkloadSummary;
}

export interface StaffWorkloadSummary {
  totalStaffIP: number;
  starterIP: number;
  relieverIP: number;
  wellRestedCount: number;
  moderateCount: number;
  overworkedCount: number;
  activeAlerts: number;
  avgPitchesPerGame: number;
  mostUsedReliever: string;
  highestWorkload: string;
}

// ── Display constants ──────────────────────────────────────────────────────

export const USAGE_DISPLAY: Record<DayUsageType, { label: string; color: string; symbol: string }> = {
  start:  { label: 'Start',   color: '#3b82f6', symbol: 'S' },
  relief: { label: 'Relief',  color: '#f59e0b', symbol: 'R' },
  rest:   { label: 'Rest',    color: '#374151', symbol: '-' },
  off:    { label: 'Off Day', color: '#1f2937', symbol: '.' },
};

export const STATUS_DISPLAY: Record<WorkloadStatus, { label: string; color: string; emoji: string }> = {
  'well-rested': { label: 'Well Rested', color: '#22c55e', emoji: '==' },
  'moderate':    { label: 'Moderate',    color: '#f59e0b', emoji: '~~' },
  'overworked':  { label: 'Overworked',  color: '#ef4444', emoji: '!!' },
};

// ── Summary ────────────────────────────────────────────────────────────────

export function getStaffWorkloadSummary(pitchers: PitcherWorkloadProfile[]): StaffWorkloadSummary {
  const currentWeekLogs = pitchers.map(p => p.weeklyLogs[p.weeklyLogs.length - 1]);
  const totalIP = currentWeekLogs.reduce((s, w) => s + (w?.totalIP ?? 0), 0);
  const starters = pitchers.filter(p => p.role === 'SP');
  const relievers = pitchers.filter(p => p.role !== 'SP');
  const starterLogs = starters.map(p => p.weeklyLogs[p.weeklyLogs.length - 1]);
  const relieverLogs = relievers.map(p => p.weeklyLogs[p.weeklyLogs.length - 1]);

  const wellRested = pitchers.filter(p => p.currentStatus === 'well-rested').length;
  const moderate = pitchers.filter(p => p.currentStatus === 'moderate').length;
  const overworked = pitchers.filter(p => p.currentStatus === 'overworked').length;
  const alerts = pitchers.reduce((s, p) => s + p.alerts.length, 0);

  const relieverApps = relieverLogs.map((w, i) => ({ name: relievers[i].name, apps: w?.appearances ?? 0 }));
  relieverApps.sort((a, b) => b.apps - a.apps);

  const workloads = currentWeekLogs.map((w, i) => ({ name: pitchers[i].name, ip: w?.totalIP ?? 0 }));
  workloads.sort((a, b) => b.ip - a.ip);

  return {
    totalStaffIP: Math.round(totalIP * 10) / 10,
    starterIP: Math.round(starterLogs.reduce((s, w) => s + (w?.totalIP ?? 0), 0) * 10) / 10,
    relieverIP: Math.round(relieverLogs.reduce((s, w) => s + (w?.totalIP ?? 0), 0) * 10) / 10,
    wellRestedCount: wellRested,
    moderateCount: moderate,
    overworkedCount: overworked,
    activeAlerts: alerts,
    avgPitchesPerGame: Math.round(
      currentWeekLogs.reduce((s, w) => s + (w?.totalPitches ?? 0), 0) /
      Math.max(1, currentWeekLogs.filter(w => (w?.appearances ?? 0) > 0).length)
    ),
    mostUsedReliever: relieverApps[0]?.name ?? '',
    highestWorkload: workloads[0]?.name ?? '',
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DECISIONS_SP = ['W', 'L', 'ND', 'W', 'L', 'ND', 'W'];
const DECISIONS_RP = ['H', 'S', 'ND', 'H', 'W', 'ND', 'S'];

interface PitcherSeed {
  name: string;
  role: 'SP' | 'CL' | 'SU' | 'MID' | 'LONG';
  overall: number;
  age: number;
  throws: 'L' | 'R';
  era: number;
}

const PITCHER_SEEDS: PitcherSeed[] = [
  // Starters (5)
  { name: 'Zack Wheeler',      role: 'SP',   overall: 89, age: 34, throws: 'R', era: 2.85 },
  { name: 'Gerrit Cole',       role: 'SP',   overall: 88, age: 33, throws: 'R', era: 3.12 },
  { name: 'Logan Webb',        role: 'SP',   overall: 84, age: 27, throws: 'R', era: 3.45 },
  { name: 'Ranger Suarez',     role: 'SP',   overall: 82, age: 28, throws: 'L', era: 3.68 },
  { name: 'Cristopher Sanchez',role: 'SP',   overall: 78, age: 27, throws: 'L', era: 3.95 },
  // Closer
  { name: 'Carlos Estevez',    role: 'CL',   overall: 80, age: 31, throws: 'R', era: 3.10 },
  // Setup
  { name: 'Jeff Hoffman',      role: 'SU',   overall: 81, age: 31, throws: 'R', era: 2.75 },
  { name: 'Matt Strahm',       role: 'SU',   overall: 79, age: 32, throws: 'L', era: 3.20 },
  // Middle relief
  { name: 'Orion Kerkering',   role: 'MID',  overall: 76, age: 23, throws: 'R', era: 3.55 },
  { name: 'Jose Alvarado',     role: 'MID',  overall: 75, age: 29, throws: 'L', era: 4.10 },
  // Long relief
  { name: 'Kolby Allard',      role: 'LONG', overall: 68, age: 26, throws: 'L', era: 4.85 },
  { name: 'Max Lazar',         role: 'LONG', overall: 65, age: 24, throws: 'R', era: 5.20 },
];

function buildWeeklyLog(
  pitcher: PitcherSeed,
  weekIndex: number,
  weekLabel: string,
): WeeklyLog {
  const isStarter = pitcher.role === 'SP';
  const days: DayEntry[] = [];
  let appearances = 0;
  let starts = 0;
  let totalIP = 0;
  let totalPitches = 0;
  let maxConsec = 0;
  let curConsec = 0;
  let restDays = 0;

  // Deterministic pseudo-random based on name + week
  const seed = pitcher.name.length * 17 + weekIndex * 31;

  for (let d = 0; d < 7; d++) {
    const dateNum = 7 + weekIndex * 7 + d;
    const dateStr = `${DOW[d]} 4/${dateNum}`;
    let usage: DayUsageType = 'rest';
    let ip = 0;
    let pc = 0;
    let er = 0;
    let decision = '';

    if (isStarter) {
      // Starters pitch every 5th day; SP1=Mon, SP2=Tue, etc.
      const spSlot = PITCHER_SEEDS.filter(p => p.role === 'SP').indexOf(pitcher);
      const pitchDay = (spSlot + weekIndex) % 5;
      if (d === pitchDay || (d === (pitchDay + 5) % 7 && weekIndex > 0)) {
        usage = 'start';
        ip = 5.0 + ((seed + d * 3) % 7) * 0.33;
        ip = Math.round(ip * 10) / 10;
        pc = 75 + ((seed + d * 11) % 30);
        er = (seed + d * 7) % 4;
        decision = DECISIONS_SP[(seed + d) % DECISIONS_SP.length];
        appearances++;
        starts++;
        totalIP += ip;
        totalPitches += pc;
        curConsec++;
        if (curConsec > maxConsec) maxConsec = curConsec;
      } else {
        usage = 'rest';
        restDays++;
        curConsec = 0;
      }
    } else {
      // Relievers: usage pattern depends on role
      const reliefChance = pitcher.role === 'CL' ? 0.45 :
                           pitcher.role === 'SU' ? 0.50 :
                           pitcher.role === 'MID' ? 0.40 :
                           0.30; // LONG
      const hash = (seed + d * 13 + weekIndex * 7) % 100;
      if (hash < reliefChance * 100) {
        usage = 'relief';
        ip = pitcher.role === 'LONG' ? 1.5 + ((seed + d) % 4) * 0.33 :
             0.67 + ((seed + d * 3) % 4) * 0.33;
        ip = Math.round(ip * 10) / 10;
        pc = pitcher.role === 'LONG' ? 25 + ((seed + d * 5) % 20) :
             12 + ((seed + d * 7) % 14);
        er = (seed + d * 3) % 3 === 0 ? 1 : 0;
        decision = DECISIONS_RP[(seed + d) % DECISIONS_RP.length];
        appearances++;
        totalIP += ip;
        totalPitches += pc;
        curConsec++;
        if (curConsec > maxConsec) maxConsec = curConsec;
      } else {
        usage = 'rest';
        restDays++;
        curConsec = 0;
      }
    }

    days.push({
      date: dateStr,
      dayOfWeek: DOW[d],
      usage,
      innings: ip,
      pitchCount: pc,
      earnedRuns: er,
      decision,
    });
  }

  return {
    weekLabel,
    days,
    totalIP: Math.round(totalIP * 10) / 10,
    totalPitches,
    appearances,
    starts,
    consecutiveDays: maxConsec,
    restDays,
  };
}

function determineStatus(pitcher: PitcherWorkloadProfile): WorkloadStatus {
  const latestWeek = pitcher.weeklyLogs[pitcher.weeklyLogs.length - 1];
  if (!latestWeek) return 'well-rested';

  const isStarter = pitcher.role === 'SP';

  // Overworked checks
  if (latestWeek.consecutiveDays >= 3) return 'overworked';
  if (!isStarter && latestWeek.totalIP >= 8) return 'overworked';
  if (isStarter && latestWeek.totalIP >= 15) return 'overworked';
  if (latestWeek.totalPitches >= 250 && !isStarter) return 'overworked';

  // Moderate checks
  if (latestWeek.consecutiveDays >= 2) return 'moderate';
  if (!isStarter && latestWeek.appearances >= 4) return 'moderate';
  if (!isStarter && latestWeek.totalIP >= 5) return 'moderate';
  if (isStarter && latestWeek.totalIP >= 13) return 'moderate';

  return 'well-rested';
}

function buildAlerts(pitcher: PitcherWorkloadProfile): WorkloadAlert[] {
  const alerts: WorkloadAlert[] = [];
  const latestWeek = pitcher.weeklyLogs[pitcher.weeklyLogs.length - 1];
  if (!latestWeek) return alerts;

  if (latestWeek.consecutiveDays >= 3) {
    alerts.push({
      type: 'consecutive',
      message: `${latestWeek.consecutiveDays} consecutive appearances this week`,
      severity: 'danger',
    });
  } else if (latestWeek.consecutiveDays >= 2) {
    alerts.push({
      type: 'consecutive',
      message: `Back-to-back appearances — monitor closely`,
      severity: 'warning',
    });
  }

  if (latestWeek.totalIP >= 30) {
    alerts.push({
      type: 'overuse-ip',
      message: `${latestWeek.totalIP} IP this week — extreme overuse`,
      severity: 'danger',
    });
  } else if (latestWeek.totalIP >= 12 && pitcher.role !== 'SP') {
    alerts.push({
      type: 'overuse-ip',
      message: `${latestWeek.totalIP} IP this week — heavy reliever workload`,
      severity: 'warning',
    });
  }

  if (pitcher.role === 'SP') {
    const lastStartDay = [...latestWeek.days].reverse().find(d => d.usage === 'start');
    if (lastStartDay && lastStartDay.pitchCount >= 110) {
      alerts.push({
        type: 'high-pitch',
        message: `${lastStartDay.pitchCount} pitches in last start — high count`,
        severity: 'warning',
      });
    }
  }

  if (latestWeek.restDays <= 1 && pitcher.role !== 'SP') {
    alerts.push({
      type: 'no-rest',
      message: `Only ${latestWeek.restDays} rest day(s) this week`,
      severity: latestWeek.restDays === 0 ? 'danger' : 'warning',
    });
  }

  return alerts;
}

export function generateDemoStaffWorkloadCalendar(): StaffWorkloadData {
  const weeks = [
    { label: 'Week 1 (Apr 7-13)', index: 0 },
    { label: 'Week 2 (Apr 14-20)', index: 1 },
    { label: 'Week 3 (Apr 21-27)', index: 2 },
  ];

  const pitchers: PitcherWorkloadProfile[] = PITCHER_SEEDS.map((seed, i) => {
    const weeklyLogs = weeks.map(w => buildWeeklyLog(seed, w.index, w.label));
    const latestWeek = weeklyLogs[weeklyLogs.length - 1];
    const totalSeasonIP = weeklyLogs.reduce((s, w) => s + w.totalIP, 0);
    const totalSeasonPitches = weeklyLogs.reduce((s, w) => s + w.totalPitches, 0);
    const totalSeasonApps = weeklyLogs.reduce((s, w) => s + w.appearances, 0);

    const profile: PitcherWorkloadProfile = {
      id: `swc-${i}`,
      name: seed.name,
      team: 'PHI',
      role: seed.role,
      overall: seed.overall,
      age: seed.age,
      throws: seed.throws,
      era: seed.era,
      seasonIP: Math.round(totalSeasonIP * 10) / 10,
      seasonPitches: totalSeasonPitches,
      weeklyLogs,
      currentStatus: 'well-rested', // placeholder, set below
      alerts: [],                    // placeholder, set below
      avgPitchesPerStart: seed.role === 'SP'
        ? Math.round(totalSeasonPitches / Math.max(1, weeklyLogs.reduce((s, w) => s + w.starts, 0)))
        : 0,
      avgPitchesPerRelief: seed.role !== 'SP'
        ? Math.round(totalSeasonPitches / Math.max(1, totalSeasonApps))
        : 0,
      daysOnConsecutive: latestWeek.consecutiveDays,
      seasonAppearances: totalSeasonApps,
    };

    profile.currentStatus = determineStatus(profile);
    profile.alerts = buildAlerts(profile);

    return profile;
  });

  const summary = getStaffWorkloadSummary(pitchers);

  return {
    teamName: 'Philadelphia Phillies',
    teamAbbr: 'PHI',
    currentWeek: 3,
    weekDates: 'Apr 21-27',
    pitchers,
    staffSummary: summary,
  };
}

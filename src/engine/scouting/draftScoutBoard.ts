/**
 * Draft Scout Board
 *
 * Pre-draft scouting intelligence for upcoming draft prospects.
 * Scouts can be assigned to evaluate prospects, revealing grades
 * and intel over time. Original baseball-specific system.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type ScoutGrade = 20 | 25 | 30 | 35 | 40 | 45 | 50 | 55 | 60 | 65 | 70 | 75 | 80;
export type IntelLevel = 'unknown' | 'basic' | 'detailed' | 'complete';

export interface ProspectIntel {
  prospectId: number;
  name: string;
  age: number;
  position: string;
  school: string;
  round: number;
  intelLevel: IntelLevel;
  scoutPoints: number;
  overallGrade?: ScoutGrade;
  hitGrade?: ScoutGrade;
  powerGrade?: ScoutGrade;
  armGrade?: ScoutGrade;
  speedGrade?: ScoutGrade;
  fieldGrade?: ScoutGrade;
  ceiling?: string;
  risk?: string;
  signability?: 'easy' | 'moderate' | 'tough' | 'unknown';
  scoutNotes?: string;
}

export interface ScoutAssignment {
  scoutId: number;
  scoutName: string;
  prospectId: number;
  weeksAssigned: number;
  pointsGenerated: number;
}

// ── Intel level config ──────────────────────────────────────────────────────

export const INTEL_LEVELS: Record<IntelLevel, { points: number; label: string; color: string; reveals: string[] }> = {
  unknown:  { points: 0,   label: 'UNKNOWN',  color: '#6b7280', reveals: [] },
  basic:    { points: 20,  label: 'BASIC',    color: '#eab308', reveals: ['overallGrade', 'position', 'school'] },
  detailed: { points: 50,  label: 'DETAILED', color: '#3b82f6', reveals: ['hitGrade', 'powerGrade', 'armGrade', 'speedGrade', 'fieldGrade', 'ceiling'] },
  complete: { points: 100, label: 'COMPLETE', color: '#22c55e', reveals: ['risk', 'signability', 'scoutNotes'] },
};

export function getIntelLevel(points: number): IntelLevel {
  if (points >= 100) return 'complete';
  if (points >= 50) return 'detailed';
  if (points >= 20) return 'basic';
  return 'unknown';
}

// ── Scout point costs ───────────────────────────────────────────────────────

export const SCOUT_ACTIONS = {
  measurables: { cost: 15, points: 15, label: 'Measurables Workout' },
  interview:   { cost: 25, points: 20, label: 'Player Interview' },
  film:        { cost: 40, points: 30, label: 'Film Study' },
  full:        { cost: 80, points: 50, label: 'Full Evaluation' },
} as const;

// ── Ceiling/risk labels ─────────────────────────────────────────────────────

export const CEILING_LABELS = ['Franchise Cornerstone', 'All-Star', 'Solid Starter', 'Platoon Player', 'Bench Bat', 'Org Depth'] as const;
export const RISK_LABELS = ['Very Low', 'Low', 'Moderate', 'High', 'Very High'] as const;

// ── Scout note generation ───────────────────────────────────────────────────

const SCOUT_NOTES: Record<string, string[]> = {
  SP: [
    'Plus fastball with late life. Slider needs work but shows promise.',
    'Deceptive delivery makes hitters uncomfortable. Command is ahead of stuff.',
    'Big arm, raw mechanics. Classic boom-or-bust arm.',
    'Polished college arm. Low ceiling but very safe floor.',
    'Electric stuff in short stints. Stamina questions for rotation.',
  ],
  C: [
    'Outstanding game-caller. Arm is a plus tool. Bat is the question.',
    'Blocks everything. Above-average pop time. Bat may be fringy.',
    'Switch-hitter with surprising power. Defense needs polish.',
  ],
  SS: [
    'Smooth actions, plus range. Arm plays anywhere on the dirt.',
    'Electric bat speed. Defense is a work in progress.',
    'Tools are loud across the board. Approach needs refinement.',
  ],
  CF: [
    'Blazing speed. Can steal 40 bags. Needs to make more contact.',
    'Five-tool potential. Hit tool is advanced for his age.',
    'Elite defender in center. Bat will determine his ceiling.',
  ],
  DEFAULT: [
    'Toolsy player with projection remaining. Approach is key to development.',
    'Physical specimen. Raw but tools are tantalizing.',
    'Polished college bat. Should move quickly through the system.',
    'High-floor, low-ceiling type. Will contribute at the MLB level.',
  ],
};

export function generateScoutNote(position: string): string {
  const pool = SCOUT_NOTES[position] ?? SCOUT_NOTES.DEFAULT;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Prospect generation (for demo) ──────────────────────────────────────────

const FIRST_NAMES = ['Jackson', 'Ethan', 'Mason', 'Dylan', 'Tyler', 'Brandon', 'Austin', 'Caleb', 'Jayden', 'Logan', 'Diego', 'Mateo', 'Kai', 'Ryu', 'Tanner', 'Bryce'];
const LAST_NAMES = ['Williams', 'Rodriguez', 'Kim', 'Tanaka', 'Smith', 'Johnson', 'Martinez', 'Chen', 'Anderson', 'Taylor', 'Thompson', 'Garcia', 'Lee', 'Brown', 'Davis', 'Wilson'];
const SCHOOLS = ['Vanderbilt', 'LSU', 'Oregon State', 'Stanford', 'Virginia', 'Florida', 'Texas', 'Wake Forest', 'Tennessee', 'Arkansas', 'Ole Miss', 'Miami (FL)', 'UCLA', 'Cal Poly'];
const POSITIONS = ['SP', 'SP', 'SP', 'SS', 'CF', 'C', '3B', '1B', 'RF', '2B', 'LF', 'RP'];

function randomGrade(): ScoutGrade {
  const grades: ScoutGrade[] = [35, 40, 45, 50, 55, 60, 65, 70, 75];
  return grades[Math.floor(Math.random() * grades.length)];
}

export function generateDraftBoard(count: number = 30): ProspectIntel[] {
  const prospects: ProspectIntel[] = [];
  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const position = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
    const round = i < 3 ? 1 : i < 8 ? 2 : i < 15 ? 3 : i < 22 ? 4 : 5;
    const scoutPoints = Math.floor(Math.random() * 120);

    const intel: ProspectIntel = {
      prospectId: 1000 + i,
      name: `${firstName} ${lastName}`,
      age: 18 + Math.floor(Math.random() * 4),
      position,
      school: SCHOOLS[Math.floor(Math.random() * SCHOOLS.length)],
      round,
      intelLevel: getIntelLevel(scoutPoints),
      scoutPoints,
    };

    // Reveal based on intel level
    if (scoutPoints >= 20) {
      intel.overallGrade = randomGrade();
    }
    if (scoutPoints >= 50) {
      intel.hitGrade = randomGrade();
      intel.powerGrade = randomGrade();
      intel.armGrade = randomGrade();
      intel.speedGrade = randomGrade();
      intel.fieldGrade = randomGrade();
      intel.ceiling = CEILING_LABELS[Math.floor(Math.random() * CEILING_LABELS.length)];
    }
    if (scoutPoints >= 100) {
      intel.risk = RISK_LABELS[Math.floor(Math.random() * RISK_LABELS.length)];
      intel.signability = (['easy', 'moderate', 'tough'] as const)[Math.floor(Math.random() * 3)];
      intel.scoutNotes = generateScoutNote(position);
    }

    prospects.push(intel);
  }
  return prospects;
}

// ── Summary ─────────────────────────────────────────────────────────────────

export function getBoardSummary(board: ProspectIntel[]) {
  return {
    total: board.length,
    unknown: board.filter(p => p.intelLevel === 'unknown').length,
    basic: board.filter(p => p.intelLevel === 'basic').length,
    detailed: board.filter(p => p.intelLevel === 'detailed').length,
    complete: board.filter(p => p.intelLevel === 'complete').length,
    avgScoutPoints: board.length > 0
      ? Math.round(board.reduce((s, p) => s + p.scoutPoints, 0) / board.length)
      : 0,
  };
}

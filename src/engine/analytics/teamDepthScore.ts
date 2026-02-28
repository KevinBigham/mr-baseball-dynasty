/**
 * teamDepthScore.ts – Team Depth Score
 *
 * Position-by-position depth grading system that evaluates roster strength
 * by comparing starter quality with backup quality. Calculates dropoff,
 * depth grades, and overall team depth scores.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type DepthGrade = 'elite' | 'above_avg' | 'average' | 'below_avg' | 'thin';

export interface PositionDepth {
  position: string;
  starter: { name: string; rating: number; war: number };
  backup: { name: string; rating: number; war: number };
  depthGrade: DepthGrade;
  dropoff: number;   // rating difference starter vs backup
  notes: string;
}

export interface TeamDepthData {
  id: string;
  teamName: string;
  abbr: string;
  overallDepthScore: number;   // 0-100
  positions: PositionDepth[];
  strongestPosition: string;
  weakestPosition: string;
  avgDropoff: number;
  notes: string;
}

// ── Display Constants ──────────────────────────────────────────────────────

export const DEPTH_GRADE_DISPLAY: Record<DepthGrade, { label: string; color: string }> = {
  elite:     { label: 'Elite',     color: '#22c55e' },
  above_avg: { label: 'Above Avg', color: '#3b82f6' },
  average:   { label: 'Average',   color: '#f59e0b' },
  below_avg: { label: 'Below Avg', color: '#f97316' },
  thin:      { label: 'Thin',      color: '#ef4444' },
};

// ── Summary ────────────────────────────────────────────────────────────────

export interface TeamDepthSummary {
  totalTeams: number;
  deepestTeam: string;
  thinnestTeam: string;
  avgDepthScore: number;
  mostPositionsElite: { team: string; count: number };
  biggestDropoff: { team: string; position: string; dropoff: number };
}

export function getTeamDepthSummary(teams: TeamDepthData[]): TeamDepthSummary {
  const n = teams.length;

  const deepest = teams.reduce((a, b) => a.overallDepthScore > b.overallDepthScore ? a : b, teams[0]);
  const thinnest = teams.reduce((a, b) => a.overallDepthScore < b.overallDepthScore ? a : b, teams[0]);
  const avgScore = Math.round(teams.reduce((s, t) => s + t.overallDepthScore, 0) / n);

  // Most elite positions
  let bestEliteCount = 0;
  let bestEliteTeam = '';
  teams.forEach(t => {
    const eliteCount = t.positions.filter(p => p.depthGrade === 'elite').length;
    if (eliteCount > bestEliteCount) {
      bestEliteCount = eliteCount;
      bestEliteTeam = t.abbr;
    }
  });

  // Biggest single dropoff
  let maxDropoff = 0;
  let dropoffTeam = '';
  let dropoffPos = '';
  teams.forEach(t => {
    t.positions.forEach(p => {
      if (p.dropoff > maxDropoff) {
        maxDropoff = p.dropoff;
        dropoffTeam = t.abbr;
        dropoffPos = p.position;
      }
    });
  });

  return {
    totalTeams: n,
    deepestTeam: deepest.abbr,
    thinnestTeam: thinnest.abbr,
    avgDepthScore: avgScore,
    mostPositionsElite: { team: bestEliteTeam, count: bestEliteCount },
    biggestDropoff: { team: dropoffTeam, position: dropoffPos, dropoff: maxDropoff },
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function computeDepthGrade(starterRating: number, backupRating: number): DepthGrade {
  const dropoff = starterRating - backupRating;
  const backupFloor = backupRating;
  if (backupFloor >= 70 && dropoff <= 10) return 'elite';
  if (backupFloor >= 60 && dropoff <= 15) return 'above_avg';
  if (backupFloor >= 50 && dropoff <= 20) return 'average';
  if (backupFloor >= 40 || dropoff <= 25) return 'below_avg';
  return 'thin';
}

function positionNote(pos: string, grade: DepthGrade, dropoff: number): string {
  if (grade === 'elite') return `Rock solid at ${pos}. Minimal dropoff from starter to backup.`;
  if (grade === 'above_avg') return `Strong depth at ${pos}. Backup can handle extended time.`;
  if (grade === 'average') return `Adequate coverage at ${pos}. Some decline when backup plays.`;
  if (grade === 'below_avg') return `Thin at ${pos}. A ${dropoff}-point dropoff is concerning.`;
  return `Critical weakness at ${pos}. Injury here would be devastating.`;
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

const TEAMS = [
  {
    name: 'Los Angeles Dodgers', abbr: 'LAD',
    starters: [
      { n: 'Will Smith', r: 82, w: 4.2 },
      { n: 'Freddie Freeman', r: 88, w: 5.8 },
      { n: 'Gavin Lux', r: 68, w: 2.1 },
      { n: 'Max Muncy', r: 75, w: 3.4 },
      { n: 'Mookie Betts', r: 92, w: 7.1 },
      { n: 'Chris Taylor', r: 66, w: 1.8 },
      { n: 'James Outman', r: 70, w: 2.5 },
      { n: 'Jason Heyward', r: 62, w: 1.2 },
      { n: 'Shohei Ohtani', r: 97, w: 9.2 },
    ],
    backups: [
      { n: 'Austin Barnes', r: 58, w: 0.8 },
      { n: 'Michael Busch', r: 65, w: 1.5 },
      { n: 'Miguel Rojas', r: 60, w: 1.0 },
      { n: 'Amed Rosario', r: 55, w: 0.5 },
      { n: 'Miguel Rojas', r: 60, w: 1.0 },
      { n: 'Andy Pages', r: 58, w: 0.7 },
      { n: 'Trayce Thompson', r: 55, w: 0.4 },
      { n: 'Andy Pages', r: 58, w: 0.7 },
      { n: 'Chris Taylor', r: 66, w: 1.8 },
    ],
  },
  {
    name: 'Atlanta Braves', abbr: 'ATL',
    starters: [
      { n: 'Sean Murphy', r: 78, w: 3.5 },
      { n: 'Matt Olson', r: 85, w: 5.0 },
      { n: 'Ozzie Albies', r: 80, w: 4.0 },
      { n: 'Austin Riley', r: 84, w: 5.2 },
      { n: 'Orlando Arcia', r: 65, w: 1.5 },
      { n: 'Jarred Kelenic', r: 64, w: 1.3 },
      { n: 'Michael Harris II', r: 82, w: 4.8 },
      { n: 'Ronald Acuna Jr.', r: 94, w: 8.0 },
      { n: 'Marcell Ozuna', r: 76, w: 2.8 },
    ],
    backups: [
      { n: 'Travis d\'Arnaud', r: 65, w: 1.2 },
      { n: 'Ehire Adrianza', r: 48, w: 0.2 },
      { n: 'Whit Merrifield', r: 58, w: 0.6 },
      { n: 'David Fletcher', r: 52, w: 0.3 },
      { n: 'Ehire Adrianza', r: 48, w: 0.2 },
      { n: 'Forrest Wall', r: 45, w: 0.1 },
      { n: 'Jarred Kelenic', r: 64, w: 1.3 },
      { n: 'Jorge Soler', r: 60, w: 0.8 },
      { n: 'Eli White', r: 45, w: 0.1 },
    ],
  },
  {
    name: 'New York Yankees', abbr: 'NYY',
    starters: [
      { n: 'Jose Trevino', r: 68, w: 2.0 },
      { n: 'Anthony Rizzo', r: 72, w: 2.5 },
      { n: 'Gleyber Torres', r: 74, w: 3.0 },
      { n: 'Jazz Chisholm Jr.', r: 76, w: 3.5 },
      { n: 'Anthony Volpe', r: 72, w: 2.8 },
      { n: 'Alex Verdugo', r: 67, w: 1.8 },
      { n: 'Aaron Judge', r: 95, w: 8.5 },
      { n: 'Juan Soto', r: 93, w: 7.5 },
      { n: 'Giancarlo Stanton', r: 78, w: 3.2 },
    ],
    backups: [
      { n: 'Ben Rortvedt', r: 50, w: 0.2 },
      { n: 'DJ LeMahieu', r: 60, w: 0.8 },
      { n: 'Oswald Peraza', r: 55, w: 0.5 },
      { n: 'DJ LeMahieu', r: 60, w: 0.8 },
      { n: 'Oswald Peraza', r: 55, w: 0.5 },
      { n: 'Trent Grisham', r: 52, w: 0.3 },
      { n: 'Trent Grisham', r: 52, w: 0.3 },
      { n: 'Everson Pereira', r: 48, w: 0.1 },
      { n: 'Ben Rice', r: 50, w: 0.2 },
    ],
  },
  {
    name: 'Houston Astros', abbr: 'HOU',
    starters: [
      { n: 'Yainer Diaz', r: 74, w: 3.0 },
      { n: 'Jose Abreu', r: 65, w: 1.2 },
      { n: 'Jose Altuve', r: 86, w: 5.5 },
      { n: 'Alex Bregman', r: 82, w: 4.5 },
      { n: 'Jeremy Pena', r: 72, w: 2.5 },
      { n: 'Yordan Alvarez', r: 90, w: 6.5 },
      { n: 'Jake Meyers', r: 62, w: 1.0 },
      { n: 'Kyle Tucker', r: 88, w: 6.0 },
      { n: 'Jon Singleton', r: 60, w: 0.8 },
    ],
    backups: [
      { n: 'Martin Maldonado', r: 52, w: 0.3 },
      { n: 'Jon Singleton', r: 60, w: 0.8 },
      { n: 'Mauricio Dubon', r: 58, w: 0.6 },
      { n: 'Mauricio Dubon', r: 58, w: 0.6 },
      { n: 'Mauricio Dubon', r: 58, w: 0.6 },
      { n: 'Chas McCormick', r: 60, w: 0.9 },
      { n: 'Chas McCormick', r: 60, w: 0.9 },
      { n: 'Jake Meyers', r: 62, w: 1.0 },
      { n: 'Chas McCormick', r: 60, w: 0.9 },
    ],
  },
  {
    name: 'Pittsburgh Pirates', abbr: 'PIT',
    starters: [
      { n: 'Endy Rodriguez', r: 62, w: 1.0 },
      { n: 'Rowdy Tellez', r: 58, w: 0.5 },
      { n: 'Nick Gonzales', r: 60, w: 0.8 },
      { n: 'Ke\'Bryan Hayes', r: 70, w: 2.5 },
      { n: 'Oneil Cruz', r: 72, w: 2.8 },
      { n: 'Bryan Reynolds', r: 78, w: 3.8 },
      { n: 'Jack Suwinski', r: 55, w: 0.4 },
      { n: 'Connor Joe', r: 56, w: 0.5 },
      { n: 'Andrew McCutchen', r: 60, w: 0.8 },
    ],
    backups: [
      { n: 'Jason Delay', r: 42, w: -0.2 },
      { n: 'Carlos Santana', r: 50, w: 0.2 },
      { n: 'Ji Hwan Bae', r: 48, w: 0.1 },
      { n: 'Jared Triolo', r: 50, w: 0.2 },
      { n: 'Ji Hwan Bae', r: 48, w: 0.1 },
      { n: 'Jack Suwinski', r: 55, w: 0.4 },
      { n: 'Ji Hwan Bae', r: 48, w: 0.1 },
      { n: 'Joshua Palacios', r: 42, w: -0.2 },
      { n: 'Carlos Santana', r: 50, w: 0.2 },
    ],
  },
  {
    name: 'Kansas City Royals', abbr: 'KC',
    starters: [
      { n: 'Salvador Perez', r: 75, w: 3.0 },
      { n: 'Vinnie Pasquantino', r: 74, w: 2.8 },
      { n: 'Michael Massey', r: 66, w: 1.5 },
      { n: 'Maikel Garcia', r: 65, w: 1.8 },
      { n: 'Bobby Witt Jr.', r: 91, w: 7.0 },
      { n: 'MJ Melendez', r: 60, w: 0.8 },
      { n: 'Kyle Isbel', r: 62, w: 1.2 },
      { n: 'Hunter Renfroe', r: 64, w: 1.0 },
      { n: 'Nelson Velazquez', r: 58, w: 0.5 },
    ],
    backups: [
      { n: 'Freddy Fermin', r: 52, w: 0.3 },
      { n: 'Nick Pratto', r: 50, w: 0.2 },
      { n: 'Dairon Blanco', r: 48, w: 0.1 },
      { n: 'Nick Loftin', r: 50, w: 0.2 },
      { n: 'Nick Loftin', r: 50, w: 0.2 },
      { n: 'Drew Waters', r: 46, w: 0.0 },
      { n: 'Drew Waters', r: 46, w: 0.0 },
      { n: 'MJ Melendez', r: 60, w: 0.8 },
      { n: 'Nick Pratto', r: 50, w: 0.2 },
    ],
  },
];

export function generateDemoTeamDepthScore(): TeamDepthData[] {
  return TEAMS.map((t, ti) => {
    const positions: PositionDepth[] = POSITIONS.map((pos, pi) => {
      const starter = t.starters[pi];
      const backup = t.backups[pi];
      const dropoff = starter.r - backup.r;
      const grade = computeDepthGrade(starter.r, backup.r);

      return {
        position: pos,
        starter: { name: starter.n, rating: starter.r, war: starter.w },
        backup: { name: backup.n, rating: backup.r, war: backup.w },
        depthGrade: grade,
        dropoff,
        notes: positionNote(pos, grade, dropoff),
      };
    });

    // Overall depth score: weighted average of position scores
    const gradeValues: Record<DepthGrade, number> = {
      elite: 95, above_avg: 75, average: 55, below_avg: 35, thin: 15,
    };
    const overallScore = Math.round(
      positions.reduce((s, p) => s + gradeValues[p.depthGrade], 0) / positions.length
    );

    const avgDropoff = Math.round(positions.reduce((s, p) => s + p.dropoff, 0) / positions.length);
    const strongest = positions.reduce((a, b) => {
      const av = gradeValues[a.depthGrade];
      const bv = gradeValues[b.depthGrade];
      return av >= bv ? a : b;
    }, positions[0]);
    const weakest = positions.reduce((a, b) => {
      const av = gradeValues[a.depthGrade];
      const bv = gradeValues[b.depthGrade];
      return av <= bv ? a : b;
    }, positions[0]);

    const eliteCount = positions.filter(p => p.depthGrade === 'elite').length;
    const thinCount = positions.filter(p => p.depthGrade === 'thin').length;

    return {
      id: `td-${ti}`,
      teamName: t.name,
      abbr: t.abbr,
      overallDepthScore: overallScore,
      positions,
      strongestPosition: strongest.position,
      weakestPosition: weakest.position,
      avgDropoff,
      notes: eliteCount >= 4
        ? `${t.abbr} has ${eliteCount} elite-depth positions. One of the deepest rosters in the league.`
        : thinCount >= 3
        ? `${t.abbr} has ${thinCount} thin positions. Injuries could be catastrophic.`
        : `${t.abbr} has a mixed depth profile. Avg dropoff of ${avgDropoff} points across the roster.`,
    };
  });
}

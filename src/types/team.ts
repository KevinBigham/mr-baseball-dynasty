export type League = 'AL' | 'NL';
export type Division = 'East' | 'Central' | 'West';

export interface TeamRecord {
  wins: number;
  losses: number;
  runsScored: number;
  runsAllowed: number;
}

export interface CoachingStaff {
  hittingCoachQuality: number;   // 0.3 | 0.5 | 0.7
  pitchingCoachQuality: number;
}

export type TeamStrategy = 'contender' | 'fringe' | 'rebuilder';

export interface Team {
  teamId: number;
  name: string;         // e.g. "River City Wolves"
  abbreviation: string; // e.g. "RCW"
  city: string;
  league: League;
  division: Division;
  parkFactorId: number; // Index into park factors array
  budget: number;       // Annual payroll budget in dollars
  scoutingQuality: number; // 0.4–1.0 (fog of war)
  coaching: CoachingStaff;
  strategy: TeamStrategy;
  seasonRecord: TeamRecord;
  // Rotation tracking (used during season sim)
  rotationIndex: number;
  bullpenReliefCounter: number;
}

export interface TeamSeasonStats {
  teamId: number;
  season: number;
  record: TeamRecord;
  payroll: number;
  playoffSeed?: number;
  playoffRound?: 'WC' | 'DS' | 'CS' | 'WS' | 'Champion';
}

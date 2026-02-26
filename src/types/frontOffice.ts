// ─── Front Office types ────────────────────────────────────────────────────────

export type FORoleId =
  | 'gm'
  | 'scout_dir'
  | 'analytics'
  | 'manager'
  | 'pitching_coach'
  | 'hitting_coach'
  | 'trainer'
  | 'intl_scout';

export type FOTraitId =
  | 'analytical'
  | 'old_school'
  | 'moneyball'
  | 'developer'
  | 'negotiator'
  | 'talent_scout'
  | 'analytics_guru'
  | 'clubhouse_guy'
  | 'grinder'
  | 'visionary'
  | 'tactician'
  | 'medic'
  | 'recruiter'
  | 'competitor'
  | 'pitcher_whisperer';

export type FOAction =
  | 'trades'
  | 'freeAgency'
  | 'contracts'
  | 'waivers'
  | 'drafting'
  | 'prospectEval'
  | 'intlSigning'
  | 'evaluation'
  | 'gameplan'
  | 'bullpenMgmt'
  | 'lineup'
  | 'chemistry'
  | 'pitcherDev'
  | 'hitterDev'
  | 'injuries'
  | 'recovery'
  | 'durability';

export type FORoleTier = 'core' | 'specialist';

export interface FORoleDefinition {
  id:          FORoleId;
  icon:        string;
  title:       string;
  desc:        string;
  affects:     FOAction[];
  salaryRange: [number, number]; // [min, max] in $M/yr
  tier:        FORoleTier;
  color:       string;
}

export interface FOTraitDefinition {
  id:    FOTraitId;
  icon:  string;
  label: string;
  desc:  string;
}

export interface FOStaffMember {
  id:          string;  // UUID
  roleId:      FORoleId;
  name:        string;
  ovr:         number;  // 40–95
  salary:      number;  // $M/yr, one decimal
  yearsLeft:   number;  // Contract years
  traitId:     FOTraitId;
  backstory:   string;
  // From role definition (denormalized for easy rendering)
  icon:        string;
  title:       string;
  color:       string;
  tier:        FORoleTier;
}

// ─── Start-mode options ────────────────────────────────────────────────────────

export type StartModeId =
  | 'instant'
  | 'snake10'
  | 'snake25'
  | 'auction'
  | 'snake26';

export interface StartModeOption {
  id:          StartModeId;
  icon:        string;
  label:       string;
  sub:         string;
  desc:        string;
  time:        string;
  diff:        string;
  recommended: boolean;
  available:   boolean; // false = Coming Soon
}

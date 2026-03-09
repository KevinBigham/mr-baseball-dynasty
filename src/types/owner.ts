/**
 * Owner & mandate types.
 * Stub — Sprint 04 branch surgery.
 */

export type MandateType = 'WIN_NOW' | 'STAY_COMPETITIVE' | 'PATIENT_BUILD' | 'TRIM_PAYROLL' | 'BALANCED';
export type JobSecurity = 'safe' | 'warm' | 'hot';

export interface OwnerMandate {
  type: MandateType;
  strategyOverride?: import('./team').TeamStrategy;
  bidAggression: number;
  payrollModifier: number;
}

export interface OwnerGoal {
  goalId: string;
  label: string;
  met: boolean;
}

export interface OwnerProfile {
  teamId: number;
  ownerName: string;
  activeMandate: OwnerMandate;
  currentGoals: OwnerGoal[];
  lastEvaluation: OwnerEvaluation | null;
  jobSecurity: JobSecurity;
}

export interface OwnerEvaluation {
  teamId: number;
  season: number;
  score: number;
  summary: string;
}

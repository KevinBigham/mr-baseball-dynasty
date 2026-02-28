/**
 * Injury Tracker System
 *
 * Detailed injury tracking with body part classifications,
 * recovery timelines, re-injury risk, and IL management.
 *
 * Original baseball-specific system.
 */

export type InjurySeverity = 'day_to_day' | 'il_10' | 'il_15' | 'il_60' | 'season_ending';
export type BodyPart = 'shoulder' | 'elbow' | 'knee' | 'hamstring' | 'back' | 'oblique' | 'wrist' | 'ankle' | 'groin' | 'concussion';

export interface Injury {
  playerId: number;
  playerName: string;
  position: string;
  bodyPart: BodyPart;
  description: string;
  severity: InjurySeverity;
  gameDay: number;
  expectedReturn: number;
  actualReturn?: number;
  reinjuryRisk: number;   // 0-100
  isActive: boolean;
}

export const SEVERITY_DISPLAY: Record<InjurySeverity, { label: string; color: string; days: [number, number] }> = {
  day_to_day:    { label: 'DAY-TO-DAY', color: '#eab308', days: [1, 3] },
  il_10:         { label: '10-DAY IL',   color: '#f97316', days: [10, 15] },
  il_15:         { label: '15-DAY IL',   color: '#ef4444', days: [15, 30] },
  il_60:         { label: '60-DAY IL',   color: '#dc2626', days: [60, 90] },
  season_ending: { label: 'SEASON OVER', color: '#991b1b', days: [120, 180] },
};

export const BODY_PART_DISPLAY: Record<BodyPart, { label: string; icon: string; commonFor: string[] }> = {
  shoulder:    { label: 'Shoulder',    icon: '🦴', commonFor: ['SP', 'RP', 'CL', 'RF', 'CF'] },
  elbow:       { label: 'Elbow',       icon: '💪', commonFor: ['SP', 'RP', 'CL'] },
  knee:        { label: 'Knee',        icon: '🦵', commonFor: ['C', 'SS', '2B', '3B'] },
  hamstring:   { label: 'Hamstring',   icon: '🏃', commonFor: ['CF', 'LF', 'RF', 'SS'] },
  back:        { label: 'Lower Back',  icon: '🔙', commonFor: ['1B', 'DH', 'C'] },
  oblique:     { label: 'Oblique',     icon: '🤕', commonFor: ['SP', '1B', '3B', 'RF'] },
  wrist:       { label: 'Wrist',       icon: '✋', commonFor: ['SS', '2B', '3B', '1B'] },
  ankle:       { label: 'Ankle',       icon: '🦶', commonFor: ['CF', 'LF', 'RF', 'SS'] },
  groin:       { label: 'Groin',       icon: '🩹', commonFor: ['C', '1B', 'SS'] },
  concussion:  { label: 'Concussion',  icon: '🤯', commonFor: ['C'] },
};

const INJURY_DESCS: Record<BodyPart, string[]> = {
  shoulder:   ['Rotator cuff inflammation', 'Shoulder impingement', 'Shoulder strain'],
  elbow:      ['UCL sprain', 'Elbow inflammation', 'Flexor strain', 'Tommy John surgery needed'],
  knee:       ['Knee sprain', 'Meniscus tear', 'Patellar tendinitis'],
  hamstring:  ['Hamstring strain', 'Hamstring tightness', 'Grade 2 hamstring tear'],
  back:       ['Lower back strain', 'Disc irritation', 'Back spasms'],
  oblique:    ['Oblique strain', 'Left oblique tightness', 'Right oblique strain'],
  wrist:      ['Wrist contusion', 'Hamate bone fracture', 'Wrist tendinitis'],
  ankle:      ['Ankle sprain', 'High ankle sprain', 'Ankle inflammation'],
  groin:      ['Groin strain', 'Groin tightness'],
  concussion: ['Concussion — 7-day IL protocol', 'Head contusion — monitoring'],
};

export function generateInjury(
  playerId: number,
  playerName: string,
  position: string,
  gameDay: number,
): Injury {
  // Weight body parts by position
  const common = Object.entries(BODY_PART_DISPLAY)
    .filter(([, info]) => info.commonFor.includes(position))
    .map(([bp]) => bp as BodyPart);
  const bodyPart = common.length > 0
    ? common[Math.floor(Math.random() * common.length)]
    : 'hamstring';

  const sevs: InjurySeverity[] = ['day_to_day', 'il_10', 'il_15', 'il_60', 'season_ending'];
  const weights = [35, 30, 20, 10, 5]; // weighted toward less severe
  let roll = Math.random() * 100;
  let severity: InjurySeverity = 'day_to_day';
  for (let i = 0; i < sevs.length; i++) {
    roll -= weights[i];
    if (roll <= 0) { severity = sevs[i]; break; }
  }

  const descs = INJURY_DESCS[bodyPart];
  const description = descs[Math.floor(Math.random() * descs.length)];

  const [minDays, maxDays] = SEVERITY_DISPLAY[severity].days;
  const returnDay = gameDay + minDays + Math.floor(Math.random() * (maxDays - minDays));

  // Prior injuries to same body part increase reinjury risk
  const reinjuryRisk = severity === 'season_ending' ? 30 :
    severity === 'il_60' ? 25 :
    severity === 'il_15' ? 15 :
    severity === 'il_10' ? 10 : 5;

  return {
    playerId,
    playerName,
    position,
    bodyPart,
    description,
    severity,
    gameDay,
    expectedReturn: returnDay,
    reinjuryRisk,
    isActive: true,
  };
}

export function getInjurySummary(injuries: Injury[]) {
  const active = injuries.filter(i => i.isActive);
  return {
    total: injuries.length,
    active: active.length,
    onIL: active.filter(i => i.severity !== 'day_to_day').length,
    dayToDay: active.filter(i => i.severity === 'day_to_day').length,
    seasonEnding: active.filter(i => i.severity === 'season_ending').length,
    highRisk: active.filter(i => i.reinjuryRisk >= 20).length,
  };
}

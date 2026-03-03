// ─── Player Development Lab — Program definitions ───────────────────────────
// Each program boosts one attribute at the cost of another during offseason dev.

export type DevProgram =
  | 'power_focus' | 'contact_focus' | 'eye_development' | 'speed_training'
  | 'defensive_drills' | 'stuff_development' | 'command_work' | 'movement_mechanics'
  | 'stamina_building' | 'balanced';

export interface DevAssignment {
  playerId: number;
  program: DevProgram;
  assignedSeason: number;
}

export interface ProgramDefinition {
  id: DevProgram;
  name: string;
  description: string;
  // Which attribute this program boosts (for hitters or pitchers)
  boostAttr: string;      // Key name matching HitterAttributes or PitcherAttributes
  boostAmount: number;    // +5 to +8 added to development delta
  penaltyAttr: string;    // Which attribute takes a penalty
  penaltyAmount: number;  // -2 to -3 penalty
  forPitchers: boolean;   // Is this a pitcher program?
}

export const DEV_PROGRAMS: ProgramDefinition[] = [
  // Hitter programs
  { id: 'power_focus', name: 'POWER FOCUS', description: 'Heavy weight training and launch angle work', boostAttr: 'power', boostAmount: 7, penaltyAttr: 'contact', penaltyAmount: -2, forPitchers: false },
  { id: 'contact_focus', name: 'CONTACT FOCUS', description: 'Plate discipline and bat-to-ball drills', boostAttr: 'contact', boostAmount: 7, penaltyAttr: 'power', penaltyAmount: -2, forPitchers: false },
  { id: 'eye_development', name: 'EYE DEVELOPMENT', description: 'Pitch recognition and zone awareness', boostAttr: 'eye', boostAmount: 6, penaltyAttr: 'speed', penaltyAmount: -2, forPitchers: false },
  { id: 'speed_training', name: 'SPEED TRAINING', description: 'Sprint mechanics and baserunning', boostAttr: 'speed', boostAmount: 6, penaltyAttr: 'power', penaltyAmount: -3, forPitchers: false },
  { id: 'defensive_drills', name: 'DEFENSIVE DRILLS', description: 'Fielding fundamentals and positioning', boostAttr: 'fielding', boostAmount: 8, penaltyAttr: 'power', penaltyAmount: -2, forPitchers: false },
  // Pitcher programs
  { id: 'stuff_development', name: 'STUFF DEVELOPMENT', description: 'Velocity and pitch arsenal work', boostAttr: 'stuff', boostAmount: 7, penaltyAttr: 'command', penaltyAmount: -2, forPitchers: true },
  { id: 'command_work', name: 'COMMAND WORK', description: 'Location and consistency drills', boostAttr: 'command', boostAmount: 7, penaltyAttr: 'stuff', penaltyAmount: -2, forPitchers: true },
  { id: 'movement_mechanics', name: 'MOVEMENT MECHANICS', description: 'Pitch movement and deception', boostAttr: 'movement', boostAmount: 6, penaltyAttr: 'stamina', penaltyAmount: -2, forPitchers: true },
  { id: 'stamina_building', name: 'STAMINA BUILDING', description: 'Endurance and workload capacity', boostAttr: 'stamina', boostAmount: 8, penaltyAttr: 'stuff', penaltyAmount: -3, forPitchers: true },
  { id: 'balanced', name: 'BALANCED', description: 'General development — no focused boost or penalty', boostAttr: '', boostAmount: 0, penaltyAttr: '', penaltyAmount: 0, forPitchers: false },
];

export function getProgramsForPlayer(isPitcher: boolean): ProgramDefinition[] {
  return DEV_PROGRAMS.filter(p => p.id === 'balanced' || p.forPitchers === isPitcher);
}

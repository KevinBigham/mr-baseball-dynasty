// ─── Player Archetypes ────────────────────────────────────────────────────
// Classifies players into baseball-specific archetypes and adjusts aging curves.

export type Position = 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH' | 'SP' | 'RP';

export interface AgeCurve {
  prime: [number, number];
  cliff: number;
  decayRate: number;
}

export const AGE_CURVES: Record<string, AgeCurve> = {
  C:  { prime: [26, 32], cliff: 33, decayRate: 3.5 },
  '1B': { prime: [26, 34], cliff: 35, decayRate: 2.5 },
  '2B': { prime: [25, 31], cliff: 32, decayRate: 3.0 },
  '3B': { prime: [25, 33], cliff: 34, decayRate: 2.8 },
  SS:  { prime: [24, 30], cliff: 31, decayRate: 3.2 },
  LF:  { prime: [25, 32], cliff: 33, decayRate: 2.8 },
  CF:  { prime: [24, 30], cliff: 31, decayRate: 3.5 },
  RF:  { prime: [25, 33], cliff: 34, decayRate: 2.5 },
  DH:  { prime: [27, 37], cliff: 38, decayRate: 2.0 },
  SP:  { prime: [25, 32], cliff: 33, decayRate: 3.0 },
  RP:  { prime: [26, 34], cliff: 35, decayRate: 2.5 },
};

export interface Archetype {
  id: string;
  label: string;
  emoji: string;
  desc: string;
}

export interface ClassifiedPlayer {
  archetype: Archetype;
  ageCurve: AgeCurve;
}

// ─── Hitter Archetypes ────────────────────────────────────────────────────

const HITTER_ARCHETYPES: Record<string, Archetype[]> = {
  C: [
    { id: 'defensive_wall', label: 'Defensive Wall', emoji: '🛡️', desc: 'Elite framing & game-calling catcher' },
    { id: 'offensive_c', label: 'Offensive Backstop', emoji: '💪', desc: 'Power-hitting catcher with good bat' },
    { id: 'field_general', label: 'Field General', emoji: '🎖️', desc: 'Veteran leader who controls the pitching staff' },
  ],
  '1B': [
    { id: 'slugger', label: 'Slugger', emoji: '💣', desc: 'Pure power hitter, 30+ HR potential' },
    { id: 'contact_1b', label: 'Contact Machine', emoji: '🎯', desc: 'High average first baseman with gap power' },
    { id: 'stretch_1b', label: 'Gold Glove 1B', emoji: '🧤', desc: 'Elite defensive first baseman' },
  ],
  '2B': [
    { id: 'spark_plug', label: 'Spark Plug', emoji: '⚡', desc: 'Speed-and-contact catalyst at the top of the order' },
    { id: 'power_mi', label: 'Power Middle IF', emoji: '💥', desc: 'Rare power from the middle infield' },
    { id: 'glovefirst_2b', label: 'Glove-First 2B', emoji: '🧤', desc: 'Elite defender with vacuum hands' },
  ],
  '3B': [
    { id: 'hot_corner', label: 'Hot Corner Masher', emoji: '🔥', desc: 'Power-hitting third baseman' },
    { id: 'vacuum_3b', label: 'Vacuum Cleaner', emoji: '🧹', desc: 'Elite reflexes and arm at third' },
    { id: 'balanced_3b', label: 'Five-Tool Corner', emoji: '⭐', desc: 'All-around contributor at the hot corner' },
  ],
  SS: [
    { id: 'wizard', label: 'Defensive Wizard', emoji: '🪄', desc: 'Ozzie Smith-type glove at shortstop' },
    { id: 'power_ss', label: 'Power Shortstop', emoji: '💣', desc: 'Modern premium offensive SS' },
    { id: 'table_setter', label: 'Table Setter', emoji: '🏃', desc: 'Speed-and-contact leadoff shortstop' },
  ],
  LF: [
    { id: 'run_producer', label: 'Run Producer', emoji: '💪', desc: 'Middle-of-the-order RBI machine' },
    { id: 'contact_of', label: 'Contact Specialist', emoji: '🎯', desc: 'High-average, low-strikeout hitter' },
    { id: 'toolsy_lf', label: 'Toolsy Outfielder', emoji: '⭐', desc: 'Athletic outfielder with all tools' },
  ],
  CF: [
    { id: 'rangey_cf', label: 'Rangey Center', emoji: '🦅', desc: 'Gold Glove-caliber range in center' },
    { id: 'five_tool', label: 'Five-Tool Player', emoji: '🌟', desc: 'Elite in all five tools — the total package' },
    { id: 'speed_demon', label: 'Speed Demon', emoji: '💨', desc: '40+ steal threat with elite speed' },
  ],
  RF: [
    { id: 'cannon_arm', label: 'Cannon Arm', emoji: '🔫', desc: 'Elite arm that deters baserunners' },
    { id: 'corner_bat', label: 'Corner Bat', emoji: '💣', desc: 'Power-first corner outfielder' },
    { id: 'complete_rf', label: 'Complete RF', emoji: '⭐', desc: 'Balanced offensive and defensive contributor' },
  ],
  DH: [
    { id: 'pure_masher', label: 'Pure Masher', emoji: '🏋️', desc: 'Bat-only destroyer, 35+ HR ceiling' },
    { id: 'on_base_machine', label: 'OBP Machine', emoji: '👁️', desc: 'Elite discipline, walks more than strikes out' },
    { id: 'veteran_bat', label: 'Veteran Bat', emoji: '🎓', desc: 'Experienced hitter providing steady production' },
  ],
};

// ─── Pitcher Archetypes ───────────────────────────────────────────────────

const PITCHER_ARCHETYPES: Record<string, Archetype[]> = {
  SP: [
    { id: 'ace', label: 'Ace', emoji: '♠️', desc: 'Front-of-rotation workhorse, 200+ IP' },
    { id: 'strikeout_artist', label: 'Strikeout Artist', emoji: '🔥', desc: 'Power arm with 10+ K/9' },
    { id: 'crafty_lefty', label: 'Crafty Veteran', emoji: '🧠', desc: 'Pitch-to-contact with elite command' },
    { id: 'innings_eater', label: 'Innings Eater', emoji: '🍽️', desc: 'Durable mid-rotation consistency' },
  ],
  RP: [
    { id: 'shutdown_closer', label: 'Shutdown Closer', emoji: '🚪', desc: 'Lockdown 9th inning specialist' },
    { id: 'setup_man', label: 'Setup Man', emoji: '🔧', desc: 'Elite bridge to the closer, 7th-8th inning' },
    { id: 'fireman', label: 'Fireman', emoji: '🧯', desc: 'High-leverage multi-inning reliever' },
    { id: 'loogy', label: 'Specialist', emoji: '🎯', desc: 'Platoon-advantage matchup pitcher' },
  ],
};

// ─── Archetype aging mods ─────────────────────────────────────────────────

const ARCHETYPE_AGING_MODS: Record<string, { cliffShift: number; decayMult: number }> = {
  // Speed-dependent age faster
  speed_demon:   { cliffShift: -2, decayMult: 1.3 },
  spark_plug:    { cliffShift: -1, decayMult: 1.2 },
  rangey_cf:     { cliffShift: -1, decayMult: 1.2 },
  table_setter:  { cliffShift: -1, decayMult: 1.15 },
  wizard:        { cliffShift: -1, decayMult: 1.1 },
  // Power ages well
  slugger:       { cliffShift: 1, decayMult: 0.9 },
  pure_masher:   { cliffShift: 2, decayMult: 0.85 },
  corner_bat:    { cliffShift: 1, decayMult: 0.9 },
  hot_corner:    { cliffShift: 1, decayMult: 0.9 },
  // Craft/brain ages best
  crafty_lefty:  { cliffShift: 2, decayMult: 0.8 },
  field_general: { cliffShift: 2, decayMult: 0.85 },
  on_base_machine: { cliffShift: 2, decayMult: 0.85 },
  veteran_bat:   { cliffShift: 3, decayMult: 0.8 },
  // Pitchers
  ace:             { cliffShift: 0, decayMult: 1.0 },
  strikeout_artist:{ cliffShift: -1, decayMult: 1.2 },
  innings_eater:   { cliffShift: 1, decayMult: 0.9 },
  shutdown_closer: { cliffShift: 1, decayMult: 0.85 },
  fireman:         { cliffShift: 0, decayMult: 1.0 },
  loogy:           { cliffShift: 2, decayMult: 0.8 },
  setup_man:       { cliffShift: 0, decayMult: 1.0 },
};

// ─── Classify ─────────────────────────────────────────────────────────────

export function classifyPlayer(pos: string, overall: number): ClassifiedPlayer {
  const isPitcher = pos === 'SP' || pos === 'RP';
  const pool = isPitcher ? PITCHER_ARCHETYPES[pos] : HITTER_ARCHETYPES[pos];
  if (!pool || pool.length === 0) {
    return {
      archetype: { id: 'utility', label: 'Utility', emoji: '🔄', desc: 'Versatile contributor' },
      ageCurve: AGE_CURVES[pos] || AGE_CURVES['DH'],
    };
  }

  // Deterministic classification based on overall bands
  let idx: number;
  if (overall >= 75) idx = 0;       // Elite → primary archetype
  else if (overall >= 60) idx = 1;  // Good → secondary
  else idx = Math.min(2, pool.length - 1); // Below avg → tertiary

  const archetype = pool[idx];
  const baseCurve = AGE_CURVES[pos] || AGE_CURVES['DH'];
  const mod = ARCHETYPE_AGING_MODS[archetype.id];

  const ageCurve: AgeCurve = mod
    ? { prime: baseCurve.prime, cliff: baseCurve.cliff + mod.cliffShift, decayRate: baseCurve.decayRate * mod.decayMult }
    : baseCurve;

  return { archetype, ageCurve };
}

// ─── Demo helpers ─────────────────────────────────────────────────────────

export interface DemoArchetypePlayer {
  id: number;
  name: string;
  pos: string;
  age: number;
  overall: number;
  archetype: Archetype;
  ageCurve: AgeCurve;
  phase: 'rising' | 'prime' | 'declining';
}

const DEMO_NAMES: Record<string, string[]> = {
  C:  ['James McCann', 'Salvador Perez', 'Willson Contreras'],
  '1B': ['Pete Alonso', 'Freddie Freeman', 'Matt Olson'],
  '2B': ['Jose Altuve', 'Marcus Semien', 'Ozzie Albies'],
  '3B': ['Manny Machado', 'Austin Riley', 'Rafael Devers'],
  SS:  ['Trea Turner', 'Carlos Correa', 'Corey Seager'],
  LF:  ['Kyle Schwarber', 'Juan Soto', 'Andrew Benintendi'],
  CF:  ['Mike Trout', 'Byron Buxton', 'Cedric Mullins'],
  RF:  ['Mookie Betts', 'Aaron Judge', 'Ronald Acuña Jr.'],
  DH:  ['Yordan Alvarez', 'Shohei Ohtani', 'J.D. Martinez'],
  SP:  ['Gerrit Cole', 'Max Scherzer', 'Justin Verlander', 'Zack Wheeler'],
  RP:  ['Edwin Díaz', 'Josh Hader', 'Devin Williams', 'Ryan Pressly'],
};

export function generateDemoArchetypes(): DemoArchetypePlayer[] {
  const result: DemoArchetypePlayer[] = [];
  let id = 1;
  const positions = Object.keys(DEMO_NAMES);
  for (const pos of positions) {
    const names = DEMO_NAMES[pos];
    for (let i = 0; i < names.length; i++) {
      const ovr = 80 - i * 10 + Math.floor((id * 7) % 5);
      const age = 24 + i * 3 + Math.floor((id * 3) % 4);
      const { archetype, ageCurve } = classifyPlayer(pos, ovr);
      const phase: DemoArchetypePlayer['phase'] =
        age < ageCurve.prime[0] ? 'rising' :
        age <= ageCurve.prime[1] ? 'prime' : 'declining';
      result.push({ id: id++, name: names[i], pos, age, overall: Math.min(99, Math.max(40, ovr)), archetype, ageCurve, phase });
    }
  }
  return result;
}

/**
 * Coach Skill Tree — Mr. Baseball Dynasty
 *
 * Adapted from Mr. Football Dynasty's coach-skill-tree system.
 * Three coaching trees with 3 branches each, 3 tiers per branch:
 *
 *   HITTING COACH tree:
 *     - Contact: Spray Hitter → Hit Machine → Contact King
 *     - Power: Pull Hitter → Power Surge → Launch Angle Guru
 *     - Plate Discipline: Patient Approach → Walk Machine → Elite Eye
 *
 *   PITCHING COACH tree:
 *     - Velocity: Pitch Command → Strikeout Artist → Flamethrower
 *     - Finesse: Pitch Mix → Crafty Vet → Master Sequencer
 *     - Bullpen Mgmt: Bullpen Order → Leverage Master → Shutdown Pen
 *
 *   DEVELOPMENT tree:
 *     - Player Dev: Prospect Polisher → Fast Track → Franchise Builder
 *     - Analytics: Data Driven → Stat Guru → Analytics King
 *     - Culture: Team Builder → Clubhouse Leader → Dynasty Culture
 *
 * Each tier unlocks at manager experience levels 3, 6, and 9.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SkillTreeId = 'hitting' | 'pitching' | 'development';
export type BranchId = string;

export interface SkillTier {
  tier:        number;     // 1, 2, 3
  label:       string;
  desc:        string;
  unlockLevel: number;     // Manager experience level needed
  bonus:       SkillBonus;
}

export interface SkillBranch {
  id:      BranchId;
  label:   string;
  icon:    string;
  tiers:   SkillTier[];
}

export interface SkillTree {
  id:       SkillTreeId;
  label:    string;
  icon:     string;
  branches: SkillBranch[];
}

export interface SkillBonus {
  key:     string;
  value:   number;
  desc:    string;
}

export interface ActiveSkillSelection {
  treeId:    SkillTreeId;
  branchId:  BranchId;
  tier:      number;
}

export interface AggregatedBonus {
  contactBoost:       number;
  powerBoost:         number;
  eyeBoost:           number;
  velocityBoost:      number;
  finesseBoost:       number;
  bullpenBoost:       number;
  devSpeedBoost:      number;
  analyticsBoost:     number;
  chemistryBoost:     number;
}

// ─── Skill Tree Definitions ───────────────────────────────────────────────────

export const SKILL_TREES: SkillTree[] = [
  {
    id: 'hitting',
    label: 'Hitting Coach',
    icon: '🏏',
    branches: [
      {
        id: 'contact',
        label: 'Contact',
        icon: '🎯',
        tiers: [
          { tier: 1, label: 'Spray Hitter', desc: '+3% contact rating development', unlockLevel: 3, bonus: { key: 'contactBoost', value: 0.03, desc: '+3% contact dev' } },
          { tier: 2, label: 'Hit Machine', desc: '+6% contact, +2% BABIP boost', unlockLevel: 6, bonus: { key: 'contactBoost', value: 0.06, desc: '+6% contact dev' } },
          { tier: 3, label: 'Contact King', desc: '+10% contact, +5% BABIP, reduced K%', unlockLevel: 9, bonus: { key: 'contactBoost', value: 0.10, desc: '+10% contact dev' } },
        ],
      },
      {
        id: 'power',
        label: 'Power',
        icon: '💪',
        tiers: [
          { tier: 1, label: 'Pull Hitter', desc: '+3% power rating development', unlockLevel: 3, bonus: { key: 'powerBoost', value: 0.03, desc: '+3% power dev' } },
          { tier: 2, label: 'Power Surge', desc: '+6% power, +HR rate boost', unlockLevel: 6, bonus: { key: 'powerBoost', value: 0.06, desc: '+6% power dev' } },
          { tier: 3, label: 'Launch Angle Guru', desc: '+10% power, +ISO boost', unlockLevel: 9, bonus: { key: 'powerBoost', value: 0.10, desc: '+10% power dev' } },
        ],
      },
      {
        id: 'discipline',
        label: 'Plate Discipline',
        icon: '👁️',
        tiers: [
          { tier: 1, label: 'Patient Approach', desc: '+3% plate discipline development', unlockLevel: 3, bonus: { key: 'eyeBoost', value: 0.03, desc: '+3% discipline dev' } },
          { tier: 2, label: 'Walk Machine', desc: '+6% discipline, +BB rate', unlockLevel: 6, bonus: { key: 'eyeBoost', value: 0.06, desc: '+6% discipline dev' } },
          { tier: 3, label: 'Elite Eye', desc: '+10% discipline, reduced chase rate', unlockLevel: 9, bonus: { key: 'eyeBoost', value: 0.10, desc: '+10% discipline dev' } },
        ],
      },
    ],
  },
  {
    id: 'pitching',
    label: 'Pitching Coach',
    icon: '⚾',
    branches: [
      {
        id: 'velocity',
        label: 'Velocity',
        icon: '🔥',
        tiers: [
          { tier: 1, label: 'Pitch Command', desc: '+3% velocity development', unlockLevel: 3, bonus: { key: 'velocityBoost', value: 0.03, desc: '+3% velocity dev' } },
          { tier: 2, label: 'Strikeout Artist', desc: '+6% velocity, +K rate', unlockLevel: 6, bonus: { key: 'velocityBoost', value: 0.06, desc: '+6% velocity dev' } },
          { tier: 3, label: 'Flamethrower', desc: '+10% velocity, dominant fastball', unlockLevel: 9, bonus: { key: 'velocityBoost', value: 0.10, desc: '+10% velocity dev' } },
        ],
      },
      {
        id: 'finesse',
        label: 'Finesse',
        icon: '🎨',
        tiers: [
          { tier: 1, label: 'Pitch Mix', desc: '+3% pitch repertoire development', unlockLevel: 3, bonus: { key: 'finesseBoost', value: 0.03, desc: '+3% finesse dev' } },
          { tier: 2, label: 'Crafty Vet', desc: '+6% finesse, pitch sequencing bonus', unlockLevel: 6, bonus: { key: 'finesseBoost', value: 0.06, desc: '+6% finesse dev' } },
          { tier: 3, label: 'Master Sequencer', desc: '+10% finesse, elite command', unlockLevel: 9, bonus: { key: 'finesseBoost', value: 0.10, desc: '+10% finesse dev' } },
        ],
      },
      {
        id: 'bullpen',
        label: 'Bullpen Mgmt',
        icon: '📋',
        tiers: [
          { tier: 1, label: 'Bullpen Order', desc: '+3% reliever performance', unlockLevel: 3, bonus: { key: 'bullpenBoost', value: 0.03, desc: '+3% bullpen boost' } },
          { tier: 2, label: 'Leverage Master', desc: '+6% reliever performance in high leverage', unlockLevel: 6, bonus: { key: 'bullpenBoost', value: 0.06, desc: '+6% bullpen boost' } },
          { tier: 3, label: 'Shutdown Pen', desc: '+10% reliever performance, closer ice', unlockLevel: 9, bonus: { key: 'bullpenBoost', value: 0.10, desc: '+10% bullpen boost' } },
        ],
      },
    ],
  },
  {
    id: 'development',
    label: 'Development',
    icon: '📈',
    branches: [
      {
        id: 'playerdev',
        label: 'Player Dev',
        icon: '🌱',
        tiers: [
          { tier: 1, label: 'Prospect Polisher', desc: '+5% prospect development speed', unlockLevel: 3, bonus: { key: 'devSpeedBoost', value: 0.05, desc: '+5% dev speed' } },
          { tier: 2, label: 'Fast Track', desc: '+10% prospect development, faster ETA', unlockLevel: 6, bonus: { key: 'devSpeedBoost', value: 0.10, desc: '+10% dev speed' } },
          { tier: 3, label: 'Franchise Builder', desc: '+15% development, higher ceiling outcomes', unlockLevel: 9, bonus: { key: 'devSpeedBoost', value: 0.15, desc: '+15% dev speed' } },
        ],
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: '📊',
        tiers: [
          { tier: 1, label: 'Data Driven', desc: '+3% scouting accuracy', unlockLevel: 3, bonus: { key: 'analyticsBoost', value: 0.03, desc: '+3% scouting' } },
          { tier: 2, label: 'Stat Guru', desc: '+6% scouting + matchup optimization', unlockLevel: 6, bonus: { key: 'analyticsBoost', value: 0.06, desc: '+6% scouting' } },
          { tier: 3, label: 'Analytics King', desc: '+10% scouting, advanced stat bonuses', unlockLevel: 9, bonus: { key: 'analyticsBoost', value: 0.10, desc: '+10% scouting' } },
        ],
      },
      {
        id: 'culture',
        label: 'Culture',
        icon: '🏠',
        tiers: [
          { tier: 1, label: 'Team Builder', desc: '+5% team chemistry', unlockLevel: 3, bonus: { key: 'chemistryBoost', value: 0.05, desc: '+5% chemistry' } },
          { tier: 2, label: 'Clubhouse Leader', desc: '+10% chemistry, morale protection', unlockLevel: 6, bonus: { key: 'chemistryBoost', value: 0.10, desc: '+10% chemistry' } },
          { tier: 3, label: 'Dynasty Culture', desc: '+15% chemistry, prevents locker room issues', unlockLevel: 9, bonus: { key: 'chemistryBoost', value: 0.15, desc: '+15% chemistry' } },
        ],
      },
    ],
  },
];

// ─── Get Active Bonus ─────────────────────────────────────────────────────────

export function getActiveBonus(selections: ActiveSkillSelection[]): AggregatedBonus {
  const bonus: AggregatedBonus = {
    contactBoost: 0,
    powerBoost: 0,
    eyeBoost: 0,
    velocityBoost: 0,
    finesseBoost: 0,
    bullpenBoost: 0,
    devSpeedBoost: 0,
    analyticsBoost: 0,
    chemistryBoost: 0,
  };

  for (const sel of selections) {
    const tree = SKILL_TREES.find(t => t.id === sel.treeId);
    if (!tree) continue;
    const branch = tree.branches.find(b => b.id === sel.branchId);
    if (!branch) continue;

    // Stack all tiers up to and including the selected tier
    for (const tier of branch.tiers) {
      if (tier.tier <= sel.tier) {
        const key = tier.bonus.key as keyof AggregatedBonus;
        if (key in bonus) {
          bonus[key] += tier.bonus.value;
        }
      }
    }
  }

  return bonus;
}

// ─── Get Available Selections ─────────────────────────────────────────────────

export function getAvailableSelections(
  managerLevel: number,
  currentSelections: ActiveSkillSelection[],
): ActiveSkillSelection[] {
  const available: ActiveSkillSelection[] = [];

  for (const tree of SKILL_TREES) {
    for (const branch of tree.branches) {
      const currentSel = currentSelections.find(s => s.treeId === tree.id && s.branchId === branch.id);
      const currentTier = currentSel?.tier ?? 0;

      // Next tier available?
      const nextTier = branch.tiers.find(t => t.tier === currentTier + 1);
      if (nextTier && managerLevel >= nextTier.unlockLevel) {
        available.push({ treeId: tree.id, branchId: branch.id, tier: nextTier.tier });
      }
    }
  }

  return available;
}

// ─── Utility: Get tree display info ───────────────────────────────────────────

export function getTreeProgress(
  treeId: SkillTreeId,
  selections: ActiveSkillSelection[],
): { total: number; unlocked: number; maxTier: number } {
  const tree = SKILL_TREES.find(t => t.id === treeId);
  if (!tree) return { total: 0, unlocked: 0, maxTier: 0 };

  const total = tree.branches.reduce((s, b) => s + b.tiers.length, 0);
  let unlocked = 0;
  let maxTier = 0;

  for (const branch of tree.branches) {
    const sel = selections.find(s => s.treeId === treeId && s.branchId === branch.id);
    if (sel) {
      unlocked += sel.tier;
      maxTier = Math.max(maxTier, sel.tier);
    }
  }

  return { total, unlocked, maxTier };
}

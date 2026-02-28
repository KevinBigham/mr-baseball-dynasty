import { useState, useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  SKILL_TREES,
  getActiveBonus,
  getAvailableSelections,
  getTreeProgress,
  type SkillTreeId,
  type ActiveSkillSelection,
  type AggregatedBonus,
} from '../../engine/coaching/coachSkillTree';

function TreeTab({ id, label, icon, active, onClick }: { id: string; label: string; icon: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className={`px-3 py-1.5 text-xs font-bold rounded flex items-center gap-1 ${
        active ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
      }`}
      onClick={onClick}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function TierNode({
  tier,
  unlocked,
  available,
  onUnlock,
}: {
  tier: { tier: number; label: string; desc: string; unlockLevel: number; bonus: { desc: string } };
  unlocked: boolean;
  available: boolean;
  onUnlock: () => void;
}) {
  const bgColor = unlocked ? 'bg-orange-900/40 border-orange-500' :
    available ? 'bg-gray-800/50 border-green-600 cursor-pointer hover:bg-green-900/20' :
    'bg-gray-900/30 border-gray-700 opacity-50';

  return (
    <div
      className={`bloomberg-border px-3 py-2 transition-all ${bgColor}`}
      onClick={available && !unlocked ? onUnlock : undefined}
    >
      <div className="flex items-center justify-between mb-1">
        <span className={`font-bold text-xs ${unlocked ? 'text-orange-300' : available ? 'text-green-400' : 'text-gray-500'}`}>
          {tier.label}
        </span>
        <span className="text-gray-600 text-[10px]">T{tier.tier} · Lv{tier.unlockLevel}</span>
      </div>
      <div className="text-gray-400 text-[10px]">{tier.desc}</div>
      {unlocked && (
        <div className="text-orange-400 text-[10px] font-bold mt-1">{tier.bonus.desc}</div>
      )}
      {available && !unlocked && (
        <div className="text-green-400 text-[10px] font-bold mt-1 animate-pulse">Click to unlock</div>
      )}
    </div>
  );
}

function BonusDisplay({ bonus }: { bonus: AggregatedBonus }) {
  const entries = Object.entries(bonus).filter(([, v]) => v > 0);
  if (entries.length === 0) return <div className="text-gray-600 text-xs text-center py-2">No bonuses active</div>;

  const BONUS_LABELS: Record<string, string> = {
    contactBoost: 'Contact Dev',
    powerBoost: 'Power Dev',
    eyeBoost: 'Discipline Dev',
    velocityBoost: 'Velocity Dev',
    finesseBoost: 'Finesse Dev',
    bullpenBoost: 'Bullpen Boost',
    devSpeedBoost: 'Dev Speed',
    analyticsBoost: 'Scouting',
    chemistryBoost: 'Chemistry',
  };

  return (
    <div className="space-y-1">
      {entries.map(([key, val]) => (
        <div key={key} className="flex items-center justify-between text-xs px-2 py-0.5">
          <span className="text-gray-400">{BONUS_LABELS[key] ?? key}</span>
          <span className="text-green-400 font-bold tabular-nums">+{Math.round(val * 100)}%</span>
        </div>
      ))}
    </div>
  );
}

export default function CoachSkillTree() {
  const { gameStarted } = useGameStore();
  const [activeTree, setActiveTree] = useState<SkillTreeId>('hitting');
  const [selections, setSelections] = useState<ActiveSkillSelection[]>([]);
  const [managerLevel, setManagerLevel] = useState(5); // Default level for display

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const tree = SKILL_TREES.find(t => t.id === activeTree)!;
  const available = getAvailableSelections(managerLevel, selections);
  const bonus = getActiveBonus(selections);

  const handleUnlock = (treeId: SkillTreeId, branchId: string, tier: number) => {
    setSelections(prev => {
      // Remove any existing selection for this branch (replace with higher tier)
      const filtered = prev.filter(s => !(s.treeId === treeId && s.branchId === branchId));
      return [...filtered, { treeId, branchId, tier }];
    });
  };

  const totalUnlocked = selections.reduce((s, sel) => s + sel.tier, 0);
  const totalPossible = SKILL_TREES.reduce((s, t) => s + t.branches.reduce((s2, b) => s2 + b.tiers.length, 0), 0);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>COACHING SKILL TREE</span>
        <span className="text-gray-600 text-[10px]">MANAGER LEVEL {managerLevel} · {totalUnlocked}/{totalPossible} SKILLS</span>
      </div>

      {/* Level selector */}
      <div className="flex items-center gap-3">
        <span className="text-gray-500 text-xs">MANAGER LEVEL:</span>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(lv => (
            <button key={lv} onClick={() => setManagerLevel(lv)}
              className={`w-6 h-6 text-[10px] font-bold rounded ${
                managerLevel >= lv ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-500'
              }`}>{lv}</button>
          ))}
        </div>
      </div>

      {/* Tree tabs */}
      <div className="flex items-center gap-2">
        {SKILL_TREES.map(t => {
          const prog = getTreeProgress(t.id, selections);
          return (
            <TreeTab
              key={t.id}
              id={t.id}
              label={`${t.label} (${prog.unlocked}/${prog.total})`}
              icon={t.icon}
              active={activeTree === t.id}
              onClick={() => setActiveTree(t.id)}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {/* Branches */}
        <div className="col-span-3">
          <div className="bloomberg-border">
            <div className="bloomberg-header">{tree.icon} {tree.label.toUpperCase()} TREE</div>
            <div className="p-3 grid grid-cols-3 gap-4">
              {tree.branches.map(branch => {
                const currentSel = selections.find(s => s.treeId === activeTree && s.branchId === branch.id);
                const currentTier = currentSel?.tier ?? 0;

                return (
                  <div key={branch.id} className="space-y-2">
                    <div className="flex items-center gap-1 mb-2">
                      <span>{branch.icon}</span>
                      <span className="text-gray-400 text-xs font-bold">{branch.label.toUpperCase()}</span>
                    </div>
                    {branch.tiers.map(tier => {
                      const isUnlocked = currentTier >= tier.tier;
                      const isAvailable = available.some(
                        a => a.treeId === activeTree && a.branchId === branch.id && a.tier === tier.tier
                      );
                      return (
                        <TierNode
                          key={tier.tier}
                          tier={tier}
                          unlocked={isUnlocked}
                          available={isAvailable && !isUnlocked}
                          onUnlock={() => handleUnlock(activeTree, branch.id, tier.tier)}
                        />
                      );
                    })}
                    {/* Connection lines */}
                    {currentTier > 0 && (
                      <div className="flex justify-center">
                        <div className="w-0.5 h-2 bg-orange-500/40" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active bonuses sidebar */}
        <div className="space-y-4">
          <div className="bloomberg-border">
            <div className="bloomberg-header text-green-400">ACTIVE BONUSES</div>
            <div className="p-2">
              <BonusDisplay bonus={bonus} />
            </div>
          </div>

          <div className="bloomberg-border">
            <div className="bloomberg-header text-gray-500">PROGRESS</div>
            <div className="p-3 space-y-2">
              {SKILL_TREES.map(t => {
                const prog = getTreeProgress(t.id, selections);
                const pct = prog.total > 0 ? Math.round((prog.unlocked / prog.total) * 100) : 0;
                return (
                  <div key={t.id}>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-gray-500">{t.icon} {t.label}</span>
                      <span className="text-gray-400 tabular-nums">{prog.unlocked}/{prog.total}</span>
                    </div>
                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bloomberg-border">
            <div className="bloomberg-header text-gray-500">UNLOCK GUIDE</div>
            <div className="p-3 text-[10px] text-gray-500 space-y-1">
              <div>Tier 1: Manager Level 3+</div>
              <div>Tier 2: Manager Level 6+</div>
              <div>Tier 3: Manager Level 9+</div>
              <div className="text-gray-600 mt-2">Higher tiers stack with lower tiers in the same branch.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

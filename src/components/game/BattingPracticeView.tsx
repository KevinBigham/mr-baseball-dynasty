import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  FOCUS_OPTIONS,
  CAPTAIN_MOMENTS,
  generateDemoGameDay,
  selectFocus,
  type GameDayState,
  type FocusId,
} from '../../engine/game/battingPractice';

function FocusCard({ focus, selected, onSelect }: { focus: typeof FOCUS_OPTIONS[0]; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect}
      className={`bloomberg-border text-left px-3 py-2 transition-colors ${selected ? 'border-orange-600/50 bg-orange-900/10' : 'hover:bg-gray-800/20'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{focus.emoji}</span>
        <span className="text-orange-300 font-bold text-xs">{focus.label}</span>
      </div>
      <div className="text-gray-500 text-[10px] mb-2">{focus.desc}</div>
      <div className="flex flex-wrap gap-1 text-[9px]">
        {focus.effects.hitting > 0 && <span className="px-1 py-0.5 bg-orange-900/20 text-orange-400 rounded">+{Math.round(focus.effects.hitting * 100)}% HIT</span>}
        {focus.effects.pitching > 0 && <span className="px-1 py-0.5 bg-blue-900/20 text-blue-400 rounded">+{Math.round(focus.effects.pitching * 100)}% PITCH</span>}
        {focus.effects.fielding > 0 && <span className="px-1 py-0.5 bg-green-900/20 text-green-400 rounded">+{Math.round(focus.effects.fielding * 100)}% FIELD</span>}
        {focus.effects.energy > 0 && <span className="px-1 py-0.5 bg-cyan-900/20 text-cyan-400 rounded">+{Math.round(focus.effects.energy * 100)}% NRG</span>}
        {focus.effects.energy < 0 && <span className="px-1 py-0.5 bg-red-900/20 text-red-400 rounded">{Math.round(focus.effects.energy * 100)}% NRG</span>}
        {focus.effects.morale > 0 && <span className="px-1 py-0.5 bg-yellow-900/20 text-yellow-400 rounded">+{Math.round(focus.effects.morale * 100)}% MRL</span>}
      </div>
    </button>
  );
}

export default function BattingPracticeView() {
  const { gameStarted } = useGameStore();
  const [state, setState] = useState<GameDayState>(() => generateDemoGameDay());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const handleSelect = (focusId: FocusId) => {
    setState(prev => selectFocus(prev, focusId));
  };

  const energyColor = state.teamEnergy >= 70 ? '#22c55e' : state.teamEnergy >= 40 ? '#eab308' : '#ef4444';
  const moraleColor = state.teamMorale >= 70 ? '#22c55e' : state.teamMorale >= 40 ? '#eab308' : '#ef4444';

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>PRE-GAME PREP</span>
        <span className="text-gray-600 text-[10px]">vs {state.opponent} | Series {state.seriesRecord.wins}-{state.seriesRecord.losses}</span>
      </div>

      {/* Team status */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ENERGY</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: energyColor }}>{state.teamEnergy}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">MORALE</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: moraleColor }}>{state.teamMorale}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">HIT BOOST</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">+{state.hitBoost}%</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PITCH BOOST</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">+{state.pitchBoost}%</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">FIELD BOOST</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">+{state.fieldBoost}%</div>
        </div>
      </div>

      {/* Energy and morale bars */}
      <div className="bloomberg-border px-4 py-3">
        <div className="space-y-2">
          <div>
            <div className="flex items-center justify-between text-[10px] mb-0.5">
              <span className="text-gray-600">TEAM ENERGY</span>
              <span className="tabular-nums font-bold" style={{ color: energyColor }}>{state.teamEnergy}%</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${state.teamEnergy}%`, backgroundColor: energyColor }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] mb-0.5">
              <span className="text-gray-600">TEAM MORALE</span>
              <span className="tabular-nums font-bold" style={{ color: moraleColor }}>{state.teamMorale}%</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${state.teamMorale}%`, backgroundColor: moraleColor }} />
            </div>
          </div>
        </div>
      </div>

      {/* Focus selection */}
      <div>
        <div className="text-gray-600 text-[10px] font-bold mb-2">SELECT PRE-GAME FOCUS</div>
        <div className="grid grid-cols-3 gap-2">
          {FOCUS_OPTIONS.map(f => (
            <FocusCard key={f.id} focus={f} selected={state.focusSelected === f.id} onSelect={() => handleSelect(f.id)} />
          ))}
        </div>
      </div>

      {/* Captain moments */}
      {state.captainMoments.length > 0 && (
        <div>
          <div className="text-gray-600 text-[10px] font-bold mb-2">CAPTAIN MOMENTS</div>
          <div className="grid grid-cols-2 gap-2">
            {state.captainMoments.map((m, i) => (
              <div key={i} className="bloomberg-border px-3 py-2" style={{ borderColor: m.color + '44' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span>{m.emoji}</span>
                  <span className="font-bold text-xs" style={{ color: m.color }}>{m.label}</span>
                </div>
                <div className="text-gray-500 text-[10px]">{m.desc}</div>
                <div className="text-[10px] mt-1" style={{ color: m.color }}>{m.effect}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { TeamChemistryData, PlayerMorale, ChemistryEvent } from '../../engine/chemistry/teamChemistry';

function ChemistryGauge({ value, label }: { value: number; label: string }) {
  const color = value >= 70 ? 'bg-green-500' : value >= 50 ? 'bg-orange-500' : value >= 30 ? 'bg-yellow-500' : 'bg-red-500';
  const textColor = value >= 70 ? 'text-green-400' : value >= 50 ? 'text-orange-400' : value >= 30 ? 'text-yellow-400' : 'text-red-400';
  return (
    <div className="text-center">
      <div className="text-gray-500 text-[10px] font-bold">{label}</div>
      <div className={`font-bold text-xl tabular-nums ${textColor}`}>{value}</div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mt-1">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ClubhouseBadge({ rating }: { rating: string }) {
  const colors: Record<string, string> = {
    'Elite': 'bg-green-900/40 text-green-400',
    'Excellent': 'bg-green-900/30 text-green-300',
    'Good': 'bg-blue-900/30 text-blue-400',
    'Average': 'bg-gray-800 text-gray-400',
    'Fractured': 'bg-orange-900/30 text-orange-400',
    'Toxic': 'bg-red-900/40 text-red-400',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-bold rounded ${colors[rating] ?? 'bg-gray-800 text-gray-400'}`}>
      {rating.toUpperCase()}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    star: 'text-yellow-400',
    starter: 'text-gray-300',
    bench: 'text-gray-500',
    prospect: 'text-blue-400',
    veteran_leader: 'text-orange-400',
  };
  const labels: Record<string, string> = {
    star: 'STAR',
    starter: 'STARTER',
    bench: 'BENCH',
    prospect: 'PROSPECT',
    veteran_leader: 'LEADER',
  };
  return <span className={`text-[10px] font-bold ${colors[role] ?? 'text-gray-500'}`}>{labels[role] ?? role}</span>;
}

function MoraleBar({ morale }: { morale: number }) {
  const color = morale >= 70 ? 'bg-green-500' : morale >= 50 ? 'bg-orange-500' : morale >= 30 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-1">
      <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${morale}%` }} />
      </div>
      <span className="text-gray-500 text-[10px] tabular-nums">{morale}</span>
    </div>
  );
}

function EventCard({ event }: { event: ChemistryEvent }) {
  const isPositive = event.impact > 0;
  return (
    <div className={`flex items-start gap-2 py-1 border-b border-gray-800/50 last:border-b-0`}>
      <span className={`text-xs font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? '+' : ''}{event.impact}
      </span>
      <div className="flex-1">
        <div className="text-xs text-gray-300">{event.description}</div>
        <span className="text-[10px] text-gray-600">{event.type.replace(/_/g, ' ')}</span>
      </div>
    </div>
  );
}

export default function TeamChemistry() {
  const { gameStarted, userTeamId } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [chemistry, setChemistry] = useState<TeamChemistryData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted || userTeamId == null) return;
    setLoading(true);
    getEngine().getTeamChemistry(userTeamId)
      .then(setChemistry)
      .finally(() => setLoading(false));
  }, [gameStarted, userTeamId]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading team chemistry...</div>;
  if (!chemistry) return <div className="p-4 text-gray-500 text-xs">Chemistry data unavailable.</div>;

  const sortedMorales = [...chemistry.playerMorales].sort((a, b) => b.morale - a.morale);
  const happiest = sortedMorales.slice(0, 5);
  const unhappiest = [...sortedMorales].reverse().slice(0, 5);
  const leaders = chemistry.playerMorales.filter(p => p.leadershipValue >= 5).sort((a, b) => b.leadershipValue - a.leadershipValue);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>TEAM CHEMISTRY</span>
        <ClubhouseBadge rating={chemistry.clubhouseRating} />
      </div>

      {/* Gauges */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2">
          <ChemistryGauge value={chemistry.overall} label="OVERALL" />
        </div>
        <div className="bloomberg-border px-3 py-2">
          <ChemistryGauge value={chemistry.cohesion} label="COHESION" />
        </div>
        <div className="bloomberg-border px-3 py-2">
          <ChemistryGauge value={chemistry.moraleAvg} label="AVG MORALE" />
        </div>
        <div className="bloomberg-border px-3 py-2">
          <div className="text-center">
            <div className="text-gray-500 text-[10px] font-bold">LEADERSHIP</div>
            <div className="text-orange-400 font-bold text-xl tabular-nums">{chemistry.leadershipScore}</div>
            <div className="text-gray-600 text-[10px]">/ 30</div>
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2">
          <div className="text-center">
            <div className="text-gray-500 text-[10px] font-bold">WIN BONUS</div>
            <div className={`font-bold text-xl tabular-nums ${
              chemistry.performanceBonus > 0 ? 'text-green-400' : chemistry.performanceBonus < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {chemistry.performanceBonus > 0 ? '+' : ''}{(chemistry.performanceBonus * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Happiest players */}
        <div className="bloomberg-border">
          <div className="bloomberg-header">HAPPIEST PLAYERS</div>
          <div className="p-2 space-y-1">
            {happiest.map(p => (
              <div key={p.playerId}
                className="flex items-center justify-between py-0.5 cursor-pointer hover:bg-gray-800/50 px-1 rounded text-xs"
                onClick={() => goToPlayer(p.playerId)}>
                <div className="flex items-center gap-2">
                  <span className="text-orange-300 font-bold">{p.name}</span>
                  <RoleBadge role={p.role} />
                </div>
                <MoraleBar morale={p.morale} />
              </div>
            ))}
          </div>
        </div>

        {/* Unhappiest */}
        <div className="bloomberg-border">
          <div className="bloomberg-header">UNHAPPIEST PLAYERS</div>
          <div className="p-2 space-y-1">
            {unhappiest.map(p => (
              <div key={p.playerId}
                className="flex items-center justify-between py-0.5 cursor-pointer hover:bg-gray-800/50 px-1 rounded text-xs"
                onClick={() => goToPlayer(p.playerId)}>
                <div className="flex items-center gap-2">
                  <span className="text-orange-300 font-bold">{p.name}</span>
                  <RoleBadge role={p.role} />
                </div>
                <MoraleBar morale={p.morale} />
              </div>
            ))}
          </div>
        </div>

        {/* Clubhouse leaders */}
        <div className="bloomberg-border">
          <div className="bloomberg-header">CLUBHOUSE LEADERS</div>
          <div className="p-2 space-y-1">
            {leaders.length === 0 ? (
              <div className="text-gray-600 text-xs text-center py-4">No strong clubhouse leaders.</div>
            ) : leaders.map(p => (
              <div key={p.playerId}
                className="flex items-center justify-between py-0.5 cursor-pointer hover:bg-gray-800/50 px-1 rounded text-xs"
                onClick={() => goToPlayer(p.playerId)}>
                <span className="text-orange-300 font-bold">{p.name}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold ${
                    p.chemistryFit > 3 ? 'text-green-400' : p.chemistryFit > 0 ? 'text-gray-400' : 'text-red-400'
                  }`}>
                    FIT: {p.chemistryFit > 0 ? '+' : ''}{p.chemistryFit}
                  </span>
                  <span className="text-yellow-400 font-bold text-[10px] tabular-nums">
                    LDR: {p.leadershipValue}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chemistry events */}
      {chemistry.events.length > 0 && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">CHEMISTRY EVENTS ({chemistry.events.length})</div>
          <div className="max-h-[16rem] overflow-y-auto p-2">
            {chemistry.events.map((e, i) => <EventCard key={i} event={e} />)}
          </div>
        </div>
      )}

      {/* Full morale list */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">FULL ROSTER MORALE</div>
        <div className="max-h-[24rem] overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                <th className="px-2 py-1 text-left">PLAYER</th>
                <th className="px-2 py-1">ROLE</th>
                <th className="px-2 py-1">MORALE</th>
                <th className="px-2 py-1">LEADERSHIP</th>
                <th className="px-2 py-1">CHEM FIT</th>
              </tr>
            </thead>
            <tbody>
              {sortedMorales.map(p => (
                <tr key={p.playerId} className="text-xs hover:bg-gray-800/50 cursor-pointer"
                  onClick={() => goToPlayer(p.playerId)}>
                  <td className="px-2 py-1 font-bold text-orange-300">{p.name}</td>
                  <td className="px-2 py-1 text-center"><RoleBadge role={p.role} /></td>
                  <td className="px-2 py-1"><MoraleBar morale={p.morale} /></td>
                  <td className="px-2 py-1 tabular-nums text-gray-500 text-center">{p.leadershipValue}</td>
                  <td className="px-2 py-1 text-center">
                    <span className={`text-xs font-bold ${
                      p.chemistryFit > 3 ? 'text-green-400' : p.chemistryFit > 0 ? 'text-gray-400' : p.chemistryFit < -3 ? 'text-red-400' : 'text-orange-400'
                    }`}>
                      {p.chemistryFit > 0 ? '+' : ''}{p.chemistryFit}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

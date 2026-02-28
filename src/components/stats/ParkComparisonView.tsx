/**
 * ParkComparisonView.tsx — League-wide park factor comparison
 *
 * Sortable table showing all 30 parks with their factors.
 * Visual bars and color coding make it easy to identify extreme parks.
 */

import { useState } from 'react';
import { PARK_FACTORS, type ParkFactor } from '../../data/parkFactors';
import { INITIAL_TEAMS } from '../../data/teams';
import { useGameStore } from '../../store/gameStore';

type SortField = 'name' | 'hr' | 'babip' | 'double' | 'triple' | 'k' | 'elevation' | 'composite';

function compositeScore(p: ParkFactor): number {
  return p.hrFactor * 0.45 + p.babipFactor * 0.25 + p.doubleFactor * 0.15 + p.tripleFactor * 0.15;
}

function factorColor(value: number, neutral = 1.0): string {
  const diff = value - neutral;
  if (diff > 0.04) return '#4ade80';
  if (diff > 0.01) return '#86efac';
  if (diff < -0.04) return '#f87171';
  if (diff < -0.01) return '#fca5a5';
  return '#6b7280';
}

function MiniBar({ value, neutral = 1.0, range = 0.15 }: { value: number; neutral?: number; range?: number }) {
  const pct = Math.max(0, Math.min(1, (value - (neutral - range)) / (range * 2)));
  const neutralPct = 0.5;
  const barLeft = Math.min(pct, neutralPct);
  const barWidth = Math.abs(pct - neutralPct);
  const color = factorColor(value, neutral);

  return (
    <div className="w-16 h-3 bg-gray-800 rounded-sm relative inline-block align-middle ml-2">
      <div className="absolute top-0 bottom-0 w-px bg-gray-600" style={{ left: '50%' }} />
      <div
        className="absolute top-0.5 bottom-0.5 rounded-sm"
        style={{
          left: `${barLeft * 100}%`,
          width: `${barWidth * 100}%`,
          background: `${color}33`,
          borderLeft: value < neutral ? `2px solid ${color}` : 'none',
          borderRight: value > neutral ? `2px solid ${color}` : 'none',
        }}
      />
    </div>
  );
}

// Map park IDs to team abbreviations for context
function getTeamsForPark(parkId: number): string[] {
  return INITIAL_TEAMS
    .filter(t => t.parkFactorId === parkId)
    .map(t => t.abbreviation);
}

export default function ParkComparisonView() {
  const [sortField, setSortField] = useState<SortField>('composite');
  const [sortAsc, setSortAsc] = useState(false);
  const { userTeamId } = useGameStore();

  const userParkId = INITIAL_TEAMS.find(t => t.teamId === userTeamId)?.parkFactorId ?? -1;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedParks = [...PARK_FACTORS].sort((a, b) => {
    let diff = 0;
    switch (sortField) {
      case 'name': diff = a.name.localeCompare(b.name); break;
      case 'hr': diff = a.hrFactor - b.hrFactor; break;
      case 'babip': diff = a.babipFactor - b.babipFactor; break;
      case 'double': diff = a.doubleFactor - b.doubleFactor; break;
      case 'triple': diff = a.tripleFactor - b.tripleFactor; break;
      case 'k': diff = a.kFactor - b.kFactor; break;
      case 'elevation': diff = a.elevation - b.elevation; break;
      case 'composite': diff = compositeScore(a) - compositeScore(b); break;
    }
    return sortAsc ? diff : -diff;
  });

  const SortHeader = ({ field, label, w }: { field: SortField; label: string; w: string }) => (
    <th
      className={`text-xs font-bold tracking-wider cursor-pointer hover:text-orange-400 transition-colors py-1.5 text-right ${w}`}
      style={{ color: sortField === field ? '#f97316' : '#6b7280' }}
      onClick={() => handleSort(field)}
    >
      {label}
      {sortField === field && (
        <span className="ml-1">{sortAsc ? '▲' : '▼'}</span>
      )}
    </th>
  );

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>LEAGUE PARK FACTORS</span>
        <span className="text-gray-600 text-xs normal-case font-normal">30 venues · Click column to sort</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              <th
                className="text-left text-xs font-bold tracking-wider cursor-pointer hover:text-orange-400 py-1.5 px-4 w-48"
                style={{ color: sortField === 'name' ? '#f97316' : '#6b7280' }}
                onClick={() => handleSort('name')}
              >
                PARK {sortField === 'name' && <span>{sortAsc ? '▲' : '▼'}</span>}
              </th>
              <th className="text-xs text-gray-600 w-16 text-center">TEAM</th>
              <SortHeader field="composite" label="OVR" w="w-12" />
              <SortHeader field="hr" label="HR" w="w-24" />
              <SortHeader field="babip" label="BABIP" w="w-24" />
              <SortHeader field="double" label="2B" w="w-24" />
              <SortHeader field="triple" label="3B" w="w-24" />
              <SortHeader field="k" label="K" w="w-24" />
              <SortHeader field="elevation" label="ELEV" w="w-16" />
            </tr>
          </thead>
          <tbody>
            {sortedParks.map(park => {
              const teams = getTeamsForPark(park.id);
              const isUserPark = park.id === userParkId;
              const comp = compositeScore(park);

              return (
                <tr
                  key={park.id}
                  className={`border-b border-gray-800/50 transition-colors ${
                    isUserPark ? 'bg-orange-950/20' : 'hover:bg-gray-800/30'
                  }`}
                >
                  <td className="px-4 py-1.5">
                    <div className="font-bold text-gray-200">
                      {park.name}
                      {isUserPark && <span className="text-orange-400 ml-1">★</span>}
                    </div>
                    <div className="text-gray-600 text-xs">{park.city}</div>
                  </td>
                  <td className="text-center text-gray-500 font-mono">
                    {teams.join(', ')}
                  </td>
                  <td className="text-right pr-2">
                    <span className="font-mono font-bold" style={{ color: factorColor(comp) }}>
                      {comp.toFixed(2)}
                    </span>
                  </td>
                  <td className="text-right pr-1">
                    <span className="font-mono tabular-nums" style={{ color: factorColor(park.hrFactor) }}>
                      {park.hrFactor.toFixed(2)}
                    </span>
                    <MiniBar value={park.hrFactor} />
                  </td>
                  <td className="text-right pr-1">
                    <span className="font-mono tabular-nums" style={{ color: factorColor(park.babipFactor) }}>
                      {park.babipFactor.toFixed(2)}
                    </span>
                    <MiniBar value={park.babipFactor} range={0.05} />
                  </td>
                  <td className="text-right pr-1">
                    <span className="font-mono tabular-nums" style={{ color: factorColor(park.doubleFactor) }}>
                      {park.doubleFactor.toFixed(2)}
                    </span>
                    <MiniBar value={park.doubleFactor} />
                  </td>
                  <td className="text-right pr-1">
                    <span className="font-mono tabular-nums" style={{ color: factorColor(park.tripleFactor) }}>
                      {park.tripleFactor.toFixed(2)}
                    </span>
                    <MiniBar value={park.tripleFactor} />
                  </td>
                  <td className="text-right pr-1">
                    <span className="font-mono tabular-nums" style={{ color: factorColor(park.kFactor) }}>
                      {park.kFactor.toFixed(2)}
                    </span>
                    <MiniBar value={park.kFactor} range={0.05} />
                  </td>
                  <td className="text-right pr-4 font-mono text-gray-500 tabular-nums">
                    {park.elevation.toLocaleString()}′
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

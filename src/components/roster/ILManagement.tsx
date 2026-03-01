/**
 * ILManagement.tsx — Shows injured players with recovery timelines.
 */

import type { RosterPlayer } from '../../types/league';

interface Props {
  ilPlayers: RosterPlayer[];
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'minor':    return '#fbbf24';
    case 'moderate': return '#f97316';
    case 'severe':   return '#ef4444';
    default:         return '#6b7280';
  }
}

function ilLabel(severity: string): string {
  switch (severity) {
    case 'minor':    return '10-DAY IL';
    case 'moderate': return '60-DAY IL';
    case 'severe':   return 'SEASON-ENDING';
    default:         return 'IL';
  }
}

export default function ILManagement({ ilPlayers }: Props) {
  if (ilPlayers.length === 0) {
    return (
      <div className="bloomberg-border bg-gray-900">
        <div className="bloomberg-header px-4">INJURED LIST</div>
        <div className="px-4 py-6 text-center text-gray-600 text-xs">
          No players currently on the injured list.
        </div>
      </div>
    );
  }

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>INJURED LIST</span>
        <span className="text-red-500 font-normal text-xs normal-case">{ilPlayers.length} player{ilPlayers.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="divide-y divide-gray-800">
        {ilPlayers.map(p => {
          const info = p.injuryInfo;
          const color = info ? severityColor(info.severity) : '#6b7280';
          const label = info ? ilLabel(info.severity) : 'IL';
          const pctRecovered = info ? Math.max(0, 1 - info.daysRemaining / Math.max(1, info.daysRemaining + 10)) : 0;

          return (
            <div key={p.playerId} className="px-4 py-3 flex items-center gap-4">
              {/* Player info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-gray-200 font-bold text-sm">{p.name}</span>
                  <span className="text-gray-500 text-xs">{p.position} · Age {p.age}</span>
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
                  >
                    {label}
                  </span>
                </div>
                {info && (
                  <div className="text-gray-500 text-xs mt-0.5">{info.type}</div>
                )}
              </div>

              {/* Recovery bar */}
              <div className="text-right min-w-[100px] shrink-0">
                {info ? (
                  <>
                    <div className="text-xs tabular-nums" style={{ color }}>
                      {info.daysRemaining > 0 ? `${info.daysRemaining} days left` : 'Ready'}
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded mt-1 overflow-hidden">
                      <div
                        className="h-full rounded transition-all"
                        style={{ width: `${pctRecovered * 100}%`, background: color }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-gray-600 text-xs">On IL</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

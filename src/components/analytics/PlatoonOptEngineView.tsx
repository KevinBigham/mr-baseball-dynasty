/**
 * PlatoonOptEngineView – Platoon Optimization Engine dashboard
 *
 * Bloomberg-terminal style platoon optimizer with paired player cards,
 * vs L/R split comparisons, combined wOBA bars, and best pairing highlight.
 */
import { useState, useMemo } from 'react';
import {
  generateDemoPlatoonOpt,
  type PlatoonPairing,
} from '../../engine/analytics/platoonOptEngine';

const HAND_COLORS: Record<string, string> = {
  L: '#3b82f6',
  R: '#22c55e',
  S: '#a855f7',
};

function WOBABar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#6b7280', marginBottom: 1 }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{value.toFixed(3)}</span>
      </div>
      <div style={{ height: 8, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
    </div>
  );
}

function PairingCard({
  pairing,
  isBest,
  isSelected,
  onSelect,
}: {
  pairing: PlatoonPairing;
  isBest: boolean;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        padding: 12,
        background: isSelected ? '#111827' : '#0a0f1a',
        border: `1px solid ${isBest ? '#f59e0b' : '#374151'}`,
        borderRadius: 4,
        cursor: 'pointer',
        position: 'relative',
      }}
    >
      {isBest && (
        <div style={{
          position: 'absolute',
          top: -8,
          right: 8,
          background: '#f59e0b',
          color: '#030712',
          fontSize: 8,
          fontWeight: 700,
          padding: '2px 6px',
          borderRadius: 2,
        }}>
          BEST PAIRING
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 12 }}>{pairing.position}</span>
        <span style={{
          color: pairing.platoonAdvantage > 0.020 ? '#22c55e' : '#eab308',
          fontWeight: 700,
          fontSize: 11,
        }}>
          +{(pairing.platoonAdvantage * 1000).toFixed(0)} pts
        </span>
      </div>

      {/* Two player columns */}
      <div style={{ display: 'flex', gap: 10 }}>
        {[pairing.playerA, pairing.playerB].map(player => (
          <div key={player.name} style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#d1d5db', marginBottom: 3 }}>
              {player.name}
              <span style={{ color: HAND_COLORS[player.hand], fontSize: 9, marginLeft: 4 }}>({player.hand})</span>
            </div>
            <div style={{ fontSize: 9, color: '#6b7280' }}>
              vs R: <span style={{ color: player.wOBAvsR >= 0.340 ? '#22c55e' : '#d1d5db', fontWeight: 600 }}>{player.wOBAvsR.toFixed(3)}</span>
              {' / '}
              vs L: <span style={{ color: player.wOBAvsL >= 0.340 ? '#22c55e' : '#d1d5db', fontWeight: 600 }}>{player.wOBAvsL.toFixed(3)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Combined wOBA bar */}
      <div style={{ marginTop: 8 }}>
        <WOBABar label="Combined wOBA" value={pairing.combinedWOBA} max={0.420} color="#f59e0b" />
      </div>
    </div>
  );
}

export default function PlatoonOptEngineView() {
  const data = useMemo(() => generateDemoPlatoonOpt(), []);
  const [selected, setSelected] = useState<PlatoonPairing | null>(null);

  return (
    <div style={{ padding: 18, color: '#e5e7eb', fontFamily: 'monospace', fontSize: 13, background: '#030712', minHeight: '100%' }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PLATOON OPTIMIZATION ENGINE
        <span style={{ color: '#6b7280', fontSize: 10, marginLeft: 12 }}>{data.teamName.toUpperCase()}</span>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'TOTAL ADVANTAGE', value: `+${(data.totalAdvantage * 1000).toFixed(0)} wOBA pts`, color: '#22c55e' },
          { label: 'PAIRINGS', value: String(data.pairings.length), color: '#f59e0b' },
          { label: 'AVG COMBINED wOBA', value: data.avgCombinedWOBA.toFixed(3), color: '#3b82f6' },
          { label: 'AVG INDIVIDUAL wOBA', value: data.avgIndividualWOBA.toFixed(3), color: '#9ca3af' },
          { label: 'BEST PAIR', value: data.bestPairing.position, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 16px', textAlign: 'center', minWidth: 100 }}>
            <div style={{ color: '#6b7280', fontSize: 9, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 13 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Pairing Cards Grid */}
        <div style={{ flex: '1 1 520px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {data.pairings.map(p => (
              <PairingCard
                key={p.id}
                pairing={p}
                isBest={p.id === data.bestPairing.id}
                isSelected={selected?.id === p.id}
                onSelect={() => setSelected(p)}
              />
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div style={{ flex: '1 1 300px' }}>
          {selected ? (() => {
            const { playerA, playerB } = selected;
            const maxWOBA = 0.420;

            return (
              <div className="bloomberg-border" style={{ padding: 14 }}>
                <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                  {selected.position} PLATOON
                </div>
                <div style={{ color: '#22c55e', fontWeight: 700, fontSize: 11, marginBottom: 14 }}>
                  +{(selected.platoonAdvantage * 1000).toFixed(0)} wOBA POINTS ADVANTAGE
                </div>

                {/* vs RHP Starter */}
                <div style={{
                  padding: '8px 10px',
                  background: '#111827',
                  border: '1px solid #1f2937',
                  marginBottom: 8,
                }}>
                  <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 4 }}>VS RHP STARTER</div>
                  <div style={{ color: '#d1d5db', fontWeight: 700, fontSize: 13 }}>{selected.bestVsR}</div>
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
                    wOBA vs R: <span style={{ color: '#22c55e' }}>
                      {(playerA.name === selected.bestVsR ? playerA.wOBAvsR : playerB.wOBAvsR).toFixed(3)}
                    </span>
                  </div>
                </div>

                {/* vs LHP Starter */}
                <div style={{
                  padding: '8px 10px',
                  background: '#111827',
                  border: '1px solid #1f2937',
                  marginBottom: 14,
                }}>
                  <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 4 }}>VS LHP STARTER</div>
                  <div style={{ color: '#d1d5db', fontWeight: 700, fontSize: 13 }}>{selected.bestVsL}</div>
                  <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>
                    wOBA vs L: <span style={{ color: '#3b82f6' }}>
                      {(playerA.name === selected.bestVsL ? playerA.wOBAvsL : playerB.wOBAvsL).toFixed(3)}
                    </span>
                  </div>
                </div>

                {/* wOBA Comparison Bars */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>wOBA COMPARISON</div>
                  <WOBABar label={`${playerA.name} vs R`} value={playerA.wOBAvsR} max={maxWOBA} color="#22c55e" />
                  <WOBABar label={`${playerA.name} vs L`} value={playerA.wOBAvsL} max={maxWOBA} color="#3b82f6" />
                  <div style={{ height: 6 }} />
                  <WOBABar label={`${playerB.name} vs R`} value={playerB.wOBAvsR} max={maxWOBA} color="#22c55e" />
                  <WOBABar label={`${playerB.name} vs L`} value={playerB.wOBAvsL} max={maxWOBA} color="#3b82f6" />
                  <div style={{ height: 6 }} />
                  <WOBABar label="Combined Platoon" value={selected.combinedWOBA} max={maxWOBA} color="#f59e0b" />
                </div>

                {/* PA Split */}
                <div style={{ display: 'flex', gap: 10 }}>
                  {[playerA, playerB].map(p => (
                    <div key={p.name} style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '6px 8px',
                      background: '#111827',
                      border: '1px solid #1f2937',
                    }}>
                      <div style={{ fontSize: 9, color: '#6b7280', marginBottom: 2 }}>{p.name.split(' ')[1]}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#d1d5db' }}>{p.pa}</div>
                      <div style={{ fontSize: 8, color: '#6b7280' }}>PA</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })() : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#4b5563' }}>
              Select a pairing to view platoon details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

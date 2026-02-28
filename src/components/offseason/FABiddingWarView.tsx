import { useState } from 'react';
import { generateDemoFABidding, getTierColor, getBidStatusColor, type FreeAgentTarget } from '../../engine/offseason/faBiddingWar';

const data = generateDemoFABidding();

export default function FABiddingWarView() {
  const [selectedFA, setSelectedFA] = useState<FreeAgentTarget>(data.freeAgents[0]);

  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>FREE AGENT BIDDING WAR</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>Competitive bidding dynamics, market value, and offer comparison</p>
      </div>

      {/* Budget summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'YOUR BUDGET', value: `$${data.yourBudget}M`, color: '#22c55e' },
          { label: 'LUXURY TAX SPACE', value: `$${data.luxuryTaxSpace}M`, color: data.luxuryTaxSpace < 20 ? '#ef4444' : '#f59e0b' },
          { label: 'ACTIVE TARGETS', value: String(data.freeAgents.length), color: '#3b82f6' },
          { label: 'YOUR BIDS', value: String(data.freeAgents.filter(fa => fa.currentBids.some(b => b.isYourTeam)).length), color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* FA selector */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
        {data.freeAgents.map(fa => (
          <button key={fa.playerId} onClick={() => setSelectedFA(fa)}
            style={{ padding: '4px 10px', fontSize: 11, fontFamily: 'monospace', fontWeight: 700, border: '1px solid', borderColor: selectedFA.playerId === fa.playerId ? '#f59e0b' : '#374151', background: selectedFA.playerId === fa.playerId ? '#78350f' : 'transparent', color: selectedFA.playerId === fa.playerId ? '#f59e0b' : '#9ca3af', cursor: 'pointer' }}>
            {fa.name} ({fa.position})
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Player profile */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ color: '#f59e0b', fontSize: 16, fontWeight: 700 }}>{selectedFA.name}</div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>{selectedFA.position} | Age {selectedFA.age}</div>
            </div>
            <span style={{ padding: '2px 8px', fontSize: 10, fontWeight: 700, background: getTierColor(selectedFA.marketTier) + '22', color: getTierColor(selectedFA.marketTier), border: `1px solid ${getTierColor(selectedFA.marketTier)}44` }}>
              {selectedFA.marketTier.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'WAR', value: selectedFA.war.toFixed(1), color: selectedFA.war >= 5 ? '#22c55e' : '#f59e0b' },
              { label: 'PROJ WAR', value: selectedFA.projectedWAR.toFixed(1), color: '#3b82f6' },
              { label: 'DAYS ON MKT', value: String(selectedFA.daysOnMarket), color: selectedFA.daysOnMarket > 40 ? '#ef4444' : '#e5e7eb' },
              { label: 'INTEREST', value: `${selectedFA.interest} teams`, color: '#9ca3af' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{s.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: 8, background: '#0a0f1a', border: '1px solid #1f2937', marginBottom: 12 }}>
            <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 4 }}>ASKING PRICE</div>
            <div style={{ fontSize: 13, color: '#f59e0b', fontWeight: 700 }}>
              {selectedFA.askingPrice.years} yr / ${selectedFA.askingPrice.aav}M AAV
            </div>
          </div>

          {selectedFA.leadingBid && (
            <div style={{ padding: 8, background: '#22c55e11', border: '1px solid #22c55e33' }}>
              <div style={{ fontSize: 9, color: '#22c55e', fontWeight: 700, marginBottom: 4 }}>LEADING BID</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>
                {selectedFA.leadingBid.teamName}: {selectedFA.leadingBid.years}yr / ${selectedFA.leadingBid.totalValue}M
              </div>
            </div>
          )}
        </div>

        {/* Bid comparison */}
        <div style={{ border: '1px solid #374151', background: '#111827', padding: 16 }}>
          <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>CURRENT BIDS — {selectedFA.name}</div>
          {selectedFA.currentBids.sort((a, b) => b.totalValue - a.totalValue).map(bid => (
            <div key={bid.teamId} style={{
              padding: 10, marginBottom: 6, border: '1px solid',
              borderColor: bid.isYourTeam ? '#f59e0b44' : '#1f2937',
              background: bid.isYourTeam ? '#78350f22' : '#0a0f1a',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: bid.isYourTeam ? '#f59e0b' : '#e5e7eb' }}>{bid.teamName}</span>
                  {bid.isYourTeam && <span style={{ fontSize: 9, color: '#f59e0b', marginLeft: 6 }}>(YOUR BID)</span>}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: getBidStatusColor(bid, selectedFA.leadingBid) }}>${bid.totalValue}M</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                {[
                  { label: 'YEARS', value: String(bid.years) },
                  { label: 'AAV', value: `$${bid.aav}M` },
                  { label: 'BONUS', value: `$${bid.signingBonus}M` },
                  { label: 'OPT-OUT', value: bid.optOut ? 'YES' : 'NO' },
                  { label: 'NTC', value: bid.noTrade ? 'YES' : 'NO' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 8, color: '#6b7280' }}>{s.label}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#e5e7eb' }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {selectedFA.currentBids.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: '#6b7280', fontSize: 11 }}>
              No bids yet — market is cold
            </div>
          )}
        </div>
      </div>

      {/* All FAs overview */}
      <div style={{ marginTop: 16, border: '1px solid #374151', background: '#111827', padding: 16 }}>
        <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, marginBottom: 12 }}>FREE AGENT MARKET</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #374151' }}>
              {['PLAYER', 'POS', 'AGE', 'WAR', 'TIER', 'ASK', 'TOP BID', 'BIDS', 'DAYS'].map(h => (
                <th key={h} style={{ padding: '4px 6px', color: '#6b7280', fontWeight: 700, textAlign: h === 'PLAYER' ? 'left' : 'center' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.freeAgents.map(fa => (
              <tr key={fa.playerId} onClick={() => setSelectedFA(fa)}
                style={{ borderBottom: '1px solid #1f2937', cursor: 'pointer', background: selectedFA.playerId === fa.playerId ? '#1f2937' : 'transparent' }}>
                <td style={{ padding: '4px 6px', color: '#e5e7eb', fontWeight: 600 }}>{fa.name}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#f59e0b' }}>{fa.position}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#9ca3af' }}>{fa.age}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: fa.war >= 5 ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>{fa.war.toFixed(1)}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center' }}>
                  <span style={{ padding: '1px 4px', fontSize: 9, fontWeight: 700, background: getTierColor(fa.marketTier) + '22', color: getTierColor(fa.marketTier) }}>
                    {fa.marketTier.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#e5e7eb' }}>${fa.askingPrice.aav}M</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#22c55e', fontWeight: 700 }}>
                  {fa.leadingBid ? `$${fa.leadingBid.totalValue}M` : '—'}
                </td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: '#6b7280' }}>{fa.currentBids.length}</td>
                <td style={{ padding: '4px 6px', textAlign: 'center', color: fa.daysOnMarket > 40 ? '#ef4444' : '#9ca3af' }}>{fa.daysOnMarket}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * MiLBAwardTrackerView — Minor League Award Races & History
 *
 * Bloomberg-terminal style dashboard tracking MiLB awards across
 * all levels: current race leaders, historical winners, and org history.
 */
import { useState, useMemo } from 'react';
import {
  generateDemoMiLBAwards,
  LEVELS,
  AWARD_CATEGORIES,
  LEVEL_COLORS,
  CATEGORY_ICONS,
  formatAvg,
  formatERA,
  getCategoryColor,
  type MiLBAwardData,
  type AwardRace,
  type AwardCandidate,
  type MiLBLevel,
  type AwardCategory,
  type PastWinner,
} from '../../engine/minors/milbAwardTracker';

// ── Styles ───────────────────────────────────────────────────────────────────

const S = {
  page: {
    padding: 18,
    color: '#e5e7eb',
    fontFamily: "'IBM Plex Mono', 'Fira Code', monospace",
    fontSize: 12,
    background: '#030712',
    minHeight: '100%',
  },
  header: {
    background: '#111827',
    borderBottom: '1px solid #374151',
    padding: '8px 18px',
    marginBottom: 16,
    marginLeft: -18,
    marginRight: -18,
    marginTop: -18,
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    fontWeight: 700,
    fontSize: 13,
    color: '#f59e0b',
    letterSpacing: 1,
  },
  panel: {
    background: '#111827',
    border: '1px solid #374151',
    borderRadius: 4,
    marginBottom: 14,
  },
  panelHeader: {
    padding: '6px 12px',
    borderBottom: '1px solid #374151',
    fontSize: 10,
    fontWeight: 700,
    color: '#9ca3af',
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  statBox: {
    background: '#111827',
    border: '1px solid #374151',
    borderRadius: 4,
    padding: '8px 14px',
    minWidth: 100,
    textAlign: 'center' as const,
  },
  statLabel: { color: '#6b7280', fontSize: 9, letterSpacing: 0.5, marginBottom: 2, textTransform: 'uppercase' as const },
  statValue: { fontSize: 18, fontWeight: 700 },
  muted: { color: '#6b7280' },
  btn: (active: boolean) => ({
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 700,
    fontFamily: 'monospace',
    border: active ? '1px solid #f59e0b' : '1px solid #374151',
    borderRadius: 3,
    background: active ? '#f59e0b' : 'transparent',
    color: active ? '#030712' : '#9ca3af',
    cursor: 'pointer' as const,
  }),
  levelBadge: (level: MiLBLevel) => ({
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: 3,
    fontSize: 10,
    fontWeight: 700,
    color: '#030712',
    background: LEVEL_COLORS[level],
    letterSpacing: 0.5,
  }),
  catBadge: (cat: AwardCategory) => ({
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 700,
    color: getCategoryColor(cat),
    background: getCategoryColor(cat) + '22',
    letterSpacing: 0.5,
  }),
  prospectBadge: {
    display: 'inline-block',
    padding: '1px 5px',
    borderRadius: 3,
    fontSize: 8,
    fontWeight: 700,
    color: '#f59e0b',
    background: '#f59e0b22',
    marginLeft: 4,
  },
} as const;

// ── Stat formatter helper ────────────────────────────────────────────────────

function formatCandidateStats(c: AwardCandidate, cat: AwardCategory): string {
  const s = c.stats;
  if (cat === 'Pitcher of the Year' || cat === 'Reliever of the Year') {
    const parts: string[] = [];
    if (s.wins !== undefined) parts.push(`${s.wins}-${s.losses}`);
    if (s.era !== undefined) parts.push(`${formatERA(s.era)} ERA`);
    if (s.strikeouts !== undefined) parts.push(`${s.strikeouts} K`);
    if (s.saves !== undefined && s.saves > 0) parts.push(`${s.saves} SV`);
    if (s.whip !== undefined) parts.push(`${s.whip.toFixed(2)} WHIP`);
    return parts.join(' / ');
  }
  if (cat === 'Batting Champion') {
    return `${formatAvg(s.avg ?? 0)} AVG / ${s.obp?.toFixed(3)} OBP / ${s.slg?.toFixed(3)} SLG`;
  }
  // MVP, ROY
  const parts: string[] = [];
  if (s.avg !== undefined) parts.push(formatAvg(s.avg));
  if (s.hr !== undefined) parts.push(`${s.hr} HR`);
  if (s.rbi !== undefined) parts.push(`${s.rbi} RBI`);
  if (s.war !== undefined) parts.push(`${s.war} WAR`);
  return parts.join(' / ');
}

// ── Race Card Component ──────────────────────────────────────────────────────

function RaceCard({ race, onSelectCandidate }: {
  race: AwardRace;
  onSelectCandidate: (c: AwardCandidate) => void;
}) {
  const leader = race.leaders[0];
  if (!leader) return null;

  return (
    <div style={S.panel}>
      <div style={S.panelHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={S.levelBadge(race.level)}>{race.level}</span>
          <span style={S.catBadge(race.category)}>
            {CATEGORY_ICONS[race.category]} {race.category.toUpperCase()}
          </span>
        </div>
        <span style={{ fontSize: 9, color: race.isFinal ? '#22c55e' : '#6b7280' }}>
          {race.isFinal ? 'FINAL' : `${race.gamesRemaining} GAMES LEFT`}
        </span>
      </div>

      <div style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1f2937' }}>
              <th style={{ padding: '5px 8px', textAlign: 'center', color: '#6b7280', fontSize: 9, width: 28 }}>#</th>
              <th style={{ padding: '5px 8px', textAlign: 'left', color: '#6b7280', fontSize: 9 }}>PLAYER</th>
              <th style={{ padding: '5px 8px', textAlign: 'left', color: '#6b7280', fontSize: 9 }}>TEAM</th>
              <th style={{ padding: '5px 8px', textAlign: 'left', color: '#6b7280', fontSize: 9 }}>STATS</th>
              <th style={{ padding: '5px 8px', textAlign: 'center', color: '#6b7280', fontSize: 9, width: 50 }}>SCORE</th>
            </tr>
          </thead>
          <tbody>
            {race.leaders.map((c, i) => {
              const isLeader = i === 0;
              return (
                <tr
                  key={c.playerId}
                  onClick={() => onSelectCandidate(c)}
                  style={{
                    borderBottom: '1px solid #0f1629',
                    cursor: 'pointer',
                    background: isLeader ? 'rgba(245,158,11,0.05)' : 'transparent',
                  }}
                >
                  <td style={{
                    padding: '5px 8px',
                    textAlign: 'center',
                    color: isLeader ? '#f59e0b' : '#6b7280',
                    fontWeight: isLeader ? 700 : 400,
                  }}>
                    {i + 1}
                  </td>
                  <td style={{ padding: '5px 8px' }}>
                    <span style={{ color: isLeader ? '#f59e0b' : '#e5e7eb', fontWeight: isLeader ? 700 : 400 }}>
                      {c.name}
                    </span>
                    {c.isOrgProspect && (
                      <span style={S.prospectBadge}>ORG</span>
                    )}
                    {c.topProspectRank && (
                      <span style={{ ...S.prospectBadge, color: '#22c55e', background: '#22c55e22' }}>
                        #{c.topProspectRank}
                      </span>
                    )}
                    <div style={{ fontSize: 9, color: '#6b7280' }}>{c.position} | Age {c.age}</div>
                  </td>
                  <td style={{ padding: '5px 8px', color: '#9ca3af', fontSize: 10 }}>{c.team}</td>
                  <td style={{ padding: '5px 8px', color: '#d1d5db', fontSize: 10, fontFamily: 'monospace' }}>
                    {formatCandidateStats(c, race.category)}
                  </td>
                  <td style={{
                    padding: '5px 8px',
                    textAlign: 'center',
                    fontWeight: 700,
                    color: c.awardScore >= 80 ? '#22c55e' : c.awardScore >= 60 ? '#f59e0b' : '#9ca3af',
                  }}>
                    {c.awardScore}
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

// ── Past Winners Table ───────────────────────────────────────────────────────

function PastWinnersTable({ winners, levelFilter, catFilter }: {
  winners: PastWinner[];
  levelFilter: MiLBLevel | 'ALL';
  catFilter: AwardCategory | 'ALL';
}) {
  const filtered = winners.filter(w =>
    (levelFilter === 'ALL' || w.level === levelFilter) &&
    (catFilter === 'ALL' || w.category === catFilter)
  );

  if (filtered.length === 0) {
    return <div style={{ padding: 16, textAlign: 'center', color: '#6b7280', fontSize: 11 }}>No records found.</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #374151' }}>
            {['YEAR', 'LEVEL', 'AWARD', 'PLAYER', 'POS', 'TEAM', 'KEY STATS', 'MLB DEST', 'MLB WAR'].map(h => (
              <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: '#6b7280', fontSize: 9, whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.map((w, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #0f1629' }}>
              <td style={{ padding: '5px 8px', color: '#f59e0b', fontWeight: 700 }}>{w.year}</td>
              <td style={{ padding: '5px 8px' }}><span style={S.levelBadge(w.level)}>{w.level}</span></td>
              <td style={{ padding: '5px 8px' }}><span style={S.catBadge(w.category)}>{CATEGORY_ICONS[w.category]}</span></td>
              <td style={{ padding: '5px 8px', color: '#e5e7eb', fontWeight: 600 }}>
                {w.name}
                {w.isOrgProspect && <span style={S.prospectBadge}>ORG</span>}
              </td>
              <td style={{ padding: '5px 8px', color: '#9ca3af' }}>{w.position}</td>
              <td style={{ padding: '5px 8px', color: '#9ca3af', fontSize: 10 }}>{w.team}</td>
              <td style={{ padding: '5px 8px', color: '#d1d5db', fontFamily: 'monospace', fontSize: 10 }}>{w.keyStats}</td>
              <td style={{ padding: '5px 8px', color: w.eventualMLBTeam ? '#22c55e' : '#374151', fontWeight: 600 }}>
                {w.eventualMLBTeam ?? '--'}
              </td>
              <td style={{
                padding: '5px 8px',
                color: w.mlbCareerWAR !== null
                  ? (w.mlbCareerWAR >= 10 ? '#22c55e' : w.mlbCareerWAR >= 3 ? '#f59e0b' : '#9ca3af')
                  : '#374151',
                fontWeight: 600,
              }}>
                {w.mlbCareerWAR !== null ? w.mlbCareerWAR.toFixed(1) : '--'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Org History Table ────────────────────────────────────────────────────────

function OrgHistoryTable({ history }: { history: MiLBAwardData['orgAwardHistory'] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #374151' }}>
            {['YEAR', 'PLAYER', 'LEVEL', 'AWARD', 'KEY STATS', 'CURRENT STATUS'].map(h => (
              <th key={h} style={{ padding: '5px 8px', textAlign: 'left', color: '#6b7280', fontSize: 9 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {history.map((h, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #0f1629' }}>
              <td style={{ padding: '5px 8px', color: '#f59e0b', fontWeight: 700 }}>{h.year}</td>
              <td style={{ padding: '5px 8px', color: '#e5e7eb', fontWeight: 600 }}>{h.playerName}</td>
              <td style={{ padding: '5px 8px' }}><span style={S.levelBadge(h.level)}>{h.level}</span></td>
              <td style={{ padding: '5px 8px' }}><span style={S.catBadge(h.category)}>{CATEGORY_ICONS[h.category]}</span></td>
              <td style={{ padding: '5px 8px', color: '#d1d5db', fontFamily: 'monospace', fontSize: 10 }}>{h.keyStats}</td>
              <td style={{
                padding: '5px 8px',
                color: h.currentStatus.includes('MLB') ? '#22c55e' :
                  h.currentStatus === 'Retired' ? '#6b7280' : '#9ca3af',
                fontWeight: 600,
                fontSize: 10,
              }}>
                {h.currentStatus}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Candidate Detail Modal ───────────────────────────────────────────────────

function CandidateDetail({ candidate, category, onClose }: {
  candidate: AwardCandidate;
  category: AwardCategory;
  onClose: () => void;
}) {
  const s = candidate.stats;
  const isPitcher = category === 'Pitcher of the Year' || category === 'Reliever of the Year';

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: '#111827',
        border: '1px solid #374151',
        borderRadius: 6,
        padding: 20,
        maxWidth: 500,
        width: '90%',
        fontFamily: 'monospace',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ color: '#f59e0b', fontSize: 16, fontWeight: 700 }}>{candidate.name}</div>
            <div style={{ color: '#6b7280', fontSize: 10 }}>
              {candidate.position} | Age {candidate.age} | {candidate.team}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid #374151', color: '#9ca3af',
            borderRadius: 3, padding: '2px 8px', cursor: 'pointer', fontFamily: 'monospace',
          }}>X</button>
        </div>

        {candidate.isOrgProspect && (
          <div style={{
            padding: '4px 10px', marginBottom: 12, borderRadius: 3,
            background: '#f59e0b22', border: '1px solid #f59e0b44',
            fontSize: 10, color: '#f59e0b',
          }}>
            ORG PROSPECT {candidate.topProspectRank ? `| RANK #${candidate.topProspectRank}` : ''}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          {isPitcher ? (
            <>
              {[
                { label: 'W-L', value: `${s.wins}-${s.losses}` },
                { label: 'ERA', value: formatERA(s.era ?? 0), color: (s.era ?? 5) < 3.00 ? '#22c55e' : '#e5e7eb' },
                { label: 'IP', value: s.innings?.toFixed(1) },
                { label: 'K', value: s.strikeouts },
                { label: 'WHIP', value: s.whip?.toFixed(2), color: (s.whip ?? 2) < 1.10 ? '#22c55e' : '#e5e7eb' },
                { label: 'FIP', value: s.fip?.toFixed(2) },
                ...(s.saves !== undefined && s.saves > 0 ? [{ label: 'SV', value: s.saves, color: '#a855f7' }] : []),
              ].map(st => (
                <div key={st.label} style={{ textAlign: 'center', minWidth: 50 }}>
                  <div style={{ fontSize: 8, color: '#6b7280' }}>{st.label}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: st.color ?? '#e5e7eb' }}>{st.value}</div>
                </div>
              ))
              }
            </>
          ) : (
            <>
              {[
                { label: 'GP', value: s.gamesPlayed },
                { label: 'AVG', value: formatAvg(s.avg ?? 0), color: (s.avg ?? 0) >= 0.300 ? '#22c55e' : '#e5e7eb' },
                { label: 'HR', value: s.hr },
                { label: 'RBI', value: s.rbi },
                { label: 'OBP', value: s.obp?.toFixed(3) },
                { label: 'SLG', value: s.slg?.toFixed(3) },
                { label: 'OPS', value: s.ops?.toFixed(3), color: (s.ops ?? 0) >= 0.900 ? '#22c55e' : '#e5e7eb' },
                { label: 'SB', value: s.sb },
                { label: 'WAR', value: s.war?.toFixed(1), color: (s.war ?? 0) >= 4 ? '#22c55e' : '#e5e7eb' },
              ].map(st => (
                <div key={st.label} style={{ textAlign: 'center', minWidth: 45 }}>
                  <div style={{ fontSize: 8, color: '#6b7280' }}>{st.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: st.color ?? '#e5e7eb' }}>{st.value}</div>
                </div>
              ))
              }
            </>
          )}
        </div>

        <div style={{
          padding: '6px 10px', borderRadius: 3, background: '#030712', border: '1px solid #1f2937',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 10, color: '#6b7280' }}>AWARD SCORE</span>
          <span style={{
            fontSize: 20, fontWeight: 700,
            color: candidate.awardScore >= 80 ? '#22c55e' : candidate.awardScore >= 60 ? '#f59e0b' : '#9ca3af',
          }}>{candidate.awardScore}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main View ────────────────────────────────────────────────────────────────

export default function MiLBAwardTrackerView() {
  const data = useMemo(() => generateDemoMiLBAwards(), []);
  const [tab, setTab] = useState<'races' | 'history' | 'org'>('races');
  const [levelFilter, setLevelFilter] = useState<MiLBLevel | 'ALL'>('ALL');
  const [catFilter, setCatFilter] = useState<AwardCategory | 'ALL'>('ALL');
  const [selectedCandidate, setSelectedCandidate] = useState<{ c: AwardCandidate; cat: AwardCategory } | null>(null);

  const filteredRaces = useMemo(() => {
    return data.currentRaces.filter(r =>
      (levelFilter === 'ALL' || r.level === levelFilter) &&
      (catFilter === 'ALL' || r.category === catFilter)
    );
  }, [data.currentRaces, levelFilter, catFilter]);

  // Count org prospects leading races
  const orgLeaders = data.currentRaces.filter(r => r.leaders[0]?.isOrgProspect).length;
  const totalRaces = data.currentRaces.length;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <span>MiLB AWARD TRACKER</span>
        <span style={{ color: '#6b7280', fontSize: 10, fontWeight: 400 }}>
          WAVE 71 | {data.seasonYear} SEASON
        </span>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'ACTIVE RACES', value: totalRaces, color: '#f59e0b' },
          { label: 'ORG LEADERS', value: orgLeaders, color: '#22c55e' },
          { label: 'LEVELS', value: LEVELS.length, color: '#3b82f6' },
          { label: 'CATEGORIES', value: AWARD_CATEGORIES.length, color: '#a855f7' },
          { label: 'GAMES REM', value: data.currentRaces[0]?.gamesRemaining ?? 0, color: '#e5e7eb' },
          { label: 'HISTORICAL', value: data.pastWinners.length, color: '#6b7280' },
        ].map(s => (
          <div key={s.label} style={S.statBox}>
            <div style={S.statLabel}>{s.label}</div>
            <div style={{ ...S.statValue, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[
          { key: 'races' as const, label: 'CURRENT RACES' },
          { key: 'history' as const, label: 'PAST WINNERS' },
          { key: 'org' as const, label: 'ORG HISTORY' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={S.btn(tab === t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters (for races and history tabs) */}
      {(tab === 'races' || tab === 'history') && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, color: '#6b7280', letterSpacing: 0.5 }}>LEVEL:</span>
            {(['ALL', ...LEVELS] as const).map(l => (
              <button key={l} onClick={() => setLevelFilter(l)} style={{
                padding: '2px 8px',
                fontSize: 10,
                fontWeight: 700,
                fontFamily: 'monospace',
                border: levelFilter === l ? `1px solid ${l === 'ALL' ? '#f59e0b' : LEVEL_COLORS[l as MiLBLevel]}` : '1px solid #374151',
                borderRadius: 3,
                background: levelFilter === l ? (l === 'ALL' ? '#f59e0b' : LEVEL_COLORS[l as MiLBLevel]) : 'transparent',
                color: levelFilter === l ? '#030712' : '#9ca3af',
                cursor: 'pointer',
              }}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, color: '#6b7280', letterSpacing: 0.5 }}>AWARD:</span>
            <button onClick={() => setCatFilter('ALL')} style={{
              padding: '2px 8px', fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
              border: catFilter === 'ALL' ? '1px solid #f59e0b' : '1px solid #374151', borderRadius: 3,
              background: catFilter === 'ALL' ? '#f59e0b' : 'transparent',
              color: catFilter === 'ALL' ? '#030712' : '#9ca3af', cursor: 'pointer',
            }}>ALL</button>
            {AWARD_CATEGORIES.map(c => (
              <button key={c} onClick={() => setCatFilter(c)} style={{
                padding: '2px 8px', fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
                border: catFilter === c ? `1px solid ${getCategoryColor(c)}` : '1px solid #374151', borderRadius: 3,
                background: catFilter === c ? getCategoryColor(c) : 'transparent',
                color: catFilter === c ? '#030712' : '#9ca3af', cursor: 'pointer',
              }}>
                {CATEGORY_ICONS[c]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Races */}
      {tab === 'races' && (
        <div>
          {filteredRaces.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>No races match filters.</div>
          ) : (
            filteredRaces.map((race, i) => (
              <RaceCard
                key={`${race.level}-${race.category}-${i}`}
                race={race}
                onSelectCandidate={(c) => setSelectedCandidate({ c, cat: race.category })}
              />
            ))
          )}
        </div>
      )}

      {/* Past Winners */}
      {tab === 'history' && (
        <div style={S.panel}>
          <div style={S.panelHeader}>
            <span>HISTORICAL AWARD WINNERS</span>
            <span style={{ fontSize: 9, color: '#6b7280' }}>{data.pastWinners.length} RECORDS</span>
          </div>
          <PastWinnersTable winners={data.pastWinners} levelFilter={levelFilter} catFilter={catFilter} />
        </div>
      )}

      {/* Org History */}
      {tab === 'org' && (
        <div style={S.panel}>
          <div style={S.panelHeader}>
            <span>ORGANIZATION PROSPECT AWARD HISTORY</span>
            <span style={{ fontSize: 9, color: '#6b7280' }}>{data.orgAwardHistory.length} ENTRIES</span>
          </div>
          <OrgHistoryTable history={data.orgAwardHistory} />
        </div>
      )}

      {/* Candidate detail modal */}
      {selectedCandidate && (
        <CandidateDetail
          candidate={selectedCandidate.c}
          category={selectedCandidate.cat}
          onClose={() => setSelectedCandidate(null)}
        />
      )}
    </div>
  );
}

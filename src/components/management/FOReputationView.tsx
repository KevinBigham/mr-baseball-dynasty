/**
 * FOReputationView – Front Office Reputation dashboard
 *
 * Bloomberg-terminal style reputation gauge, factor breakdown bars,
 * perception indicators, trend arrows, and historical comparison chart.
 */
import { useState, useMemo } from 'react';
import {
  generateDemoFORep,
  getGrade,
  getGradeColor,
  getTrendArrow,
  getTrendColor,
  getPerceptionLabel,
  getPerceptionColor,
  type FORepProfile,
  type ReputationFactor,
} from '../../engine/management/frontOfficeReputation';

const PANEL = '#111827';
const BORDER = '#374151';
const BG = '#030712';
const ACCENT = '#f59e0b';
const DIM = '#6b7280';
const TEXT = '#e5e7eb';

type ViewTab = 'overview' | 'history';

export default function FOReputationView() {
  const profile = useMemo(() => generateDemoFORep(), []);
  const [tab, setTab] = useState<ViewTab>('overview');

  return (
    <div style={{ padding: 18, color: TEXT, fontFamily: 'monospace', fontSize: 13, background: BG, minHeight: '100%' }}>
      <div style={{
        fontSize: 14, fontWeight: 700, letterSpacing: 1.5, color: ACCENT,
        borderBottom: `1px solid ${BORDER}`, paddingBottom: 8, marginBottom: 14,
      }}>
        FRONT OFFICE REPUTATION — {profile.gmName.toUpperCase()}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {(['overview', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: tab === t ? ACCENT : PANEL,
              color: tab === t ? BG : TEXT,
              border: `1px solid ${tab === t ? ACCENT : BORDER}`,
              padding: '5px 14px', fontSize: 11, fontFamily: 'monospace',
              fontWeight: tab === t ? 700 : 400, cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab profile={profile} />}
      {tab === 'history' && <HistoryTab profile={profile} />}
    </div>
  );
}

/* ── Overview Tab ─────────────────────────────────────────────────────── */

function OverviewTab({ profile }: { profile: FORepProfile }) {
  return (
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      {/* Left column */}
      <div style={{ flex: '1 1 360px' }}>
        {/* Overall gauge */}
        <div style={{
          background: PANEL, border: `1px solid ${BORDER}`, padding: 16, marginBottom: 14,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: DIM, marginBottom: 4 }}>OVERALL REPUTATION</div>
          <div style={{ fontSize: 42, fontWeight: 700, color: ACCENT }}>{profile.overallRep}</div>
          <div style={{
            display: 'inline-block', padding: '3px 12px', marginTop: 6,
            fontSize: 16, fontWeight: 700,
            background: getGradeColor(profile.grade) + '22',
            color: getGradeColor(profile.grade),
            border: `1px solid ${getGradeColor(profile.grade)}44`,
          }}>
            {profile.grade}
          </div>
          <div style={{ marginTop: 8 }}>
            {/* Gauge bar */}
            <div style={{ height: 8, background: '#1f2937', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${profile.overallRep}%`,
                background: `linear-gradient(90deg, #ef4444 0%, ${ACCENT} 50%, #22c55e 100%)`,
                borderRadius: 4,
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: DIM, marginTop: 2 }}>
              <span>0</span><span>50</span><span>100</span>
            </div>
          </div>
          <div style={{ fontSize: 10, color: DIM, marginTop: 6 }}>
            {profile.teamName} &middot; {profile.tenure} year tenure
          </div>
        </div>

        {/* Factor breakdown */}
        <div style={{
          background: PANEL, border: `1px solid ${BORDER}`, padding: 14,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 10 }}>
            COMPETENCY BREAKDOWN
          </div>
          {profile.factors.map((f: ReputationFactor) => (
            <div key={f.name} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: TEXT }}>{f.name}</span>
                <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: getTrendColor(f.trend), fontSize: 10 }}>
                    {getTrendArrow(f.trend)}
                  </span>
                  <span style={{ fontWeight: 700, color: getGradeColor(getGrade(f.score)) }}>
                    {f.score}
                  </span>
                  <span style={{ color: DIM, fontSize: 10 }}>
                    {getGrade(f.score)}
                  </span>
                </span>
              </div>
              {/* Horizontal bar */}
              <div style={{ height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${f.score}%`, borderRadius: 3,
                  background: getGradeColor(getGrade(f.score)),
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ fontSize: 9, color: DIM, marginTop: 2 }}>{f.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right column */}
      <div style={{ flex: '0 0 260px' }}>
        {/* Perception indicators */}
        <div style={{
          background: PANEL, border: `1px solid ${BORDER}`, padding: 14, marginBottom: 14,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 10 }}>
            PERCEPTION
          </div>
          {[
            { label: 'League', score: profile.leaguePerception },
            { label: 'Media', score: profile.mediaPerception },
            { label: 'Players', score: profile.playerPerception },
          ].map(p => (
            <div key={p.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: TEXT }}>{p.label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: getPerceptionColor(p.score) }}>
                  {p.score}
                </span>
              </div>
              <div style={{ height: 5, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${p.score}%`, borderRadius: 3,
                  background: getPerceptionColor(p.score),
                }} />
              </div>
              <div style={{ fontSize: 9, color: DIM, marginTop: 2 }}>
                {getPerceptionLabel(p.score)}
              </div>
            </div>
          ))}
        </div>

        {/* Headline */}
        <div style={{
          background: PANEL, border: `1px solid ${BORDER}`, padding: 14,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 6 }}>
            ASSESSMENT
          </div>
          <div style={{ fontSize: 11, color: '#d1d5db', lineHeight: 1.6 }}>
            {profile.headline}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── History Tab ──────────────────────────────────────────────────────── */

function HistoryTab({ profile }: { profile: FORepProfile }) {
  const maxRep = Math.max(...profile.history.map(h => h.overallRep), 100);
  const barMaxW = 200;

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{
        background: PANEL, border: `1px solid ${BORDER}`, padding: 16,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 12 }}>
          HISTORICAL REPUTATION — {profile.gmName.toUpperCase()}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, color: DIM }}>
              <th style={{ textAlign: 'left', padding: 6 }}>Season</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Rep</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Bar</th>
              <th style={{ textAlign: 'center', padding: 6 }}>W-L</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Playoffs</th>
            </tr>
          </thead>
          <tbody>
            {profile.history.map(h => {
              const grade = getGrade(h.overallRep);
              const barW = (h.overallRep / maxRep) * barMaxW;
              return (
                <tr key={h.season} style={{ borderBottom: `1px solid #1f2937` }}>
                  <td style={{ padding: 6, fontWeight: 700, color: TEXT }}>{h.season}</td>
                  <td style={{ padding: 6, textAlign: 'center', fontWeight: 700, color: getGradeColor(grade) }}>
                    {h.overallRep}
                  </td>
                  <td style={{ padding: 6 }}>
                    <div style={{
                      height: 10, width: barW, borderRadius: 3,
                      background: getGradeColor(grade),
                    }} />
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#d1d5db' }}>
                    {h.wins}-{h.losses}
                  </td>
                  <td style={{ padding: 6, textAlign: 'center' }}>
                    <span style={{
                      color: h.playoffAppearance ? '#22c55e' : '#4b5563',
                      fontWeight: 700,
                    }}>
                      {h.playoffAppearance ? 'YES' : 'NO'}
                    </span>
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

/**
 * DepthChart.tsx — Premium depth chart with baseball diamond field view.
 *
 * Visual centerpiece of the Team tab. Features:
 * - Baseball diamond with positioned player cards on a dark-green field gradient
 * - Refined batting order with slot badges and accent borders
 * - Pitching staff with role badges (ACE, CLOSER, SETUP, MR)
 * - Click-two-to-swap editing with orange glow pulse
 */

import { useState, useEffect, useCallback } from 'react';
import type { RosterPlayer } from '../../types/league';
import { getEngine } from '../../engine/engineClient';
import { OVRBadge } from './RosterCards';
import AgingBadge from '../shared/AgingBadge';
import { SortableList, SortableItem } from '../ui/sortable';
import { arrayMove } from '@dnd-kit/sortable';

// ─── Grade color helper ──────────────────────────────────────────────────────

function gradeColor(ovr: number): string {
  const g = Math.round(20 + (ovr / 550) * 60);
  if (g >= 70) return '#22C55E';
  if (g >= 60) return '#38BDF8';
  if (g >= 50) return '#E2E8F0';
  if (g >= 40) return '#F59E0B';
  return '#F43F5E';
}

function toScout(ovr: number): number {
  return Math.round(20 + (ovr / 550) * 60);
}

// ─── Position coordinates on the diamond (percentage-based) ──────────────────

const FIELD_POSITIONS: Record<string, { left: string; top: string }> = {
  LF:  { left: '18%', top: '10%' },
  CF:  { left: '50%', top: '3%' },
  RF:  { left: '82%', top: '10%' },
  '3B': { left: '18%', top: '48%' },
  SS:  { left: '38%', top: '40%' },
  '2B': { left: '62%', top: '40%' },
  '1B': { left: '82%', top: '48%' },
  SP:  { left: '50%', top: '58%' },
  C:   { left: '50%', top: '78%' },
  DH:  { left: '50%', top: '93%' },
};

// ─── Role badge styling ─────────────────────────────────────────────────────

const ROLE_STYLE: Record<string, { bg: string; text: string }> = {
  ACE:    { bg: 'rgba(249,115,22,0.15)', text: '#f97316' },
  SP2:    { bg: 'rgba(56,189,248,0.1)',  text: '#38BDF8' },
  SP3:    { bg: 'rgba(56,189,248,0.1)',  text: '#38BDF8' },
  SP4:    { bg: 'rgba(56,189,248,0.08)', text: '#60a5fa' },
  SP5:    { bg: 'rgba(56,189,248,0.06)', text: '#7dd3fc' },
  CL:     { bg: 'rgba(244,63,94,0.12)',  text: '#F43F5E' },
  SU:     { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B' },
  MR:     { bg: 'rgba(100,116,139,0.1)', text: '#64748B' },
};

// ─── Field Position Card ────────────────────────────────────────────────────

function FieldCard({ position, players, onClickPlayer, selected, onSelect }: {
  position: string;
  players: RosterPlayer[];
  onClickPlayer?: (id: number) => void;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const starter = players[0];
  const coords = FIELD_POSITIONS[position];
  if (!coords) return null;

  const handleClick = () => {
    if (onSelect) onSelect();
    else if (starter && onClickPlayer) onClickPlayer(starter.playerId);
  };

  return (
    <div
      className={`depth-card ${selected ? 'depth-selected' : ''} ${starter ? 'cursor-pointer' : ''}`}
      style={{ left: coords.left, top: coords.top }}
      onClick={handleClick}
    >
      {/* Position label */}
      <div className="text-[9px] font-bold tracking-[0.2em] mb-1" style={{ color: '#A7B3C7' }}>
        {position}
      </div>

      {starter ? (
        <>
          {/* OVR circle */}
          <div
            className="mx-auto w-8 h-8 sm:w-9 sm:h-9 rounded-full border-[1.5px] flex items-center justify-center font-bold text-[11px] tabular-nums"
            style={{
              borderColor: gradeColor(starter.overall),
              backgroundColor: `${gradeColor(starter.overall)}12`,
              boxShadow: `0 0 6px ${gradeColor(starter.overall)}25`,
              color: gradeColor(starter.overall),
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {toScout(starter.overall)}
          </div>

          {/* Name */}
          <div className="mt-0.5 text-[10px] font-bold truncate max-w-[70px] sm:max-w-[85px]"
               style={{ color: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {starter.name.split(' ').pop()}
          </div>

          {/* Age + Phase */}
          <div className="flex items-center justify-center gap-0.5">
            <span className="text-[8px]" style={{ color: '#64748B' }}>{starter.age}</span>
            <AgingBadge age={starter.age} position={starter.position} compact />
          </div>
        </>
      ) : (
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-dashed border-gray-700 flex items-center justify-center mx-auto">
          <span className="text-[8px] text-gray-700">—</span>
        </div>
      )}
    </div>
  );
}

// ─── Lineup Card ─────────────────────────────────────────────────────────────

function LineupCard({ player, slot, selected, onSelect }: {
  player: RosterPlayer;
  slot: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const avg = typeof player.stats.avg === 'number'
    ? player.stats.avg.toFixed(3).replace('0.', '.')
    : (player.stats.avg ?? '—');
  const slotClass = slot <= 3 ? 'lineup-slot-top' : slot <= 6 ? 'lineup-slot-mid' : 'lineup-slot-bot';
  const bgClass = selected
    ? 'bg-orange-950/20'
    : slot % 2 === 0
    ? 'bg-[#0F1930]/50'
    : 'bg-transparent';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded cursor-pointer transition-all hover:bg-[#142447]/40 ${slotClass} ${bgClass} ${selected ? 'depth-selected' : ''}`}
      onClick={onSelect}
    >
      {/* Slot number badge */}
      <div
        className="w-7 h-7 rounded flex items-center justify-center font-extrabold text-xs shrink-0"
        style={{
          backgroundColor: slot <= 3 ? 'rgba(249,115,22,0.15)' : slot <= 6 ? 'rgba(56,189,248,0.1)' : 'rgba(59,74,107,0.2)',
          color: slot <= 3 ? '#f97316' : slot <= 6 ? '#38BDF8' : '#64748B',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {slot}
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate" style={{ color: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif' }}>
          {player.name}
        </div>
        <div className="text-[10px]" style={{ color: '#64748B' }}>
          {player.position} | Age {player.age}
        </div>
      </div>

      {/* Stats cluster */}
      <div className="flex items-center gap-3 shrink-0">
        <OVRBadge ovr={player.overall} size="small" />
        <span className="text-xs tabular-nums" style={{ color: '#A7B3C7' }}>{avg}</span>
        <span className="text-[10px] tabular-nums" style={{ color: '#64748B' }}>{player.stats.hr ?? 0} HR</span>
      </div>
    </div>
  );
}

// ─── Pitching Card ───────────────────────────────────────────────────────────

function PitchingCard({ player, role, onClickPlayer, selected, onSelect }: {
  player: RosterPlayer;
  role: string;
  onClickPlayer?: (id: number) => void;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const roleStyle = ROLE_STYLE[role] ?? ROLE_STYLE.MR;
  const era = player.isPitcher
    ? (typeof player.stats.era === 'number' ? player.stats.era.toFixed(2) : (player.stats.era ?? '—'))
    : '—';
  const eraNum = typeof player.stats.era === 'number' ? player.stats.era : 99;
  const eraColor = eraNum <= 3.0 ? '#22C55E' : eraNum <= 4.0 ? '#E2E8F0' : eraNum <= 5.0 ? '#F59E0B' : '#F43F5E';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded cursor-pointer transition-all hover:bg-[#142447]/40 ${selected ? 'depth-selected' : ''}`}
      style={{ backgroundColor: 'rgba(15,25,48,0.3)', border: '1px solid rgba(30,42,74,0.3)' }}
      onClick={() => onSelect ? onSelect() : onClickPlayer?.(player.playerId)}
    >
      {/* OVR */}
      <OVRBadge ovr={player.overall} size="small" />

      {/* Role badge */}
      <span
        className="px-2 py-0.5 rounded text-[9px] font-bold tracking-wider shrink-0"
        style={{ backgroundColor: roleStyle.bg, color: roleStyle.text }}
      >
        {role === 'CL' ? 'CLOSER' : role === 'SU' ? 'SETUP' : role === 'MR' ? 'MIDDLE' : role}
      </span>

      {/* Name */}
      <span className="text-sm font-bold truncate flex-1" style={{ color: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif' }}>
        {player.name}
      </span>

      {/* ERA + Record */}
      <div className="text-right shrink-0">
        <div className="text-sm font-bold tabular-nums" style={{ color: eraColor }}>
          {era}
        </div>
        <div className="text-[9px] tabular-nums" style={{ color: '#64748B' }}>
          {player.stats.w ?? 0}-{player.stats.l ?? 0}
          {role === 'CL' || role === 'SU' ? ` | ${player.stats.sv ?? 0} SV` : ''}
        </div>
      </div>
    </div>
  );
}

// ─── Main Depth Chart ─────────────────────────────────────────────────────────

export default function DepthChart({ players, onClickPlayer, editable }: {
  players: RosterPlayer[];
  onClickPlayer?: (id: number) => void;
  editable?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [lineupIds, setLineupIds] = useState<number[]>([]);
  const [rotationIds, setRotationIds] = useState<number[]>([]);
  const [selectedLineupIdx, setSelectedLineupIdx] = useState<number | null>(null);
  const [selectedRotationIdx, setSelectedRotationIdx] = useState<number | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Load current lineup/rotation order from engine
  useEffect(() => {
    if (!editable) return;
    (async () => {
      const tid = await getEngine().getUserTeamId();
      const [lineup, rotation] = await Promise.all([
        getEngine().getLineupOrder(tid),
        getEngine().getRotationOrder(tid),
      ]);
      if (lineup.length > 0) setLineupIds(lineup);
      if (rotation.length > 0) setRotationIds(rotation);
    })();
  }, [editable]);

  // Auto-populate lineup from active position players sorted by OVR
  const activePlayers = players.filter(p => p.rosterStatus === 'MLB_ACTIVE');
  const positionPlayers = activePlayers.filter(p => !p.isPitcher);
  const starters = positionPlayers.sort((a, b) => b.overall - a.overall);

  // Build the lineup display
  const effectiveLineup: RosterPlayer[] = [];
  if (lineupIds.length === 9) {
    for (const id of lineupIds) {
      const p = players.find(pl => pl.playerId === id);
      if (p) effectiveLineup.push(p);
    }
  }
  if (effectiveLineup.length < 9) {
    effectiveLineup.length = 0;
    effectiveLineup.push(...starters.slice(0, 9));
  }

  // Build the rotation display
  const pitchers = players.filter(p => p.isPitcher && p.rosterStatus === 'MLB_ACTIVE').sort((a, b) => b.overall - a.overall);
  const sps = pitchers.filter(p => p.position === 'SP');
  const effectiveRotation: RosterPlayer[] = [];
  if (rotationIds.length > 0) {
    for (const id of rotationIds) {
      const p = players.find(pl => pl.playerId === id);
      if (p) effectiveRotation.push(p);
    }
  }
  if (effectiveRotation.length === 0) {
    effectiveRotation.push(...sps.slice(0, 5));
  }

  const rps = pitchers.filter(p => p.position === 'RP' || p.position === 'CL');
  const closer = rps.find(p => (p.stats.sv ?? 0) > 0) ?? rps[0];
  const bullpen = rps.filter(p => p !== closer).slice(0, 5);

  // Group by position for diamond display
  const byPos = (pos: string) =>
    players.filter(p => p.position === pos && p.rosterStatus === 'MLB_ACTIVE').sort((a, b) => b.overall - a.overall);

  // Drag-to-reorder handler for lineup
  const handleLineupReorder = useCallback((oldIndex: number, newIndex: number) => {
    const currentIds = lineupIds.length === 9 ? lineupIds : effectiveLineup.map(p => p.playerId);
    setLineupIds(arrayMove(currentIds, oldIndex, newIndex));
  }, [lineupIds, effectiveLineup]);

  // Click-swap handler for lineup (fallback when not dragging)
  const handleLineupClick = (idx: number) => {
    if (!editing) return;
    if (selectedLineupIdx === null) {
      setSelectedLineupIdx(idx);
    } else {
      const newIds = [...(lineupIds.length === 9 ? lineupIds : effectiveLineup.map(p => p.playerId))];
      const temp = newIds[selectedLineupIdx];
      newIds[selectedLineupIdx] = newIds[idx];
      newIds[idx] = temp;
      setLineupIds(newIds);
      setSelectedLineupIdx(null);
    }
  };

  // Drag-to-reorder handler for rotation
  const handleRotationReorder = useCallback((oldIndex: number, newIndex: number) => {
    const currentIds = rotationIds.length > 0 ? rotationIds : effectiveRotation.map(p => p.playerId);
    setRotationIds(arrayMove(currentIds, oldIndex, newIndex));
  }, [rotationIds, effectiveRotation]);

  // Click-swap handler for rotation (fallback)
  const handleRotationClick = (idx: number) => {
    if (!editing) return;
    if (selectedRotationIdx === null) {
      setSelectedRotationIdx(idx);
    } else {
      const newIds = [...(rotationIds.length > 0 ? rotationIds : effectiveRotation.map(p => p.playerId))];
      const temp = newIds[selectedRotationIdx];
      newIds[selectedRotationIdx] = newIds[idx];
      newIds[idx] = temp;
      setRotationIds(newIds);
      setSelectedRotationIdx(null);
    }
  };

  // String IDs for dnd-kit
  const lineupSortIds = effectiveLineup.map(p => String(p.playerId));
  const rotationSortIds = effectiveRotation.map(p => String(p.playerId));

  const handleSave = async () => {
    const finalLineup = lineupIds.length === 9 ? lineupIds : effectiveLineup.map(p => p.playerId);
    const finalRotation = rotationIds.length > 0 ? rotationIds : effectiveRotation.map(p => p.playerId);

    const tid = await getEngine().getUserTeamId();
    const [lineupRes, rotationRes] = await Promise.all([
      getEngine().setLineupOrder(tid, finalLineup),
      getEngine().setRotationOrder(tid, finalRotation),
    ]);

    if (!lineupRes.ok) { setSaveMsg('Failed to save lineup.'); return; }
    if (!rotationRes.ok) { setSaveMsg('Failed to save rotation.'); return; }

    setLineupIds(finalLineup);
    setRotationIds(finalRotation);
    setSaveMsg('Lineup & rotation saved!');
    setEditing(false);
    setTimeout(() => setSaveMsg(null), 3000);
  };

  return (
    <div className="space-y-8">

      {/* ═══ Edit Controls ═══════════════════════════════════════════════════ */}
      {editable && (
        <div className="flex items-center gap-3 flex-wrap">
          {editing ? (
            <>
              <button onClick={() => { setSelectedLineupIdx(null); setSelectedRotationIdx(null); setEditing(false); }}
                className="bloomberg-btn text-xs min-h-[44px]">
                CANCEL
              </button>
              <button onClick={handleSave}
                className="bloomberg-btn-primary text-xs min-h-[44px]">
                SAVE LINEUP
              </button>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider"
                style={{ backgroundColor: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)' }}>
                DRAG TO REORDER · TAP TWO TO SWAP
              </span>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              className="bloomberg-btn text-xs min-h-[44px]">
              EDIT LINEUP
            </button>
          )}
          {saveMsg && (
            <span className={`text-xs font-bold ${saveMsg.includes('saved') ? 'text-green-400' : 'text-red-400'}`}>
              {saveMsg}
            </span>
          )}
        </div>
      )}

      {/* ═══ Defensive Alignment — The Diamond ═══════════════════════════════ */}
      <section>
        <h3 className="text-sm font-extrabold tracking-wider mb-4"
            style={{ color: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif' }}>
          DEFENSIVE ALIGNMENT
        </h3>
        <div className="depth-field mx-auto w-full max-w-[540px] p-3"
             style={{ minHeight: 280 }}>
          <div className="relative w-full" style={{ minHeight: 360, paddingBottom: '70%' }}>
            {Object.keys(FIELD_POSITIONS).map(pos => (
              <FieldCard
                key={pos}
                position={pos}
                players={byPos(pos)}
                onClickPlayer={editing ? undefined : onClickPlayer}
                selected={false}
                onSelect={undefined}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Bench ═══════════════════════════════════════════════════════════ */}
      {(() => {
        const lineupIds = new Set(effectiveLineup.map(p => p.playerId));
        const bench = activePlayers.filter(p => !p.isPitcher && !lineupIds.has(p.playerId))
          .sort((a, b) => b.overall - a.overall);
        if (bench.length === 0) return null;
        return (
          <section>
            <h3 className="text-sm font-extrabold tracking-wider mb-3"
                style={{ color: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif' }}>
              BENCH
              <span className="text-[10px] font-normal ml-2" style={{ color: '#64748B' }}>
                {bench.length} player{bench.length !== 1 ? 's' : ''}
              </span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {bench.map(p => (
                <div
                  key={p.playerId}
                  className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-all hover:bg-[#142447]/40"
                  style={{ backgroundColor: 'rgba(15,25,48,0.3)', border: '1px solid rgba(30,42,74,0.3)' }}
                  onClick={() => onClickPlayer?.(p.playerId)}
                >
                  <OVRBadge ovr={p.overall} size="small" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold truncate" style={{ color: '#E2E8F0', fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {p.name}
                    </div>
                    <div className="text-[8px]" style={{ color: '#64748B' }}>
                      {p.position} | {p.age}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })()}

      {/* ═══ Batting Order ════════════════════════════════════════════════════ */}
      {(editing || effectiveLineup.length > 0) && (
        <section>
          <h3 className="text-sm font-extrabold tracking-wider mb-4"
              style={{ color: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif' }}>
            BATTING ORDER
          </h3>
          <SortableList items={lineupSortIds} onReorder={handleLineupReorder} disabled={!editing} className="space-y-1">
            {effectiveLineup.map((p, i) => (
              <SortableItem key={p.playerId} id={String(p.playerId)} disabled={!editing} showHandle={editing}>
                <LineupCard
                  player={p}
                  slot={i + 1}
                  selected={editing && selectedLineupIdx === i}
                  onSelect={() => editing ? handleLineupClick(i) : onClickPlayer?.(p.playerId)}
                />
              </SortableItem>
            ))}
          </SortableList>
        </section>
      )}

      {/* ═══ Pitching Staff ═══════════════════════════════════════════════════ */}
      <section>
        <h3 className="text-sm font-extrabold tracking-wider mb-4"
            style={{ color: '#F8FAFC', fontFamily: 'Inter, system-ui, sans-serif' }}>
          PITCHING STAFF
        </h3>

        {/* Rotation */}
        <SortableList items={rotationSortIds} onReorder={handleRotationReorder} disabled={!editing} className="space-y-1.5">
          {effectiveRotation.length === 0 ? (
            <div className="text-gray-500 text-xs text-center py-4">No starting pitchers</div>
          ) : effectiveRotation.map((p, i) => (
            <SortableItem key={p.playerId} id={String(p.playerId)} disabled={!editing} showHandle={editing}>
              <PitchingCard
                player={p}
                role={i === 0 ? 'ACE' : `SP${i + 1}`}
                onClickPlayer={editing ? undefined : onClickPlayer}
                selected={editing && selectedRotationIdx === i}
                onSelect={editing ? () => handleRotationClick(i) : undefined}
              />
            </SortableItem>
          ))}
        </SortableList>

        {/* Divider */}
        {(closer || bullpen.length > 0) && (
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px" style={{ backgroundColor: '#1E2A4A' }} />
            <span className="text-[9px] font-bold tracking-[0.2em]" style={{ color: '#3B4A6B' }}>BULLPEN</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#1E2A4A' }} />
          </div>
        )}

        {/* Bullpen */}
        <div className="space-y-1.5">
          {closer && (
            <PitchingCard player={closer} role="CL" onClickPlayer={onClickPlayer} />
          )}
          {bullpen.map(p => (
            <PitchingCard
              key={p.playerId}
              player={p}
              role={p.position === 'CL' ? 'SU' : 'MR'}
              onClickPlayer={onClickPlayer}
            />
          ))}
          {!closer && bullpen.length === 0 && (
            <div className="text-gray-500 text-xs text-center py-4">No relievers</div>
          )}
        </div>
      </section>
    </div>
  );
}

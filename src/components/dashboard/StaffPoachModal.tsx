/**
 * StaffPoachModal.tsx — FO Staff Poaching Event Modal
 *
 * Triggered when a rival team offers a job to one of your FO staff members.
 * Player chooses: Let Go (staff leaves, morale hit) or Block (owner patience cost).
 */

import type { StaffPoachEvent } from '../../engine/staffPoaching';

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function StaffPoachModal({
  event,
  onLetGo,
  onBlock,
}: {
  event:    StaffPoachEvent;
  onLetGo:  () => void;
  onBlock:  () => void;
}) {
  const { staffMember, suitingTeam, offerTitle, offerYears } = event;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-lg rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: '#0a0a0f',
          border:     '1px solid rgba(239,68,68,0.25)',
          maxHeight:  '90vh',
          overflowY:  'auto',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b border-gray-800 flex items-center gap-3"
          style={{ background: 'rgba(239,68,68,0.06)' }}
        >
          <span className="text-2xl">🚨</span>
          <div>
            <div className="text-red-400 font-black text-sm tracking-widest uppercase">
              STAFF POACHING ALERT
            </div>
            <div className="text-gray-500 text-xs mt-0.5">
              A rival front office has come calling
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* Staff member card */}
          <div
            className="rounded-lg p-4 flex items-start gap-4"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-xl shrink-0"
              style={{ background: `${staffMember.color}15`, border: `1px solid ${staffMember.color}40` }}
            >
              {staffMember.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-base text-gray-200">{staffMember.name}</div>
              <div className="text-xs" style={{ color: staffMember.color }}>
                {staffMember.title} · OVR {staffMember.ovr}
              </div>
              <div className="text-gray-600 text-xs mt-0.5 italic truncate">
                "{staffMember.backstory}"
              </div>
            </div>
          </div>

          {/* Offer details */}
          <div
            className="rounded-lg p-4 space-y-2"
            style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.20)' }}
          >
            <div className="text-red-400 font-bold text-xs uppercase tracking-widest">
              THE OFFER
            </div>
            <div className="text-gray-200 text-sm leading-relaxed">
              <span className="font-bold text-white">{suitingTeam}</span> is offering{' '}
              <span className="font-bold text-white">{staffMember.name}</span> the role of{' '}
              <span className="text-red-300 font-bold">{offerTitle}</span> on a{' '}
              <span className="font-bold text-white">{offerYears}-year deal</span>.
            </div>
            <div className="text-gray-500 text-xs">
              This is an elevated role — a clear step up from their current position on your staff.
              They are seriously considering the opportunity.
            </div>
          </div>

          {/* Consequence preview */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-lg p-3 space-y-1"
              style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <div className="text-red-400 font-bold text-xs uppercase tracking-wider">
                Let Go
              </div>
              <div className="text-gray-400 text-xs leading-relaxed">
                {staffMember.name} departs for {suitingTeam}. You wish them well publicly, but the clubhouse notices.
              </div>
              <div className="text-xs space-y-0.5 mt-1">
                <div className="text-red-400 font-mono">Morale <span className="font-bold">−5</span></div>
                <div className="text-green-400 font-mono">Owner Patience <span className="font-bold">+2</span></div>
              </div>
            </div>

            <div
              className="rounded-lg p-3 space-y-1"
              style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)' }}
            >
              <div className="text-green-400 font-bold text-xs uppercase tracking-wider">
                Block the Move
              </div>
              <div className="text-gray-400 text-xs leading-relaxed">
                You make a counter-offer to keep {staffMember.name}. Ownership funds it — reluctantly.
              </div>
              <div className="text-xs space-y-0.5 mt-1">
                <div className="text-green-400 font-mono">Morale <span className="font-bold">+3</span></div>
                <div className="text-red-400 font-mono">Owner Patience <span className="font-bold">−4</span></div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={onLetGo}
              className="py-3 font-black text-sm uppercase tracking-widest transition-colors rounded"
              style={{ background: '#1f2937', color: '#9ca3af', border: '1px solid #374151' }}
            >
              LET THEM GO
            </button>
            <button
              onClick={onBlock}
              className="py-3 font-black text-sm uppercase tracking-widest transition-colors rounded"
              style={{ background: '#4ade80', color: '#000' }}
            >
              BLOCK THE MOVE ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

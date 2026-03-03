import { useEffect, useState } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FranchiseRecord {
  category: string;
  value: number;
  displayValue: string;
  playerName: string;
  playerId: number;
  season?: number;
  isPitcher: boolean;
}

interface TeamRecord {
  category: string;
  value: string;
  season: number;
}

interface FranchiseRecordBook {
  singleSeasonHitting: FranchiseRecord[];
  singleSeasonPitching: FranchiseRecord[];
  careerHitting: FranchiseRecord[];
  careerPitching: FranchiseRecord[];
  teamRecords: TeamRecord[];
}

// ─── Category definitions ────────────────────────────────────────────────────

const SINGLE_SEASON_HITTING_CATS = ['HR', 'AVG', 'OPS', 'RBI', 'H', 'SB'];
const SINGLE_SEASON_PITCHING_CATS = ['W', 'ERA', 'K', 'SV', 'WHIP'];
const CAREER_HITTING_CATS = ['HR', 'H', 'RBI', 'AVG'];
const CAREER_PITCHING_CATS = ['W', 'K', 'ERA', 'SV'];

function filterAndOrder(records: FranchiseRecord[], categories: string[]): FranchiseRecord[] {
  const map = new Map<string, FranchiseRecord>();
  for (const r of records) {
    map.set(r.category, r);
  }
  return categories.map(cat => map.get(cat)).filter(Boolean) as FranchiseRecord[];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function RecordSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bloomberg-border bg-gray-900 mb-4">
      <div className="bloomberg-header px-4">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800">
              <th className="text-left px-3 py-1.5 w-16">STAT</th>
              <th className="text-right px-3 py-1.5 w-24">VALUE</th>
              <th className="text-left px-3 py-1.5">PLAYER</th>
              <th className="text-right px-3 py-1.5 w-20">SEASON</th>
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function RecordRow({ record, showSeason }: { record: FranchiseRecord; showSeason: boolean }) {
  return (
    <tr className="text-xs border-b border-gray-800/50 hover:bg-gray-800/50">
      <td className="px-3 py-2 text-orange-400 font-bold">{record.category}</td>
      <td className="text-right px-3 py-2 text-yellow-400 font-black tabular-nums">
        {record.displayValue}
      </td>
      <td className="px-3 py-2 text-gray-300">{record.playerName}</td>
      {showSeason && (
        <td className="text-right px-3 py-2 text-gray-500 tabular-nums">
          {record.season ?? '—'}
        </td>
      )}
      {!showSeason && (
        <td className="text-right px-3 py-2 text-gray-500">CAREER</td>
      )}
    </tr>
  );
}

function CareerRecordSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bloomberg-border bg-gray-900 mb-4">
      <div className="bloomberg-header px-4">{title}</div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800">
              <th className="text-left px-3 py-1.5 w-16">STAT</th>
              <th className="text-right px-3 py-1.5 w-24">VALUE</th>
              <th className="text-left px-3 py-1.5">PLAYER</th>
              <th className="text-right px-3 py-1.5 w-20"></th>
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function TeamRecordSection({ records }: { records: TeamRecord[] }) {
  if (records.length === 0) return null;
  return (
    <div className="bloomberg-border bg-gray-900 mb-4">
      <div className="bloomberg-header px-4">TEAM RECORDS</div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800">
              <th className="text-left px-3 py-1.5">RECORD</th>
              <th className="text-right px-3 py-1.5 w-24">VALUE</th>
              <th className="text-right px-3 py-1.5 w-20">SEASON</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={i} className="text-xs border-b border-gray-800/50 hover:bg-gray-800/50">
                <td className="px-3 py-2 text-orange-400 font-bold">{r.category}</td>
                <td className="text-right px-3 py-2 text-yellow-400 font-black tabular-nums">
                  {r.value}
                </td>
                <td className="text-right px-3 py-2 text-gray-500 tabular-nums">{r.season}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function FranchiseRecordsView() {
  const { gameStarted } = useGameStore();
  const [records, setRecords] = useState<FranchiseRecordBook | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    getEngine()
      .getFranchiseRecords()
      .then((data: FranchiseRecordBook) => setRecords(data))
      .finally(() => setLoading(false));
  }, [gameStarted]);

  const isEmpty =
    !records ||
    (records.singleSeasonHitting.length === 0 &&
      records.singleSeasonPitching.length === 0 &&
      records.careerHitting.length === 0 &&
      records.careerPitching.length === 0 &&
      records.teamRecords.length === 0);

  const singleHitting = records ? filterAndOrder(records.singleSeasonHitting, SINGLE_SEASON_HITTING_CATS) : [];
  const singlePitching = records ? filterAndOrder(records.singleSeasonPitching, SINGLE_SEASON_PITCHING_CATS) : [];
  const careerHit = records ? filterAndOrder(records.careerHitting, CAREER_HITTING_CATS) : [];
  const careerPitch = records ? filterAndOrder(records.careerPitching, CAREER_PITCHING_CATS) : [];

  return (
    <div className="p-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">FRANCHISE RECORD BOOK</div>

      {loading && (
        <div className="text-orange-400 text-xs animate-pulse">Loading records...</div>
      )}

      {!loading && isEmpty && (
        <div className="bloomberg-border bg-gray-950 px-6 py-12 text-center">
          <div className="text-gray-500 text-sm">
            No franchise records yet. Simulate your first season to start tracking records.
          </div>
        </div>
      )}

      {!loading && !isEmpty && (
        <>
          {/* Single-Season Hitting */}
          {singleHitting.length > 0 && (
            <RecordSection title="SINGLE-SEASON HITTING RECORDS">
              {singleHitting.map(r => (
                <RecordRow key={r.category} record={r} showSeason />
              ))}
            </RecordSection>
          )}

          {/* Single-Season Pitching */}
          {singlePitching.length > 0 && (
            <RecordSection title="SINGLE-SEASON PITCHING RECORDS">
              {singlePitching.map(r => (
                <RecordRow key={r.category} record={r} showSeason />
              ))}
            </RecordSection>
          )}

          {/* Career Hitting */}
          {careerHit.length > 0 && (
            <CareerRecordSection title="CAREER HITTING RECORDS">
              {careerHit.map(r => (
                <RecordRow key={r.category} record={r} showSeason={false} />
              ))}
            </CareerRecordSection>
          )}

          {/* Career Pitching */}
          {careerPitch.length > 0 && (
            <CareerRecordSection title="CAREER PITCHING RECORDS">
              {careerPitch.map(r => (
                <RecordRow key={r.category} record={r} showSeason={false} />
              ))}
            </CareerRecordSection>
          )}

          {/* Team Records */}
          {records && records.teamRecords.length > 0 && (
            <TeamRecordSection records={records.teamRecords} />
          )}
        </>
      )}
    </div>
  );
}

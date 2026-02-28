import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  buildSalaryVisualization,
  type SalaryVisualizationData,
  type RosterContract,
  type TopContract,
} from '../../engine/finance/salaryVisualization';

function PositionBar({ position, total, pct, maxTotal }: {
  position: string; total: number; pct: number; maxTotal: number;
}) {
  const barPct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-400 font-bold w-8">{position}</span>
      <div className="flex-1 h-3 bg-gray-800 rounded overflow-hidden">
        <div className="h-full bg-orange-500/70 rounded transition-all" style={{ width: `${barPct}%` }} />
      </div>
      <span className="text-orange-400 font-bold tabular-nums w-16 text-right">${total}M</span>
      <span className="text-gray-600 tabular-nums w-10 text-right">{pct}%</span>
    </div>
  );
}

function ContractRow({ contract }: { contract: TopContract }) {
  const valueColors = {
    bargain: 'text-green-400',
    fair: 'text-blue-400',
    watch: 'text-yellow-400',
    overpay: 'text-red-400',
  };
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 text-xs border-b border-gray-800/30 last:border-0">
      <span className="text-orange-300 font-bold flex-1">{contract.name}</span>
      <span className="text-gray-600 w-8">{contract.position}</span>
      <span className="text-gray-400 tabular-nums w-10">{contract.overall} OVR</span>
      <span className="text-gray-600 tabular-nums w-8">Age {contract.age}</span>
      <span className="text-orange-400 font-bold tabular-nums w-14 text-right">${contract.salary}M</span>
      <span className="text-gray-500 tabular-nums w-10">{contract.years}yr</span>
      <span className={`font-bold text-[10px] w-20 text-right ${valueColors[contract.value]}`}>
        {contract.valueLabel}
      </span>
    </div>
  );
}

// Demo roster
const DEMO_ROSTER: RosterContract[] = [
  { name: 'Marcus Bell', position: 'SS', overall: 82, age: 28, salary: 22, contractYears: 4 },
  { name: "James O'Brien", position: 'SP', overall: 78, age: 30, salary: 18, contractYears: 2 },
  { name: 'Derek Anderson', position: 'C', overall: 72, age: 33, salary: 14, contractYears: 1 },
  { name: 'Tommy Nakamura', position: 'RF', overall: 68, age: 34, salary: 10, contractYears: 1 },
  { name: 'Carlos Reyes', position: 'CF', overall: 65, age: 24, salary: 3, contractYears: 5 },
  { name: 'Jake Morrison', position: 'SP', overall: 70, age: 27, salary: 12, contractYears: 3 },
  { name: 'Darius Coleman', position: '2B', overall: 64, age: 25, salary: 2, contractYears: 4 },
  { name: 'Mike Torres', position: '1B', overall: 66, age: 29, salary: 8, contractYears: 2 },
  { name: 'Ryan Parker', position: 'RP', overall: 62, age: 28, salary: 5, contractYears: 2 },
  { name: 'David Chen', position: '3B', overall: 70, age: 26, salary: 7, contractYears: 3 },
  { name: 'Alex Ramirez', position: 'LF', overall: 67, age: 27, salary: 6, contractYears: 2 },
  { name: 'Sam Williams', position: 'SP', overall: 65, age: 25, salary: 4, contractYears: 4 },
  { name: 'Chris Lee', position: 'RP', overall: 60, age: 30, salary: 3, contractYears: 1 },
];

export default function SalaryBreakdown() {
  const { gameStarted } = useGameStore();
  const [data] = useState<SalaryVisualizationData>(() => buildSalaryVisualization(DEMO_ROSTER, 2.5));
  const [tab, setTab] = useState<'breakdown' | 'contracts' | 'projections'>('breakdown');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const maxPositionTotal = data.breakdown.length > 0 ? data.breakdown[0].total : 1;
  const taxColor = data.overTax > 0 ? 'text-red-400' : 'text-green-400';

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>SALARY VISUALIZATION</span>
        <span className={`text-[10px] font-bold ${taxColor}`}>
          {data.overTax > 0 ? `$${data.overTax}M OVER TAX` : 'UNDER LUXURY TAX'}
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL PAYROLL</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">${data.totalPayroll}M</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">LUXURY TAX</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">${data.luxuryTaxThreshold}M</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TAX SPACE</div>
          <div className={`font-bold text-xl tabular-nums ${data.overTax > 0 ? 'text-red-400' : 'text-green-400'}`}>
            ${(data.luxuryTaxThreshold - data.totalPayroll).toFixed(1)}M
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">DEAD MONEY</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">${data.deadMoney}M</div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1">
        {(['breakdown', 'contracts', 'projections'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              tab === t ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{t.toUpperCase()}</button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'breakdown' && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">SALARY BY POSITION</div>
          <div className="p-4 space-y-2">
            {data.breakdown.map(b => (
              <PositionBar key={b.position} position={b.position} total={b.total} pct={b.pct} maxTotal={maxPositionTotal} />
            ))}
          </div>
        </div>
      )}

      {tab === 'contracts' && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">TOP CONTRACTS ({data.topContracts.length})</div>
          <div className="max-h-[28rem] overflow-y-auto">
            {data.topContracts.map((c, i) => <ContractRow key={i} contract={c} />)}
          </div>
        </div>
      )}

      {tab === 'projections' && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">3-YEAR SALARY PROJECTIONS</div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4">
              {data.projections.map((p, i) => (
                <div key={i} className="bloomberg-border px-3 py-3">
                  <div className="text-orange-300 font-bold text-sm mb-2">{p.label}</div>
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-gray-600">COMMITTED</span>
                      <span className="text-orange-400 font-bold tabular-nums">${p.committed}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">EXPIRING</span>
                      <span className="text-green-400 font-bold tabular-nums">${p.expiring}M</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">TAX SPACE</span>
                      <span className={`font-bold tabular-nums ${p.space >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${p.space}M
                      </span>
                    </div>
                    {p.warning && (
                      <div className="text-yellow-400 font-bold mt-1">{p.warning}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

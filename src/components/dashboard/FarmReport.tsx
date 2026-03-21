/**
 * FarmReport.tsx — Monthly farm system report card.
 * Displays 3-5 scannable bullet points about prospect development.
 * Shown during the monthly pulse (InSeasonDashboard).
 */

import type { FarmAlert } from '../../engine/farmReport';

const TYPE_COLORS: Record<string, string> = {
  riser: '#4ade80',
  faller: '#ef4444',
  promotion: '#fbbf24',
  stall: '#f97316',
  note: '#94a3b8',
};

interface Props {
  alerts: FarmAlert[];
}

export default function FarmReport({ alerts }: Props) {
  if (alerts.length === 0) return null;

  return (
    <div className="bloomberg-border bg-[#0F1930]">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>FARM REPORT</span>
        <span className="text-gray-500 font-normal text-[10px]">Minor League Development</span>
      </div>
      <div className="divide-y divide-[#1E2A4A]">
        {alerts.map((alert, i) => (
          <div key={i} className="px-4 py-2 flex items-start gap-2.5">
            <span className="text-sm shrink-0 mt-0.5">{alert.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold"
                  style={{ color: TYPE_COLORS[alert.type] ?? '#94a3b8' }}
                >
                  {alert.headline}
                </span>
                <span className="text-[9px] text-gray-500 shrink-0">
                  {alert.position} · {alert.level}
                </span>
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                {alert.detail}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

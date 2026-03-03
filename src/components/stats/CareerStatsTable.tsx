import type { PlayerSeasonStats } from '../../types/player';

interface Props {
  seasons: PlayerSeasonStats[];
  isPitcher: boolean;
}

export function fmt(n: number, decimals = 0): string {
  return decimals > 0 ? n.toFixed(decimals) : String(n);
}

export function avg(h: number, ab: number): string {
  return ab > 0 ? (h / ab).toFixed(3) : '.000';
}

export function obp(h: number, bb: number, hbp: number, pa: number): string {
  return pa > 0 ? ((h + bb + hbp) / pa).toFixed(3) : '.000';
}

export function era(er: number, outs: number): string {
  return outs > 0 ? ((er / outs) * 27).toFixed(2) : '0.00';
}

export function ip(outs: number): string {
  const full = Math.floor(outs / 3);
  const rem = outs % 3;
  return `${full}.${rem}`;
}

export function whip(ha: number, bba: number, outs: number): string {
  const innings = outs / 3;
  return innings > 0 ? ((ha + bba) / innings).toFixed(2) : '0.00';
}

const HITTING_COLS = [
  { key: 'season', label: 'YR', width: 'w-12' },
  { key: 'g', label: 'G', width: 'w-10' },
  { key: 'pa', label: 'PA', width: 'w-10' },
  { key: 'avg', label: 'AVG', width: 'w-14' },
  { key: 'obp', label: 'OBP', width: 'w-14' },
  { key: 'hr', label: 'HR', width: 'w-10' },
  { key: 'rbi', label: 'RBI', width: 'w-10' },
  { key: 'sb', label: 'SB', width: 'w-10' },
  { key: 'bb', label: 'BB', width: 'w-10' },
  { key: 'k', label: 'K', width: 'w-10' },
  { key: 'h', label: 'H', width: 'w-10' },
  { key: 'r', label: 'R', width: 'w-10' },
];

const PITCHING_COLS = [
  { key: 'season', label: 'YR', width: 'w-12' },
  { key: 'g', label: 'G', width: 'w-10' },
  { key: 'gs', label: 'GS', width: 'w-10' },
  { key: 'w', label: 'W', width: 'w-10' },
  { key: 'l', label: 'L', width: 'w-10' },
  { key: 'sv', label: 'SV', width: 'w-10' },
  { key: 'era', label: 'ERA', width: 'w-14' },
  { key: 'ip', label: 'IP', width: 'w-14' },
  { key: 'whip', label: 'WHIP', width: 'w-14' },
  { key: 'ka', label: 'K', width: 'w-10' },
  { key: 'bba', label: 'BB', width: 'w-10' },
];

export function hittingRow(s: PlayerSeasonStats): Record<string, string> {
  return {
    season: String(s.season),
    g: fmt(s.g),
    pa: fmt(s.pa),
    avg: avg(s.h, s.ab),
    obp: obp(s.h, s.bb, s.hbp, s.pa),
    hr: fmt(s.hr),
    rbi: fmt(s.rbi),
    sb: fmt(s.sb),
    bb: fmt(s.bb),
    k: fmt(s.k),
    h: fmt(s.h),
    r: fmt(s.r),
  };
}

export function pitchingRow(s: PlayerSeasonStats): Record<string, string> {
  return {
    season: String(s.season),
    g: fmt(s.gp),
    gs: fmt(s.gs),
    w: fmt(s.w),
    l: fmt(s.l),
    sv: fmt(s.sv),
    era: era(s.er, s.outs),
    ip: ip(s.outs),
    whip: whip(s.ha, s.bba, s.outs),
    ka: fmt(s.ka),
    bba: fmt(s.bba),
  };
}

export function totalsHitting(seasons: PlayerSeasonStats[]): Record<string, string> {
  const t = {
    g: 0, pa: 0, ab: 0, h: 0, bb: 0, hbp: 0, hr: 0, rbi: 0, sb: 0, k: 0, r: 0,
  };
  for (const s of seasons) {
    t.g += s.g; t.pa += s.pa; t.ab += s.ab; t.h += s.h; t.bb += s.bb;
    t.hbp += s.hbp; t.hr += s.hr; t.rbi += s.rbi; t.sb += s.sb; t.k += s.k; t.r += s.r;
  }
  return {
    season: `${seasons.length}yr`,
    g: fmt(t.g),
    pa: fmt(t.pa),
    avg: avg(t.h, t.ab),
    obp: obp(t.h, t.bb, t.hbp, t.pa),
    hr: fmt(t.hr),
    rbi: fmt(t.rbi),
    sb: fmt(t.sb),
    bb: fmt(t.bb),
    k: fmt(t.k),
    h: fmt(t.h),
    r: fmt(t.r),
  };
}

export function totalsPitching(seasons: PlayerSeasonStats[]): Record<string, string> {
  const t = {
    gp: 0, gs: 0, w: 0, l: 0, sv: 0, er: 0, outs: 0, ha: 0, bba: 0, ka: 0,
  };
  for (const s of seasons) {
    t.gp += s.gp; t.gs += s.gs; t.w += s.w; t.l += s.l; t.sv += s.sv;
    t.er += s.er; t.outs += s.outs; t.ha += s.ha; t.bba += s.bba; t.ka += s.ka;
  }
  return {
    season: `${seasons.length}yr`,
    g: fmt(t.gp),
    gs: fmt(t.gs),
    w: fmt(t.w),
    l: fmt(t.l),
    sv: fmt(t.sv),
    era: era(t.er, t.outs),
    ip: ip(t.outs),
    whip: whip(t.ha, t.bba, t.outs),
    ka: fmt(t.ka),
    bba: fmt(t.bba),
  };
}

export default function CareerStatsTable({ seasons, isPitcher }: Props) {
  if (seasons.length === 0) {
    return (
      <div className="bloomberg-border">
        <div className="bloomberg-header">CAREER STATISTICS</div>
        <div className="p-6 text-gray-500 text-xs text-center">
          No career history yet. Simulate seasons to build a track record.
        </div>
      </div>
    );
  }

  const cols = isPitcher ? PITCHING_COLS : HITTING_COLS;
  const rows = seasons.map(s => isPitcher ? pitchingRow(s) : hittingRow(s));
  const totals = isPitcher ? totalsPitching(seasons) : totalsHitting(seasons);

  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header">
        CAREER STATISTICS — {seasons.length} SEASON{seasons.length !== 1 ? 'S' : ''}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800">
              {cols.map(c => (
                <th
                  key={c.key}
                  className={`px-2 py-2 text-right text-gray-500 font-bold ${c.width}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-gray-800/50 hover:bg-gray-900/50"
              >
                {cols.map(c => (
                  <td
                    key={c.key}
                    className={`px-2 py-1.5 text-right tabular-nums ${
                      c.key === 'season' ? 'text-orange-400 font-bold' : 'text-gray-300'
                    }`}
                  >
                    {row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
            {/* Totals row */}
            <tr className="border-t-2 border-orange-800 bg-gray-900/30">
              {cols.map(c => (
                <td
                  key={c.key}
                  className={`px-2 py-2 text-right tabular-nums font-bold ${
                    c.key === 'season' ? 'text-orange-500' : 'text-orange-300'
                  }`}
                >
                  {totals[c.key]}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

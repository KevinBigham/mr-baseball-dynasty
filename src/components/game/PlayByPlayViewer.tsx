import { useState, useMemo } from 'react';
import type { PlayEvent, BoxScore } from '../../types/game';

// ─── Outcome display helpers ─────────────────────────────────────────────────

const OUTCOME_LABELS: Record<string, { text: string; color: string }> = {
  '1B':     { text: 'Single',           color: 'text-green-400' },
  '2B':     { text: 'Double',           color: 'text-green-400' },
  '3B':     { text: 'Triple',           color: 'text-yellow-400' },
  'HR':     { text: 'Home Run',         color: 'text-orange-400' },
  'BB':     { text: 'Walk',             color: 'text-blue-400' },
  'HBP':    { text: 'Hit By Pitch',     color: 'text-blue-300' },
  'K':      { text: 'Strikeout',        color: 'text-red-400' },
  'GB_OUT': { text: 'Groundout',        color: 'text-gray-400' },
  'FB_OUT': { text: 'Flyout',           color: 'text-gray-400' },
  'LD_OUT': { text: 'Lineout',          color: 'text-gray-400' },
  'PU_OUT': { text: 'Pop Up',           color: 'text-gray-400' },
  'GDP':    { text: 'Double Play',      color: 'text-red-500' },
  'SF':     { text: 'Sacrifice Fly',    color: 'text-gray-300' },
  'SB':     { text: 'Stolen Base',      color: 'text-cyan-400' },
  'CS':     { text: 'Caught Stealing',  color: 'text-red-400' },
};

function runnerDiagram(runners: number): string {
  const r1 = (runners & 1) ? '1' : '_';
  const r2 = (runners & 2) ? '2' : '_';
  const r3 = (runners & 4) ? '3' : '_';
  return `[${r3}|${r2}|${r1}]`;
}

function outsDisplay(outs: number): string {
  return 'O'.repeat(outs) + '.'.repeat(Math.max(0, 3 - outs));
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface PlayByPlayViewerProps {
  boxScore: BoxScore;
  playerNames: Map<number, string>;
  homeTeamName: string;
  awayTeamName: string;
}

export default function PlayByPlayViewer({
  boxScore,
  playerNames,
  homeTeamName,
  awayTeamName,
}: PlayByPlayViewerProps) {
  const [selectedInning, setSelectedInning] = useState<number | null>(null);

  const plays = boxScore.playLog ?? [];
  const innings = useMemo(() => {
    const map = new Map<number, PlayEvent[]>();
    for (const p of plays) {
      const inn = p.inning;
      if (!map.has(inn)) map.set(inn, []);
      map.get(inn)!.push(p);
    }
    return map;
  }, [plays]);

  const inningNumbers = useMemo(() => Array.from(innings.keys()).sort((a, b) => a - b), [innings]);

  if (plays.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No play-by-play data available for this game.
        <br />
        <span className="text-gray-600 text-xs">
          Play logs are generated for individually simulated games.
        </span>
      </div>
    );
  }

  const filteredPlays = selectedInning !== null
    ? innings.get(selectedInning) ?? []
    : plays;

  // Use pre-computed lineScore if available, otherwise derive from play log
  const linescore = useMemo(() => {
    if (boxScore.lineScore) return boxScore.lineScore;
    const away: number[] = [];
    const home: number[] = [];
    for (const inn of inningNumbers) {
      const innPlays = innings.get(inn) ?? [];
      let awayRuns = 0, homeRuns = 0;
      for (const p of innPlays) {
        if (p.isTop) awayRuns += p.result.runsScored;
        else homeRuns += p.result.runsScored;
      }
      away.push(awayRuns);
      home.push(homeRuns);
    }
    return { away, home };
  }, [boxScore.lineScore, innings, inningNumbers]);

  return (
    <div className="flex flex-col h-full">
      {/* ── Linescore ─────────────────────────────────────────────── */}
      <div className="border-b border-gray-800 px-4 py-2 overflow-x-auto">
        <table className="text-xs font-mono min-w-max">
          <thead>
            <tr className="text-gray-500">
              <th className="pr-4 text-left w-28">TEAM</th>
              {inningNumbers.map(i => (
                <th key={i} className="px-2 w-6 text-center">{i}</th>
              ))}
              <th className="px-3 text-center border-l border-gray-700">R</th>
              <th className="px-3 text-center">H</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-gray-300">
              <td className="pr-4 font-bold text-gray-400">{awayTeamName}</td>
              {linescore.away.map((r, i) => (
                <td
                  key={i}
                  className={`px-2 text-center cursor-pointer hover:text-orange-400 ${
                    selectedInning === inningNumbers[i] ? 'text-orange-400 font-bold' : ''
                  } ${r > 0 ? 'text-green-400' : ''}`}
                  onClick={() => setSelectedInning(
                    selectedInning === inningNumbers[i] ? null : inningNumbers[i]!,
                  )}
                >
                  {r}
                </td>
              ))}
              <td className="px-3 text-center border-l border-gray-700 font-bold">{boxScore.awayScore}</td>
              <td className="px-3 text-center">
                {boxScore.awayBatting.reduce((s, b) => s + b.h, 0)}
              </td>
            </tr>
            <tr className="text-gray-300">
              <td className="pr-4 font-bold text-gray-400">{homeTeamName}</td>
              {linescore.home.map((r, i) => (
                <td
                  key={i}
                  className={`px-2 text-center cursor-pointer hover:text-orange-400 ${
                    selectedInning === inningNumbers[i] ? 'text-orange-400 font-bold' : ''
                  } ${r > 0 ? 'text-green-400' : ''}`}
                  onClick={() => setSelectedInning(
                    selectedInning === inningNumbers[i] ? null : inningNumbers[i]!,
                  )}
                >
                  {r}
                </td>
              ))}
              <td className="px-3 text-center border-l border-gray-700 font-bold">{boxScore.homeScore}</td>
              <td className="px-3 text-center">
                {boxScore.homeBatting.reduce((s, b) => s + b.h, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Pitching summary ────────────────────────────────────── */}
      <div className="border-b border-gray-800 px-4 py-2 grid grid-cols-2 gap-4">
        {[
          { label: awayTeamName, pitchers: boxScore.awayPitching },
          { label: homeTeamName, pitchers: boxScore.homePitching },
        ].map(({ label, pitchers }) => (
          <div key={label}>
            <div className="text-gray-500 text-xs font-bold mb-1">{label} PITCHING</div>
            <table className="text-xs font-mono w-full">
              <thead>
                <tr className="text-gray-600">
                  <th className="text-left pr-2">NAME</th>
                  <th className="text-right px-1">IP</th>
                  <th className="text-right px-1">H</th>
                  <th className="text-right px-1">R</th>
                  <th className="text-right px-1">ER</th>
                  <th className="text-right px-1">BB</th>
                  <th className="text-right px-1">K</th>
                  <th className="text-right px-1">HR</th>
                  <th className="text-right px-1 text-orange-700">PC</th>
                  <th className="text-right pl-2">DEC</th>
                </tr>
              </thead>
              <tbody>
                {pitchers.map(p => {
                  const name = playerNames.get(p.playerId) ?? `#${p.playerId}`;
                  const fullInnings = Math.floor(p.outs / 3);
                  const partialOuts = p.outs % 3;
                  const ip = `${fullInnings}.${partialOuts}`;
                  const decColor = p.decision === 'W' ? 'text-green-400'
                    : p.decision === 'L' ? 'text-red-400'
                    : p.decision === 'S' ? 'text-cyan-400'
                    : p.decision === 'BS' ? 'text-red-500'
                    : 'text-gray-600';
                  return (
                    <tr key={p.playerId} className="text-gray-300">
                      <td className="text-left pr-2 truncate max-w-[8rem]">{name}</td>
                      <td className="text-right px-1 tabular-nums">{ip}</td>
                      <td className="text-right px-1 tabular-nums">{p.h}</td>
                      <td className="text-right px-1 tabular-nums">{p.r}</td>
                      <td className="text-right px-1 tabular-nums">{p.er}</td>
                      <td className="text-right px-1 tabular-nums">{p.bb}</td>
                      <td className="text-right px-1 tabular-nums">{p.k}</td>
                      <td className="text-right px-1 tabular-nums">{p.hr}</td>
                      <td className="text-right px-1 tabular-nums text-orange-400">{p.pitchCount}</td>
                      <td className={`text-right pl-2 font-bold ${decColor}`}>
                        {p.decision ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* ── Inning filter tabs ────────────────────────────────────── */}
      <div className="flex gap-1 px-4 py-2 border-b border-gray-800 overflow-x-auto">
        <button
          className={`px-2 py-1 text-xs rounded ${
            selectedInning === null ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
          onClick={() => setSelectedInning(null)}
        >
          ALL
        </button>
        {inningNumbers.map(i => (
          <button
            key={i}
            className={`px-2 py-1 text-xs rounded ${
              selectedInning === i ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
            onClick={() => setSelectedInning(i)}
          >
            {i}
          </button>
        ))}
      </div>

      {/* ── Play list ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5">
        {filteredPlays.map((play, idx) => {
          const label = OUTCOME_LABELS[play.result.outcome] ?? { text: play.result.outcome, color: 'text-gray-400' };
          const batterName = playerNames.get(play.batterId) ?? `#${play.batterId}`;
          const halfLabel = play.isTop ? `T${play.inning}` : `B${play.inning}`;

          return (
            <div
              key={idx}
              className="flex items-center gap-3 py-1 px-2 rounded hover:bg-gray-900 text-xs font-mono"
            >
              <span className="text-gray-600 w-6 shrink-0">{halfLabel}</span>
              <span className="text-gray-600 w-10 shrink-0">{outsDisplay(play.outs)}</span>
              <span className="text-gray-500 w-14 shrink-0">{runnerDiagram(play.runners)}</span>
              <span className="text-gray-300 w-32 truncate shrink-0">{batterName}</span>
              <span className={`font-bold ${label.color}`}>{label.text}</span>
              {play.result.runsScored > 0 && (
                <span className="text-yellow-400 ml-auto">
                  +{play.result.runsScored} run{play.result.runsScored > 1 ? 's' : ''}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

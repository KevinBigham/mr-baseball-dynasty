import { useState } from 'react';
import {
  letterGrade,
  FIX_IT_DRILLS,
  type FilmStudyReport,
  type FilmInsight,
  type FilmHighlight,
  type FixItDrill,
} from '../../engine/analytics/filmStudy';

function GradePill({ grade, label }: { grade: number; label: string }) {
  const letter = letterGrade(grade);
  const color = grade >= 85 ? 'text-green-400 bg-green-900/30' :
    grade >= 70 ? 'text-blue-400 bg-blue-900/30' :
    grade >= 55 ? 'text-orange-400 bg-orange-900/30' :
    'text-red-400 bg-red-900/30';
  return (
    <div className="bloomberg-border px-3 py-2 text-center">
      <div className="text-gray-500 text-[10px]">{label}</div>
      <div className={`text-2xl font-bold ${color} rounded px-2 py-0.5 mt-1`}>{letter}</div>
      <div className="text-gray-600 text-[10px] tabular-nums mt-0.5">{grade}/99</div>
    </div>
  );
}

function InsightRow({ insight }: { insight: FilmInsight }) {
  const gradeColor = insight.grade === 'A' || insight.grade === 'A+' ? 'text-green-400' :
    insight.grade === 'B' || insight.grade === 'B+' ? 'text-blue-400' :
    insight.grade === 'C' || insight.grade === 'C+' ? 'text-orange-400' :
    'text-red-400';
  return (
    <div className="flex items-start gap-2 px-3 py-1.5 text-xs border-b border-gray-800/30 last:border-0">
      <span className="text-base">{insight.emoji}</span>
      <span className="text-gray-300 flex-1">{insight.text}</span>
      <span className={`font-bold text-[10px] ${gradeColor}`}>{insight.grade}</span>
    </div>
  );
}

function HighlightRow({ highlight }: { highlight: FilmHighlight }) {
  return (
    <div className="flex items-start gap-2 px-3 py-1.5 text-xs border-b border-gray-800/30 last:border-0">
      <span className="text-base">{highlight.icon}</span>
      <span className="text-gray-300 flex-1">{highlight.text}</span>
    </div>
  );
}

function DrillCard({ drill }: { drill: FixItDrill }) {
  return (
    <div className="bloomberg-border px-3 py-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{drill.icon}</span>
        <span className="text-orange-300 font-bold text-xs">{drill.drill}</span>
      </div>
      <div className="text-gray-400 text-[10px]">{drill.action}</div>
    </div>
  );
}

interface PostGameReportProps {
  report: FilmStudyReport | null;
}

export default function PostGameReport({ report }: PostGameReportProps) {
  const [tab, setTab] = useState<'grades' | 'insights' | 'drills'>('grades');

  if (!report) {
    return (
      <div className="p-4 text-gray-500 text-xs">
        No post-game report available. Play a game to see the scouting analysis.
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>POST-GAME SCOUTING REPORT</span>
        <span className={`font-bold ${report.won ? 'text-green-400' : 'text-red-400'}`}>
          {report.userTeam} {report.userScore} — {report.oppTeam} {report.oppScore}
        </span>
      </div>

      {/* Result banner */}
      <div className={`bloomberg-border px-4 py-3 ${report.won ? 'border-green-800/50' : 'border-red-800/50'}`}>
        <div className={`text-sm font-bold ${report.won ? 'text-green-400' : 'text-red-400'}`}>
          {report.won ? 'W' : 'L'} — {report.margin === 0 ? 'TIE' : `by ${report.margin}`}
        </div>
        <div className="text-gray-400 text-xs mt-1">{report.turning}</div>
      </div>

      {/* Grade cards */}
      <div className="grid grid-cols-5 gap-3">
        <GradePill grade={report.overall} label="OVERALL" />
        <GradePill grade={report.grades.offense} label="OFFENSE" />
        <GradePill grade={report.grades.pitching} label="PITCHING" />
        <GradePill grade={report.grades.defense} label="DEFENSE" />
        <GradePill grade={report.grades.baserunning} label="BASERUNNING" />
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1">
        {(['grades', 'insights', 'drills'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1 text-xs font-bold rounded ${
              tab === t ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{t === 'grades' ? 'HIGHLIGHTS' : t.toUpperCase()}</button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bloomberg-border">
        {tab === 'grades' && (
          <>
            <div className="bloomberg-header">GAME HIGHLIGHTS</div>
            {report.highlights.length > 0 ? (
              report.highlights.map((h, i) => <HighlightRow key={i} highlight={h} />)
            ) : (
              <div className="px-4 py-4 text-gray-600 text-xs text-center">No standout highlights.</div>
            )}
          </>
        )}

        {tab === 'insights' && (
          <>
            <div className="bloomberg-header">SCOUTING INSIGHTS</div>
            {report.insights.map((ins, i) => <InsightRow key={i} insight={ins} />)}
          </>
        )}

        {tab === 'drills' && (
          <>
            <div className="bloomberg-header text-orange-400">FIX-IT DRILLS</div>
            {report.drills.length > 0 ? (
              <div className="p-2 grid grid-cols-2 gap-2">
                {report.drills.map((d, i) => <DrillCard key={i} drill={d} />)}
              </div>
            ) : (
              <div className="px-4 py-4 text-green-400 text-xs text-center">
                No fixes needed — solid performance across the board.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

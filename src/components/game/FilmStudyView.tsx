import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  letterGrade,
  gradeColor,
  generateDemoFilmStudy,
  type FilmStudyReport,
  type PhaseGrade,
} from '../../engine/game/filmStudy';

function GradeBox({ label, grade }: { label: string; grade: number }) {
  const letter = letterGrade(grade);
  return (
    <div className="bloomberg-border px-2 py-1.5 text-center">
      <div className="text-gray-600 text-[10px]">{label}</div>
      <div className="font-bold text-lg" style={{ color: gradeColor(grade) }}>{letter}</div>
      <div className="text-[10px] tabular-nums" style={{ color: gradeColor(grade) }}>{grade}</div>
    </div>
  );
}

function FilmCard({ report }: { report: FilmStudyReport }) {
  const overallColor = gradeColor(report.overall);
  const resultColor = report.won ? '#22c55e' : '#ef4444';

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border"
              style={{ borderColor: overallColor, color: overallColor, backgroundColor: overallColor + '11' }}>
              {letterGrade(report.overall)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs" style={{ color: resultColor }}>
                  {report.won ? 'W' : 'L'} {report.userScore}-{report.oppScore}
                </span>
                <span className="text-gray-400 text-[10px]">vs {report.oppTeam}</span>
              </div>
              <div className="text-gray-600 text-[10px]">{report.date}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] tabular-nums font-bold" style={{ color: overallColor }}>OVR {report.overall}</div>
          </div>
        </div>

        {/* Phase grades */}
        <div className="grid grid-cols-4 gap-1.5 mb-2">
          {(['pitching', 'hitting', 'fielding', 'baserunning'] as PhaseGrade[]).map(phase => (
            <GradeBox key={phase} label={phase.toUpperCase().slice(0, 5)} grade={report.grades[phase]} />
          ))}
        </div>

        {/* Pitcher and hitter lines */}
        <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
          <div className="bloomberg-border px-2 py-1">
            <div className="text-gray-600 font-bold mb-0.5">STARTER</div>
            <div className="text-orange-300">{report.pitcherLine.name}</div>
            <div className="text-gray-400">
              {report.pitcherLine.ip} IP, {report.pitcherLine.h} H, {report.pitcherLine.er} ER, {report.pitcherLine.k} K, {report.pitcherLine.bb} BB
            </div>
          </div>
          <div className="bloomberg-border px-2 py-1">
            <div className="text-gray-600 font-bold mb-0.5">TOP HITTER</div>
            <div className="text-orange-300">{report.topHitter.name}</div>
            <div className="text-gray-400">
              {report.topHitter.h}/{report.topHitter.ab}, {report.topHitter.hr} HR, {report.topHitter.rbi} RBI
            </div>
          </div>
        </div>

        {/* Insights */}
        {report.insights.map((insight, i) => (
          <div key={i} className="flex items-start gap-1.5 text-[10px] mb-1">
            <span>{insight.emoji}</span>
            <span className="text-gray-400">{insight.text}</span>
          </div>
        ))}

        {/* Turning point */}
        <div className="text-[10px] text-gray-600 mt-2 italic">
          {report.turningPoint}
        </div>

        {/* Key moment */}
        <div className="text-[10px] text-gray-500 mt-1">
          <span className="text-gray-600 font-bold">KEY: </span>{report.keyMoment}
        </div>
      </div>
    </div>
  );
}

export default function FilmStudyView() {
  const { gameStarted } = useGameStore();
  const [reports] = useState(() => generateDemoFilmStudy());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const avgOverall = Math.round(reports.reduce((s, r) => s + r.overall, 0) / reports.length);
  const wins = reports.filter(r => r.won).length;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>FILM STUDY</span>
        <span className="text-gray-600 text-[10px]">{reports.length} GAMES ANALYZED</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">RECORD</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{wins}-{reports.length - wins}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG GRADE</div>
          <div className="font-bold text-xl" style={{ color: gradeColor(avgOverall) }}>{letterGrade(avgOverall)}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG SCORE</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{avgOverall}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">GAMES</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{reports.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {reports.map(r => (
          <FilmCard key={r.id} report={r} />
        ))}
      </div>
    </div>
  );
}

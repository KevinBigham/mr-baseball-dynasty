import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  RELATIONSHIP_DISPLAY,
  generateDemoRelationships,
  generateDemoCliques,
  calculateCohesion,
  getCohesionLabel,
  getCohesionEffect,
  type PlayerRelationship,
  type Clique,
} from '../../engine/clubhouse/chemistryMatrix';

function CohesionMeter({ cohesion }: { cohesion: number }) {
  const { label, color } = getCohesionLabel(cohesion);
  const effects = getCohesionEffect(cohesion);
  return (
    <div className="bloomberg-border px-6 py-4 text-center">
      <div className="text-gray-500 text-[10px] mb-1">TEAM COHESION</div>
      <div className="text-5xl font-bold tabular-nums mb-1" style={{ color }}>{cohesion}</div>
      <div className="text-xs font-bold mb-2" style={{ color }}>{label.toUpperCase()}</div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden max-w-xs mx-auto mb-2">
        <div className="h-full rounded-full transition-all" style={{ width: `${cohesion}%`, backgroundColor: color }} />
      </div>
      <div className="flex items-center justify-center gap-3 text-[10px]">
        <span className={effects.ovrBonus >= 0 ? 'text-green-400' : 'text-red-400'}>
          {effects.ovrBonus > 0 ? '+' : ''}{effects.ovrBonus} OVR
        </span>
        <span className={effects.moraleBonus >= 0 ? 'text-green-400' : 'text-red-400'}>
          {effects.moraleBonus > 0 ? '+' : ''}{effects.moraleBonus} MORALE
        </span>
      </div>
    </div>
  );
}

function RelationshipRow({ rel }: { rel: PlayerRelationship }) {
  const info = RELATIONSHIP_DISPLAY[rel.type];
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800/30 last:border-0 text-xs">
      <span>{info.emoji}</span>
      <span className="text-orange-300 font-bold">{rel.playerA.name}</span>
      <span className="text-gray-700">&harr;</span>
      <span className="text-orange-300 font-bold">{rel.playerB.name}</span>
      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded ml-auto"
        style={{ backgroundColor: info.color + '22', color: info.color }}>
        {info.label}
      </span>
      <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${rel.strength}%`, backgroundColor: info.color }} />
      </div>
    </div>
  );
}

function CliqueCard({ clique }: { clique: Clique }) {
  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <span>{clique.emoji}</span>
            <span className="text-orange-300 font-bold text-sm">{clique.name}</span>
          </div>
          <span className="text-gray-600 text-[10px]">Influence: {clique.influence}%</span>
        </div>
        <div className="flex flex-wrap gap-1 mb-2">
          {clique.members.map(m => (
            <span key={m.id} className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-gray-800 text-gray-300">
              {m.name}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-gray-600">Chemistry:</span>
          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full" style={{ width: `${clique.chemistry}%` }} />
          </div>
          <span className="text-green-400 font-bold tabular-nums">{clique.chemistry}</span>
        </div>
      </div>
    </div>
  );
}

export default function ChemistryMatrixView() {
  const { gameStarted } = useGameStore();
  const [relationships] = useState(() => generateDemoRelationships());
  const [cliques] = useState(() => generateDemoCliques());
  const [tab, setTab] = useState<'relationships' | 'cliques'>('relationships');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const cohesion = calculateCohesion(relationships, cliques);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">CHEMISTRY MATRIX</div>

      {/* Cohesion + summary */}
      <div className="grid grid-cols-3 gap-3">
        <CohesionMeter cohesion={cohesion.overall} />
        <div className="bloomberg-border px-4 py-3 space-y-2">
          <div className="text-gray-500 text-[10px] font-bold">BREAKDOWN</div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Positive</span>
            <span className="text-green-400 font-bold">{cohesion.positiveRelationships}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Negative</span>
            <span className="text-red-400 font-bold">{cohesion.negativeRelationships}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Cliques</span>
            <span className="text-blue-400 font-bold">{cohesion.cliques}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Loners</span>
            <span className="text-gray-500 font-bold">{cohesion.lonerCount}</span>
          </div>
        </div>
        <div className="space-y-2">
          {cliques.slice(0, 2).map(c => <CliqueCard key={c.name} clique={c} />)}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1">
        <button onClick={() => setTab('relationships')}
          className={`px-3 py-1 text-xs font-bold rounded ${
            tab === 'relationships' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}>RELATIONSHIPS ({relationships.length})</button>
        <button onClick={() => setTab('cliques')}
          className={`px-3 py-1 text-xs font-bold rounded ${
            tab === 'cliques' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}>CLIQUES ({cliques.length})</button>
      </div>

      {tab === 'relationships' ? (
        <div className="bloomberg-border">
          <div className="bloomberg-header">ALL RELATIONSHIPS</div>
          {relationships.map((r, i) => <RelationshipRow key={i} rel={r} />)}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {cliques.map(c => <CliqueCard key={c.name} clique={c} />)}
        </div>
      )}
    </div>
  );
}

// Draft Board Rankings — comprehensive draft prospect ranking system
// Mr. Baseball Dynasty

export type DraftTier = 'elite' | 'plus' | 'solid' | 'depth' | 'flier';

export interface DraftProspect {
  prospectId: number;
  name: string;
  age: number;
  position: string;
  school: string;
  collegeOrHS: 'college' | 'hs';
  overallRank: number;
  positionRank: number;
  tier: DraftTier;
  signability: number; // 0-100
  slotValue: number; // dollars
  tools: { label: string; grade: number }[]; // 20-80 scale
  ceiling: string;
  risk: 'low' | 'medium' | 'high';
  scoutGrade: number; // 20-80
  eta: number;
  scouted: boolean;
}

export interface DraftBoardData {
  draftYear: number;
  topProspects: DraftProspect[];
  teamPicks: { round: number; overall: number; }[];
  classSummary: { college: number; hs: number; pitchers: number; hitters: number };
}

export function generateDemoDraftBoard(): DraftBoardData {
  const names = [
    'Zach Patterson', 'Eli Washington', 'Noah Kim', 'Liam O\'Sullivan',
    'Carter Brooks', 'Aiden Morales', 'Jackson Lee', 'Dylan Patel',
    'Owen Fitzgerald', 'Henry Nakamura', 'Chase Williams', 'Ethan Romero',
    'Luke Johansson', 'Ryan Alvarez', 'Jack Hendricks', 'Matt Suzuki',
    'Ben Taylor', 'Alex Rivera', 'Sam Choi', 'Will Anderson',
  ];
  const positions = ['RHP', 'SS', 'OF', 'LHP', '3B', 'C', 'OF', 'RHP', '1B', 'SS', 'OF', 'RHP', '2B', 'LHP', 'C', 'OF', 'RHP', 'SS', '3B', 'OF'];
  const schools = ['Stanford', 'Vanderbilt', 'IMG Academy', 'LSU', 'Oregon St', 'Calvary Christian', 'Florida', 'Texas A&M', 'Jupiter HS', 'Wake Forest',
    'Georgia', 'Auburn', 'Barbe HS', 'Virginia', 'Arizona St', 'TCU', 'UCLA', 'North Carolina', 'De La Salle', 'Ole Miss'];
  const tiers: DraftTier[] = ['elite', 'elite', 'plus', 'plus', 'plus', 'solid', 'solid', 'solid', 'solid', 'solid', 'depth', 'depth', 'depth', 'depth', 'depth', 'flier', 'flier', 'flier', 'flier', 'flier'];

  const topProspects: DraftProspect[] = names.map((name, i) => {
    const isPitcher = positions[i].includes('HP');
    const toolLabels = isPitcher
      ? ['Fastball', 'Breaking', 'Changeup', 'Command', 'Makeup']
      : ['Hit', 'Power', 'Speed', 'Arm', 'Field'];

    return {
      prospectId: 8000 + i,
      name,
      age: 18 + Math.floor(Math.random() * 4),
      position: positions[i],
      school: schools[i],
      collegeOrHS: schools[i].includes('HS') || schools[i].includes('Academy') || schools[i] === 'Calvary Christian' || schools[i] === 'De La Salle' ? 'hs' : 'college',
      overallRank: i + 1,
      positionRank: Math.floor(i / 3) + 1,
      tier: tiers[i],
      signability: i < 5 ? 90 + Math.floor(Math.random() * 10) : 50 + Math.floor(Math.random() * 45),
      slotValue: Math.floor(8000000 - i * 350000 + Math.random() * 200000),
      tools: toolLabels.map(label => ({
        label,
        grade: 35 + Math.floor(Math.random() * 40),
      })),
      ceiling: ['Ace', 'All-Star', 'Everyday', 'Above-Avg', 'Starter', 'Utility', 'Reliever', 'Org Depth'][Math.min(Math.floor(i / 3), 7)],
      risk: i < 7 ? 'low' : i < 14 ? 'medium' : 'high',
      scoutGrade: 75 - Math.floor(i * 2.5) + Math.floor(Math.random() * 5),
      eta: 2027 + Math.floor(Math.random() * 3),
      scouted: Math.random() > 0.3,
    };
  });

  return {
    draftYear: 2026,
    topProspects,
    teamPicks: [
      { round: 1, overall: 8 + Math.floor(Math.random() * 20) },
      { round: 2, overall: 38 + Math.floor(Math.random() * 20) },
      { round: 3, overall: 68 + Math.floor(Math.random() * 20) },
    ],
    classSummary: {
      college: topProspects.filter(p => p.collegeOrHS === 'college').length,
      hs: topProspects.filter(p => p.collegeOrHS === 'hs').length,
      pitchers: topProspects.filter(p => p.position.includes('HP')).length,
      hitters: topProspects.filter(p => !p.position.includes('HP')).length,
    },
  };
}

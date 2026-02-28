// Stadium Revenue Impact — analyzes how stadium features affect team revenue
// Mr. Baseball Dynasty

export type VenueFeature = 'premium_seating' | 'retractable_roof' | 'video_board' | 'craft_beer' | 'kids_zone' | 'club_level' | 'party_deck' | 'museum' | 'restaurant' | 'parking_garage';

export interface FeatureRevenue {
  feature: VenueFeature;
  label: string;
  installed: boolean;
  annualRevenue: number;
  cost: number;
  roi: number; // years to payback
  satisfactionImpact: number; // 0-100
}

export interface GameDayRevenue {
  category: string;
  perGame: number;
  perSeason: number;
  pctOfTotal: number;
  trend: 'up' | 'flat' | 'down';
}

export interface StadiumRevenueData {
  teamId: number;
  teamName: string;
  stadiumName: string;
  capacity: number;
  avgAttendance: number;
  attendancePct: number;
  totalRevenue: number;
  features: FeatureRevenue[];
  gameDayBreakdown: GameDayRevenue[];
  rankInLeague: number;
  revenuePerFan: number;
}

export function generateDemoStadiumRevenue(): StadiumRevenueData[] {
  const teams = [
    { name: 'New York Navigators', stadium: 'Navigator Field', cap: 45000 },
    { name: 'Los Angeles Stars', stadium: 'Starlight Park', cap: 56000 },
    { name: 'Chicago Windrunners', stadium: 'Gale Force Stadium', cap: 41000 },
    { name: 'Houston Oilmen', stadium: 'Derrick Dome', cap: 42000 },
    { name: 'Boston Harbormasters', stadium: 'Harbor Yard', cap: 37000 },
    { name: 'Atlanta Firebirds', stadium: 'Phoenix Arena', cap: 43000 },
  ];

  const featureLabels: Record<VenueFeature, string> = {
    premium_seating: 'Premium Seating',
    retractable_roof: 'Retractable Roof',
    video_board: 'HD Video Board',
    craft_beer: 'Craft Beer Garden',
    kids_zone: 'Kids Play Zone',
    club_level: 'Club Level Suites',
    party_deck: 'Party Deck',
    museum: 'Team Museum',
    restaurant: 'Sit-Down Restaurant',
    parking_garage: 'Parking Structure',
  };

  const allFeatures: VenueFeature[] = Object.keys(featureLabels) as VenueFeature[];

  return teams.map((t, i) => {
    const avgAtt = Math.floor(t.cap * (0.65 + Math.random() * 0.30));
    const attPct = +(avgAtt / t.cap * 100).toFixed(1);
    const revenuePerFan = 45 + Math.random() * 35;
    const totalRev = Math.floor(avgAtt * 81 * revenuePerFan);

    const features: FeatureRevenue[] = allFeatures.map(f => {
      const installed = Math.random() > 0.35;
      const annualRev = installed ? Math.floor(500000 + Math.random() * 4000000) : 0;
      const cost = Math.floor(5000000 + Math.random() * 40000000);
      return {
        feature: f,
        label: featureLabels[f],
        installed,
        annualRevenue: annualRev,
        cost,
        roi: installed ? +(cost / annualRev).toFixed(1) : 0,
        satisfactionImpact: Math.floor(30 + Math.random() * 60),
      };
    });

    const categories = ['Tickets', 'Concessions', 'Merchandise', 'Parking', 'Sponsorship', 'Premium/Suites'];
    const pcts = [35, 22, 15, 8, 12, 8];
    const trends: Array<'up' | 'flat' | 'down'> = ['up', 'flat', 'down'];

    const gameDayBreakdown: GameDayRevenue[] = categories.map((cat, j) => {
      const perSeason = Math.floor(totalRev * pcts[j] / 100);
      return {
        category: cat,
        perGame: Math.floor(perSeason / 81),
        perSeason,
        pctOfTotal: pcts[j],
        trend: trends[Math.floor(Math.random() * 3)],
      };
    });

    return {
      teamId: 200 + i,
      teamName: t.name,
      stadiumName: t.stadium,
      capacity: t.cap,
      avgAttendance: avgAtt,
      attendancePct: attPct,
      totalRevenue: totalRev,
      features,
      gameDayBreakdown,
      rankInLeague: i + 1,
      revenuePerFan: +revenuePerFan.toFixed(2),
    };
  });
}

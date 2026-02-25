// ─── Park factor profiles ─────────────────────────────────────────────────────
// 30 parks. All factors relative to 1.0 = neutral.
// hrFactor > 1.0 = hitter-friendly for HRs.
// babipFactor > 1.0 = more hits on balls in play (fast turf, large foul territory = low).

export interface ParkFactor {
  id: number;
  name: string;
  city: string;
  hrFactor: number;
  babipFactor: number;
  tripleFactor: number; // Large outfield gaps
  doubleFactor: number;
  kFactor: number;      // Some parks affect K rate (visibility, altitude)
  elevation: number;    // Feet above sea level (high altitude = more fly ball carry)
}

export const PARK_FACTORS: ParkFactor[] = [
  // High-elevation, hitter-friendly
  { id: 0,  name: 'Summit Park',       city: 'Mile High City',   hrFactor: 1.15, babipFactor: 1.02, tripleFactor: 1.10, doubleFactor: 1.05, kFactor: 0.98, elevation: 5280 },
  // Pitcher-friendly, large foul territory / good visibility
  { id: 1,  name: 'Coliseum',         city: 'Bay City',          hrFactor: 0.87, babipFactor: 0.96, tripleFactor: 0.90, doubleFactor: 0.95, kFactor: 1.02, elevation: 20 },
  // Classic pitcher's park
  { id: 2,  name: 'Harbor Field',     city: 'Port Adams',        hrFactor: 0.88, babipFactor: 0.97, tripleFactor: 0.92, doubleFactor: 0.96, kFactor: 1.01, elevation: 30 },
  // Hitter-friendly short porch
  { id: 3,  name: 'Shoreline Park',   city: 'New Harbor',        hrFactor: 1.12, babipFactor: 1.01, tripleFactor: 0.95, doubleFactor: 1.02, kFactor: 0.99, elevation: 10 },
  { id: 4,  name: 'Riverside Arena',  city: 'River City',        hrFactor: 0.95, babipFactor: 1.00, tripleFactor: 0.98, doubleFactor: 1.00, kFactor: 1.00, elevation: 600 },
  { id: 5,  name: 'National Park',    city: 'Capitol City',      hrFactor: 1.05, babipFactor: 1.01, tripleFactor: 1.05, doubleFactor: 1.03, kFactor: 0.99, elevation: 25 },
  { id: 6,  name: 'Lake Front Park',  city: 'Lake City',         hrFactor: 1.08, babipFactor: 0.99, tripleFactor: 0.94, doubleFactor: 1.00, kFactor: 1.00, elevation: 590 },
  { id: 7,  name: 'Green Monster',    city: 'Boston Bay',        hrFactor: 0.96, babipFactor: 1.02, tripleFactor: 0.85, doubleFactor: 1.12, kFactor: 0.99, elevation: 20 },
  { id: 8,  name: 'Canyon Field',     city: 'Sun Valley',        hrFactor: 1.06, babipFactor: 1.01, tripleFactor: 1.08, doubleFactor: 1.04, kFactor: 0.99, elevation: 1100 },
  { id: 9,  name: 'Dome Stadium',     city: 'Twin Peaks',        hrFactor: 0.94, babipFactor: 0.98, tripleFactor: 0.88, doubleFactor: 0.97, kFactor: 1.01, elevation: 830 },
  { id: 10, name: 'South Side Park',  city: 'South City',        hrFactor: 1.10, babipFactor: 1.00, tripleFactor: 0.93, doubleFactor: 0.99, kFactor: 0.99, elevation: 600 },
  { id: 11, name: 'Angel Field',      city: 'Anaheim Hills',     hrFactor: 1.00, babipFactor: 1.00, tripleFactor: 1.00, doubleFactor: 1.00, kFactor: 1.00, elevation: 160 },
  { id: 12, name: 'Tropics Dome',     city: 'Bay Harbor',        hrFactor: 0.91, babipFactor: 0.98, tripleFactor: 0.90, doubleFactor: 0.96, kFactor: 1.01, elevation: 50 },
  { id: 13, name: 'Great Plains Park',city: 'Prairie City',      hrFactor: 1.04, babipFactor: 1.01, tripleFactor: 1.06, doubleFactor: 1.02, kFactor: 1.00, elevation: 900 },
  { id: 14, name: 'Steel City Park',  city: 'Steel City',        hrFactor: 0.93, babipFactor: 0.99, tripleFactor: 1.05, doubleFactor: 1.02, kFactor: 1.00, elevation: 720 },
  { id: 15, name: 'Gateway Arch',     city: 'Gateway City',      hrFactor: 1.02, babipFactor: 1.00, tripleFactor: 0.96, doubleFactor: 1.01, kFactor: 1.00, elevation: 465 },
  { id: 16, name: 'Emerald Park',     city: 'Northwest City',    hrFactor: 0.90, babipFactor: 0.98, tripleFactor: 1.02, doubleFactor: 0.98, kFactor: 1.02, elevation: 20 },
  { id: 17, name: 'Sandstone Park',   city: 'Desert City',       hrFactor: 1.09, babipFactor: 1.01, tripleFactor: 1.04, doubleFactor: 1.03, kFactor: 0.99, elevation: 1080 },
  { id: 18, name: 'Red Rock Stadium', city: 'Red Rock City',     hrFactor: 1.03, babipFactor: 1.02, tripleFactor: 1.10, doubleFactor: 1.05, kFactor: 0.99, elevation: 250 },
  { id: 19, name: 'Harbor Lights',    city: 'Harbor Bay',        hrFactor: 0.94, babipFactor: 0.99, tripleFactor: 0.92, doubleFactor: 0.97, kFactor: 1.01, elevation: 15 },
  { id: 20, name: 'Peach Tree Park',  city: 'Peach City',        hrFactor: 1.07, babipFactor: 1.00, tripleFactor: 0.95, doubleFactor: 1.00, kFactor: 0.99, elevation: 1010 },
  { id: 21, name: 'Crown Field',      city: 'Crown City',        hrFactor: 0.97, babipFactor: 1.00, tripleFactor: 0.97, doubleFactor: 1.00, kFactor: 1.00, elevation: 910 },
  { id: 22, name: 'Blue Grass Park',  city: 'Blue Grass City',   hrFactor: 0.99, babipFactor: 1.01, tripleFactor: 1.02, doubleFactor: 1.01, kFactor: 1.00, elevation: 730 },
  { id: 23, name: 'Bayou Field',      city: 'Bayou City',        hrFactor: 1.11, babipFactor: 1.01, tripleFactor: 0.94, doubleFactor: 1.00, kFactor: 0.99, elevation: 50 },
  { id: 24, name: 'Glacier Park',     city: 'Glacier City',      hrFactor: 0.92, babipFactor: 0.97, tripleFactor: 1.08, doubleFactor: 1.02, kFactor: 1.01, elevation: 4300 },
  { id: 25, name: 'Palmetto Park',    city: 'Palmetto City',     hrFactor: 1.01, babipFactor: 1.00, tripleFactor: 0.96, doubleFactor: 0.99, kFactor: 1.00, elevation: 30 },
  { id: 26, name: 'Orchard Park',     city: 'Orchard City',      hrFactor: 0.98, babipFactor: 1.00, tripleFactor: 1.00, doubleFactor: 1.01, kFactor: 1.00, elevation: 220 },
  { id: 27, name: 'Brick Yard',       city: 'Brick City',        hrFactor: 1.04, babipFactor: 0.99, tripleFactor: 0.93, doubleFactor: 0.98, kFactor: 1.00, elevation: 710 },
  { id: 28, name: 'Swamp Stadium',    city: 'Swamp City',        hrFactor: 1.06, babipFactor: 1.01, tripleFactor: 0.94, doubleFactor: 0.99, kFactor: 0.99, elevation: 5 },
  { id: 29, name: 'Maple Leaf Park',  city: 'North Border',      hrFactor: 0.96, babipFactor: 0.99, tripleFactor: 0.97, doubleFactor: 0.99, kFactor: 1.00, elevation: 250 },
];

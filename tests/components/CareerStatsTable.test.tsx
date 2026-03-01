import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CareerStatsTable from '../../src/components/stats/CareerStatsTable';
import type { PlayerSeasonStats } from '../../src/types/player';

function makeSeason(overrides: Partial<PlayerSeasonStats> = {}): PlayerSeasonStats {
  return {
    playerId: 1, teamId: 1, season: 2026,
    g: 150, pa: 600, ab: 500, r: 90, h: 150,
    doubles: 30, triples: 5, hr: 25,
    rbi: 95, bb: 60, k: 120, sb: 15, cs: 5, hbp: 10,
    w: 0, l: 0, sv: 0, hld: 0, bs: 0,
    gp: 0, gs: 0, outs: 0,
    ha: 0, ra: 0, er: 0, bba: 0, ka: 0, hra: 0,
    pitchCount: 0,
    ...overrides,
  };
}

function makePitchingSeason(overrides: Partial<PlayerSeasonStats> = {}): PlayerSeasonStats {
  return {
    playerId: 2, teamId: 1, season: 2026,
    g: 0, pa: 0, ab: 0, r: 0, h: 0,
    doubles: 0, triples: 0, hr: 0,
    rbi: 0, bb: 0, k: 0, sb: 0, cs: 0, hbp: 0,
    w: 15, l: 8, sv: 0, hld: 0, bs: 0,
    gp: 32, gs: 32, outs: 600,
    ha: 180, ra: 70, er: 60, bba: 50, ka: 200, hra: 20,
    pitchCount: 3200,
    ...overrides,
  };
}

describe('CareerStatsTable — empty state', () => {
  it('shows empty message when no seasons', () => {
    render(<CareerStatsTable seasons={[]} isPitcher={false} />);
    expect(screen.getByText(/no career history yet/i)).toBeInTheDocument();
  });
});

describe('CareerStatsTable — hitting display', () => {
  it('renders hitting stats table with correct header', () => {
    const seasons = [makeSeason({ season: 2026 }), makeSeason({ season: 2027 })];
    render(<CareerStatsTable seasons={seasons} isPitcher={false} />);
    expect(screen.getByText('CAREER STATISTICS — 2 SEASONS')).toBeInTheDocument();
  });

  it('shows correct column headers for hitting', () => {
    render(<CareerStatsTable seasons={[makeSeason()]} isPitcher={false} />);
    expect(screen.getByText('AVG')).toBeInTheDocument();
    expect(screen.getByText('OBP')).toBeInTheDocument();
    expect(screen.getByText('HR')).toBeInTheDocument();
    expect(screen.getByText('RBI')).toBeInTheDocument();
    expect(screen.getByText('SB')).toBeInTheDocument();
  });

  it('renders the season year', () => {
    render(<CareerStatsTable seasons={[makeSeason({ season: 2026 })]} isPitcher={false} />);
    expect(screen.getByText('2026')).toBeInTheDocument();
  });

  it('renders totals row with year count', () => {
    const seasons = [makeSeason({ season: 2026 }), makeSeason({ season: 2027 })];
    render(<CareerStatsTable seasons={seasons} isPitcher={false} />);
    expect(screen.getByText('2yr')).toBeInTheDocument();
  });

  it('singular SEASON for one year', () => {
    render(<CareerStatsTable seasons={[makeSeason()]} isPitcher={false} />);
    expect(screen.getByText('CAREER STATISTICS — 1 SEASON')).toBeInTheDocument();
  });
});

describe('CareerStatsTable — pitching display', () => {
  it('shows pitching-specific columns', () => {
    render(<CareerStatsTable seasons={[makePitchingSeason()]} isPitcher={true} />);
    expect(screen.getByText('ERA')).toBeInTheDocument();
    expect(screen.getByText('IP')).toBeInTheDocument();
    expect(screen.getByText('WHIP')).toBeInTheDocument();
    expect(screen.getByText('W')).toBeInTheDocument();
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByText('SV')).toBeInTheDocument();
  });

  it('does not show hitting-specific columns for pitchers', () => {
    render(<CareerStatsTable seasons={[makePitchingSeason()]} isPitcher={true} />);
    expect(screen.queryByText('OBP')).not.toBeInTheDocument();
    expect(screen.queryByText('RBI')).not.toBeInTheDocument();
  });

  it('renders ERA value correctly', () => {
    // ERA = (60 / 600) * 27 = 2.70
    // Appears in both data row and totals row (1 season)
    render(<CareerStatsTable seasons={[makePitchingSeason()]} isPitcher={true} />);
    const cells = screen.getAllByText('2.70');
    expect(cells.length).toBe(2); // data row + totals row
  });

  it('renders IP value correctly', () => {
    // IP = 600 / 3 = 200.0
    // Appears in both data row and totals row (1 season)
    render(<CareerStatsTable seasons={[makePitchingSeason()]} isPitcher={true} />);
    const cells = screen.getAllByText('200.0');
    expect(cells.length).toBe(2); // data row + totals row
  });
});

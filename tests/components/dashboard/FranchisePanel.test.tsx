import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MoralePanel } from '../../../src/components/dashboard/FranchisePanel';

vi.mock('../../../src/store/gameStore', () => ({
  useGameStore: () => ({
    teamMorale: 45,
    userTeamId: 1,
  }),
}));

vi.mock('../../../src/store/leagueStore', () => ({
  useLeagueStore: () => ({
    teamChemistry: {
      teamId: 1,
      cohesion: 81,
      morale: 72,
      lastUpdatedSeason: 2026,
    },
    clubhouseEvents: [{
      eventId: 1,
      teamId: 1,
      season: 2026,
      kind: 'leadership_emergence',
      description: 'Veteran leaders have rallied the clubhouse. Team cohesion is rising.',
    }],
    newsItems: [],
  }),
}));

describe('MoralePanel', () => {
  it('renders worker chemistry morale, cohesion, and recent clubhouse event', () => {
    render(<MoralePanel />);
    expect(screen.getByText('72')).toBeInTheDocument();
    expect(screen.getByText('Cohesion')).toBeInTheDocument();
    expect(screen.getByText('81')).toBeInTheDocument();
    expect(screen.getByText(/Veteran leaders have rallied the clubhouse/i)).toBeInTheDocument();
  });
});

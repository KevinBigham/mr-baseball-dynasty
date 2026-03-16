import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlayoffBracket from '../../../src/components/dashboard/PlayoffBracket';

vi.mock('../../../src/store/gameStore', () => ({
  useGameStore: () => ({
    userTeamId: 1,
  }),
}));

vi.mock('../../../src/engine/engineClient', () => ({
  getEngine: () => ({
    getPlayoffMVP: vi.fn().mockResolvedValue(null),
  }),
}));

describe('PlayoffBracket', () => {
  it('renders an honest empty state for partial bracket payloads', () => {
    render(<PlayoffBracket bracket={{
      alTeams: [],
      nlTeams: [],
      wildCardRound: [] as any,
      divisionSeries: [] as any,
      championshipSeries: [] as any,
      worldSeries: null,
      championId: null,
      championName: null,
    }} />);

    expect(screen.getByText(/Postseason bracket data is not available/i)).toBeInTheDocument();
  });
});

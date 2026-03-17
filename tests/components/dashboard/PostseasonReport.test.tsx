import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import PostseasonReport from '../../../src/components/dashboard/PostseasonReport';
import { createEmptyAwardRaceData } from '../../../src/types/awardRace';

vi.mock('../../../src/store/gameStore', () => ({
  useGameStore: () => ({
    userTeamId: 1,
    gamePhase: 'postseason',
  }),
}));

vi.mock('../../../src/store/uiStore', () => {
  const setActiveTab = vi.fn();
  const addToast = vi.fn();
  const useUIStore = Object.assign(
    () => ({ setActiveTab }),
    { getState: () => ({ addToast }) },
  );
  return { useUIStore };
});

vi.mock('../../../src/engine/engineClient', () => ({
  getEngine: () => ({
    getAIRosterMoves: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock('../../../src/components/dashboard/SeasonHighlights', () => ({
  default: () => <div>Season Highlights Stub</div>,
}));

vi.mock('../../../src/components/dashboard/DevGradeCard', () => ({
  default: () => <div>Dev Grade Stub</div>,
}));

vi.mock('../../../src/components/dashboard/PlayoffBracket', () => ({
  default: () => <div>Playoff Bracket Stub</div>,
}));

vi.mock('../../../src/components/dashboard/AITransactionsPanel', () => ({
  default: () => <div>AI Transactions Stub</div>,
}));

describe('PostseasonReport', () => {
  it('renders safely when postseason-specific data is still empty', async () => {
    await act(async () => {
      render(
        <PostseasonReport
          lastResult={{
            season: 2026,
            teamSeasons: [],
            playerSeasons: [],
            boxScores: [],
            leagueBA: 0.251,
            leagueERA: 3.98,
            leagueRPG: 4.42,
            teamWinsSD: 8.7,
          }}
          lastBreakouts={0}
          lastBusts={0}
          playoffBracket={null}
          awardRaceData={createEmptyAwardRaceData()}
          onEnterOffseason={() => {}}
        />,
      );
    });

    expect(screen.getByText('AWARD RACE')).toBeInTheDocument();
    expect(screen.getByText(/Award race data appears during season simulation/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /FINAL STANDINGS/i })).toBeInTheDocument();
  });
});

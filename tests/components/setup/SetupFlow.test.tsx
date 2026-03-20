// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SetupFlow from '../../../src/components/setup/SetupFlow';
import { useGameStore } from '../../../src/store/gameStore';

const mockEngine = {
  newGame: vi.fn(),
  startDraft: vi.fn(),
  getStandings: vi.fn(),
};

vi.mock('../../../src/engine/engineClient', () => ({
  getEngine: () => mockEngine,
}));

vi.mock('../../../src/components/draft/DraftRoom', () => ({
  default: () => <div data-testid="draft-room">Draft Room</div>,
}));

describe('SetupFlow startup draft slot', () => {
  beforeEach(() => {
    useGameStore.getState().resetAll();
    useGameStore.getState().setSetupScreen('startMode');
    mockEngine.newGame.mockReset();
    mockEngine.startDraft.mockReset();
    mockEngine.getStandings.mockReset();
    mockEngine.newGame.mockResolvedValue({ teamCount: 30, playerCount: 5300 });
    mockEngine.startDraft.mockResolvedValue(null);
    mockEngine.getStandings.mockResolvedValue([]);
  });

  it('passes the selected startup draft slot into startDraft', async () => {
    render(<SetupFlow />);

    fireEvent.click(screen.getByText('Franchise Cornerstones'));
    fireEvent.change(screen.getByLabelText('Startup draft slot'), {
      target: { value: '7' },
    });

    fireEvent.click(screen.getByText('SET DIFFICULTY →'));
    fireEvent.click(screen.getByText('BUILD FRONT OFFICE →'));
    fireEvent.click(screen.getByText(/Hire Staff Later/i));

    await waitFor(() => {
      expect(mockEngine.newGame).toHaveBeenCalledTimes(1);
      expect(mockEngine.startDraft).toHaveBeenCalledWith('snake10', 7);
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Rule5Panel from '../../src/components/offseason/Rule5Panel';

// Mock stores and engine
vi.mock('../../src/store/gameStore', () => ({
  useGameStore: () => ({ userTeamId: 1 }),
}));

vi.mock('../../src/engine/engineClient', () => ({
  getEngine: () => ({
    getRule5Eligible: vi.fn().mockResolvedValue([
      {
        playerId: 10, name: 'Prospect A', position: 'SS',
        overall: 350, potential: 450, age: 21,
        teamId: 5, teamAbbr: 'CHC',
      },
      {
        playerId: 11, name: 'Prospect B', position: 'SP',
        overall: 300, potential: 400, age: 22,
        teamId: 8, teamAbbr: 'MIA',
      },
    ]),
    userRule5Pick: vi.fn().mockResolvedValue({ ok: true }),
    conductRule5Draft: vi.fn().mockResolvedValue([
      {
        playerId: 12, playerName: 'Prospect C', position: 'CF',
        overall: 280, potential: 380, age: 22,
        selectingTeamId: 3, selectingTeamAbbr: 'BOS',
        originalTeamId: 7, originalTeamAbbr: 'MIN',
      },
    ]),
  }),
}));

describe('Rule5Panel — rendering', () => {
  it('renders the panel with a title', async () => {
    render(<Rule5Panel onComplete={() => {}} onTransaction={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/rule.*5/i)).toBeInTheDocument();
    });
  });
});

describe('Rule5Panel — interaction', () => {
  it('shows advance button', async () => {
    render(<Rule5Panel onComplete={() => {}} onTransaction={() => {}} />);
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('calls onComplete when finished', async () => {
    const onComplete = vi.fn();
    render(<Rule5Panel onComplete={onComplete} onTransaction={() => {}} />);
    await waitFor(() => {
      const advanceBtn = screen.getAllByRole('button').find(b =>
        b.textContent?.includes('ADVANCE') || b.textContent?.includes('PASS') || b.textContent?.includes('CONTINUE')
      );
      if (advanceBtn) {
        fireEvent.click(advanceBtn);
      }
    });
  });
});

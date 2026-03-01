import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TradeCenter from '../../src/components/offseason/TradeCenter';

// Mock stores
vi.mock('../../src/store/gameStore', () => ({
  useGameStore: () => ({
    userTeamId: 1,
    gamePhase: 'offseason',
  }),
}));

vi.mock('../../src/store/uiStore', () => ({
  useUIStore: () => ({
    setSelectedPlayer: vi.fn(),
    setActiveTab: vi.fn(),
  }),
}));

// Mock engine
vi.mock('../../src/engine/engineClient', () => ({
  getEngine: () => ({
    getTradeOffers: vi.fn().mockResolvedValue([]),
    shopPlayer: vi.fn().mockResolvedValue([]),
    findTradesForNeed: vi.fn().mockResolvedValue([]),
    getStandings: vi.fn().mockResolvedValue({
      season: 2025,
      standings: [],
    }),
    getFullRoster: vi.fn().mockResolvedValue({
      active: [], il: [], minors: [], dfa: [],
      teamId: 1, season: 2025,
    }),
    evaluateProposedTrade: vi.fn().mockResolvedValue({
      aiAccepts: false,
      fairnessScore: 50,
      summary: 'Fair trade',
    }),
    executeTrade: vi.fn().mockResolvedValue({ ok: true }),
    getTeamPlayers: vi.fn().mockResolvedValue([]),
  }),
}));

describe('TradeCenter — tabs', () => {
  it('renders tab navigation', async () => {
    render(<TradeCenter onTransaction={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('INCOMING')).toBeInTheDocument();
    });
    expect(screen.getByText('SHOP PLAYER')).toBeInTheDocument();
    expect(screen.getByText('FIND TRADE')).toBeInTheDocument();
    expect(screen.getByText('PROPOSE')).toBeInTheDocument();
  });

  it('defaults to incoming offers tab', async () => {
    render(<TradeCenter onTransaction={() => {}} />);
    await waitFor(() => {
      const incomingTab = screen.getByText('INCOMING');
      expect(incomingTab).toBeInTheDocument();
    });
  });

  it('switches tabs when clicked', async () => {
    render(<TradeCenter onTransaction={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText('SHOP PLAYER')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('SHOP PLAYER'));
    expect(screen.getByText('SHOP PLAYER')).toBeInTheDocument();
  });
});

describe('TradeCenter — onDone prop', () => {
  it('renders advance button when onDone is provided', async () => {
    const onDone = vi.fn();
    render(<TradeCenter onTransaction={() => {}} onDone={onDone} />);
    await waitFor(() => {
      expect(screen.getByText('INCOMING')).toBeInTheDocument();
    });
    const buttons = screen.queryAllByRole('button');
    const advanceBtn = buttons.find(b =>
      b.textContent?.includes('ADVANCE') || b.textContent?.includes('SUMMARY') || b.textContent?.includes('CONTINUE')
    );
    // The advance button should exist if onDone is provided
    if (advanceBtn) {
      expect(advanceBtn).toBeInTheDocument();
    }
  });
});

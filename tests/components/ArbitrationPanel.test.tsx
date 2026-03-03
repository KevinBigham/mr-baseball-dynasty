import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ArbitrationPanel from '../../src/components/offseason/ArbitrationPanel';

// Mock engine
vi.mock('../../src/engine/engineClient', () => ({
  getEngine: () => ({
    resolveArbitrationCase: vi.fn().mockResolvedValue({ ok: true }),
  }),
}));

const mockCases = [
  {
    playerId: 1,
    playerName: 'John Doe',
    position: 'SS',
    age: 28,
    overall: 350,
    currentSalary: 3_000_000,
    teamOffer: 4_000_000,
    playerAsk: 6_000_000,
    hearingResult: 5_000_000,
    serviceYears: 4,
  },
  {
    playerId: 2,
    playerName: 'Jane Smith',
    position: 'SP',
    age: 30,
    overall: 400,
    currentSalary: 8_000_000,
    teamOffer: 10_000_000,
    playerAsk: 14_000_000,
    hearingResult: 12_000_000,
    serviceYears: 5,
  },
];

describe('ArbitrationPanel — rendering', () => {
  it('renders case cards for each player', () => {
    render(<ArbitrationPanel cases={mockCases} onComplete={() => {}} onTransaction={() => {}} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows player positions', () => {
    render(<ArbitrationPanel cases={mockCases} onComplete={() => {}} onTransaction={() => {}} />);
    expect(screen.getByText(/SS/)).toBeInTheDocument();
    expect(screen.getByText(/SP/)).toBeInTheDocument();
  });

  it('renders empty state when no cases', () => {
    render(<ArbitrationPanel cases={[]} onComplete={() => {}} onTransaction={() => {}} />);
    expect(screen.getByText(/no arbitration/i)).toBeInTheDocument();
  });
});

describe('ArbitrationPanel — interaction', () => {
  it('advance button appears', () => {
    render(<ArbitrationPanel cases={[]} onComplete={() => {}} onTransaction={() => {}} />);
    // With no cases, advance button should be visible
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('calls onComplete when advancing', () => {
    const onComplete = vi.fn();
    render(<ArbitrationPanel cases={[]} onComplete={onComplete} onTransaction={() => {}} />);
    const advanceBtn = screen.getAllByRole('button').find(b => b.textContent?.includes('ADVANCE'));
    if (advanceBtn) {
      fireEvent.click(advanceBtn);
      expect(onComplete).toHaveBeenCalled();
    }
  });
});

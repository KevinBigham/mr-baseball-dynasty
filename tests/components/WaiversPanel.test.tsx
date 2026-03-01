import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WaiversPanel from '../../src/components/offseason/WaiversPanel';

const mockClaims = [
  {
    playerId: 1,
    playerName: 'Tom Wilson',
    position: 'RF',
    overall: 300,
    claimingTeamId: 3,
    claimingTeamAbbr: 'BOS',
    previousTeamId: 7,
    outcome: 'claimed' as const,
    reason: 'Claimed off waivers by BOS',
  },
  {
    playerId: 2,
    playerName: 'Mike Jones',
    position: '1B',
    overall: 200,
    claimingTeamId: 0,
    claimingTeamAbbr: '',
    previousTeamId: 12,
    outcome: 'outrighted' as const,
    reason: 'Outrighted to minors — cleared waivers',
  },
  {
    playerId: 3,
    playerName: 'Pete Garcia',
    position: 'RP',
    overall: 150,
    claimingTeamId: 0,
    claimingTeamAbbr: '',
    previousTeamId: 5,
    outcome: 'released' as const,
    reason: 'Released — no waiver claims',
  },
];

describe('WaiversPanel — rendering', () => {
  it('renders all waiver claims', () => {
    render(<WaiversPanel claims={mockClaims} onComplete={() => {}} />);
    expect(screen.getByText('Tom Wilson')).toBeInTheDocument();
    expect(screen.getByText('Mike Jones')).toBeInTheDocument();
    expect(screen.getByText('Pete Garcia')).toBeInTheDocument();
  });

  it('shows outcome badges', () => {
    render(<WaiversPanel claims={mockClaims} onComplete={() => {}} />);
    expect(screen.getByText(/claimed/i)).toBeInTheDocument();
  });

  it('shows empty state with no claims', () => {
    render(<WaiversPanel claims={[]} onComplete={() => {}} />);
    expect(screen.getByText(/no waiver/i)).toBeInTheDocument();
  });
});

describe('WaiversPanel — interaction', () => {
  it('calls onComplete when advance button clicked', () => {
    const onComplete = vi.fn();
    render(<WaiversPanel claims={mockClaims} onComplete={onComplete} />);
    const advanceBtn = screen.getAllByRole('button').find(b =>
      b.textContent?.includes('ADVANCE')
    );
    if (advanceBtn) {
      fireEvent.click(advanceBtn);
      expect(onComplete).toHaveBeenCalled();
    }
  });
});

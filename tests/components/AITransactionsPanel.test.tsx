import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AITransactionsPanel from '../../src/components/dashboard/AITransactionsPanel';
import type { AIRosterMove } from '../../src/engine/aiRosterManager';

function makeMove(overrides: Partial<AIRosterMove> = {}): AIRosterMove {
  return {
    teamId: 2,
    teamAbbr: 'NYY',
    type: 'call_up',
    playerId: 1,
    playerName: 'John Smith',
    playerPosition: 'SS',
    playerOvr: 350,
    fromStatus: 'MINORS_AAA',
    toStatus: 'MLB_ACTIVE',
    reason: 'Called up to fill SS gap from IL',
    ...overrides,
  };
}

describe('AITransactionsPanel — empty state', () => {
  it('shows no transactions message when moves is empty', () => {
    render(<AITransactionsPanel moves={[]} />);
    expect(screen.getByText(/no ai roster moves/i)).toBeInTheDocument();
  });
});

describe('AITransactionsPanel — rendering moves', () => {
  it('displays player name', () => {
    render(<AITransactionsPanel moves={[makeMove()]} />);
    expect(screen.getByText('John Smith')).toBeInTheDocument();
  });

  it('displays team abbreviation', () => {
    render(<AITransactionsPanel moves={[makeMove()]} />);
    expect(screen.getByText('NYY')).toBeInTheDocument();
  });

  it('displays move type badge', () => {
    render(<AITransactionsPanel moves={[makeMove({ type: 'call_up' })]} />);
    expect(screen.getByText('CALL-UP')).toBeInTheDocument();
  });

  it('shows option badge for optioned players', () => {
    render(<AITransactionsPanel moves={[makeMove({ type: 'option' })]} />);
    expect(screen.getByText('OPTIONED')).toBeInTheDocument();
  });

  it('shows DFA badge', () => {
    render(<AITransactionsPanel moves={[makeMove({ type: 'dfa' })]} />);
    expect(screen.getByText('DFA')).toBeInTheDocument();
  });

  it('displays move count in header', () => {
    const moves = [makeMove(), makeMove({ playerId: 2, playerName: 'Jane Doe' })];
    render(<AITransactionsPanel moves={moves} />);
    const matches = screen.getAllByText('2 moves');
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

describe('AITransactionsPanel — grouping by team', () => {
  it('groups moves by team', () => {
    const moves = [
      makeMove({ teamAbbr: 'NYY', teamId: 1, playerName: 'Player A' }),
      makeMove({ teamAbbr: 'BOS', teamId: 2, playerName: 'Player B' }),
      makeMove({ teamAbbr: 'NYY', teamId: 1, playerName: 'Player C' }),
    ];
    render(<AITransactionsPanel moves={moves} />);
    expect(screen.getByText('Player A')).toBeInTheDocument();
    expect(screen.getByText('Player B')).toBeInTheDocument();
    expect(screen.getByText('Player C')).toBeInTheDocument();
  });
});

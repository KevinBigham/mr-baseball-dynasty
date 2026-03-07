import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActionQueuePanel from '../../../src/components/home/ActionQueuePanel';
import type { ActionQueueTask } from '../../../src/types/briefing';

function makeTask(overrides: Partial<ActionQueueTask> = {}): ActionQueueTask {
  return {
    id: 'test-1', category: 'general', priority: 'medium',
    title: 'Test Task', subtitle: 'Test subtitle',
    icon: '📋', actionLabel: 'GO', actionTab: 'roster',
    ...overrides,
  };
}

describe('ActionQueuePanel', () => {
  it('renders empty state when no tasks', () => {
    render(<ActionQueuePanel tasks={[]} onNavigate={vi.fn()} />);
    expect(screen.getByText('No pending actions.')).toBeTruthy();
    expect(screen.getByText(/Your roster is legal/)).toBeTruthy();
  });

  it('shows CLEAR badge when no tasks', () => {
    render(<ActionQueuePanel tasks={[]} onNavigate={vi.fn()} />);
    expect(screen.getByText('CLEAR')).toBeTruthy();
  });

  it('renders task items', () => {
    const tasks = [
      makeTask({ id: '1', title: 'ROSTER OVER LIMIT', priority: 'critical' }),
      makeTask({ id: '2', title: 'Low Morale', priority: 'medium' }),
    ];
    render(<ActionQueuePanel tasks={tasks} onNavigate={vi.fn()} />);
    expect(screen.getByText('ROSTER OVER LIMIT')).toBeTruthy();
    expect(screen.getByText('Low Morale')).toBeTruthy();
  });

  it('shows correct item count badge', () => {
    const tasks = [makeTask({ id: '1' }), makeTask({ id: '2' }), makeTask({ id: '3' })];
    render(<ActionQueuePanel tasks={tasks} onNavigate={vi.fn()} />);
    expect(screen.getByText('3 ITEMS')).toBeTruthy();
  });

  it('shows singular ITEM for one task', () => {
    render(<ActionQueuePanel tasks={[makeTask()]} onNavigate={vi.fn()} />);
    expect(screen.getByText('1 ITEM')).toBeTruthy();
  });

  it('limits display to 6 tasks', () => {
    const tasks = Array.from({ length: 8 }, (_, i) =>
      makeTask({ id: `t-${i}`, title: `Task ${i}` })
    );
    render(<ActionQueuePanel tasks={tasks} onNavigate={vi.fn()} />);
    expect(screen.getByText('Task 0')).toBeTruthy();
    expect(screen.getByText('Task 5')).toBeTruthy();
    expect(screen.queryByText('Task 6')).toBeNull();
  });

  it('calls onNavigate when action button clicked', () => {
    const navigate = vi.fn();
    const tasks = [makeTask({ actionTab: 'roster' })];
    render(<ActionQueuePanel tasks={tasks} onNavigate={navigate} />);
    fireEvent.click(screen.getByText('GO'));
    expect(navigate).toHaveBeenCalledWith('roster');
  });

  it('shows deadline when present', () => {
    const tasks = [makeTask({ deadline: 'Before next sim' })];
    render(<ActionQueuePanel tasks={tasks} onNavigate={vi.fn()} />);
    expect(screen.getByText('Before next sim')).toBeTruthy();
  });

  it('empty state explains what/why/what-next', () => {
    render(<ActionQueuePanel tasks={[]} onNavigate={vi.fn()} />);
    const emptyText = screen.getByText(/Simulate games or explore strategy/);
    expect(emptyText).toBeTruthy();
  });
});

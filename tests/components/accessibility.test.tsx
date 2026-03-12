import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the zustand store used by MobileNav
vi.mock('../../src/store/uiStore', () => ({
  useUIStore: () => ({
    activeTab: 'home',
    navigate: vi.fn(),
    setActiveTab: vi.fn(),
  }),
}));

import MobileNav from '../../src/components/layout/MobileNav';
import { SkeletonTable, SkeletonProfile } from '../../src/components/layout/Skeleton';

describe('MobileNav accessibility', () => {
  it('renders 5 pillar tab buttons', () => {
    render(<MobileNav />);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(5);
  });

  it('nav has role="navigation" with aria-label', () => {
    render(<MobileNav />);
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav).toBeInTheDocument();
  });

  it('tab buttons have min-h-[56px] for accessible tap target', () => {
    render(<MobileNav />);
    const buttons = screen.getAllByRole('button');
    for (const button of buttons) {
      expect(button.className).toContain('min-h-[56px]');
    }
  });

  it('active tab has aria-current="page"', () => {
    render(<MobileNav />);
    const homeButton = screen.getByText('HOME').closest('button')!;
    expect(homeButton).toHaveAttribute('aria-current', 'page');
  });
});

describe('Skeleton accessibility', () => {
  it('SkeletonTable renders with bloomberg-border', () => {
    const { container } = render(<SkeletonTable />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain('bloomberg-border');
  });

  it('SkeletonProfile renders expected structure with multiple sections', () => {
    const { container } = render(<SkeletonProfile />);
    const outer = container.firstElementChild!;
    // Should have the profile header card and a stats table — both with bloomberg-border
    const bloombergElements = outer.querySelectorAll('.bloomberg-border');
    expect(bloombergElements.length).toBeGreaterThanOrEqual(2);
    // The avatar placeholder should have animate-pulse
    const pulseElements = outer.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });
});

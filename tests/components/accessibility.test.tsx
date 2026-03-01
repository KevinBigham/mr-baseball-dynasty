import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the zustand store used by MobileNav
vi.mock('../../src/store/uiStore', () => ({
  useUIStore: () => ({
    activeTab: 'dashboard',
    setActiveTab: vi.fn(),
  }),
}));

import MobileNav from '../../src/components/layout/MobileNav';
import { SkeletonTable, SkeletonProfile } from '../../src/components/layout/Skeleton';

describe('MobileNav accessibility', () => {
  it('button has aria-label="Toggle navigation menu" and aria-expanded', () => {
    render(<MobileNav />);
    const button = screen.getByRole('button', { name: 'Toggle navigation menu' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', 'mobile-nav-menu');
  });

  it('button has min-h-[44px] for accessible tap target', () => {
    render(<MobileNav />);
    const button = screen.getByRole('button', { name: 'Toggle navigation menu' });
    expect(button.className).toContain('min-h-[44px]');
  });

  it('nav has role="navigation" with aria-label', () => {
    render(<MobileNav />);
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(nav).toBeInTheDocument();
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

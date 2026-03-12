import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  SkeletonLine,
  SkeletonTable,
  SkeletonCard,
  SkeletonProfile,
} from '../../src/components/layout/Skeleton';

describe('SkeletonLine', () => {
  it('renders with animate-pulse', () => {
    const { container } = render(<SkeletonLine />);
    const el = container.firstElementChild!;
    expect(el.className).toContain('animate-pulse');
  });
});

describe('SkeletonTable', () => {
  it('renders correct number of rows', () => {
    const { container } = render(<SkeletonTable rows={7} cols={4} />);
    // Each row is a flex container with gap-3 inside the p-3 space-y-2.5 div
    const rowsContainer = container.querySelector('.space-y-2\\.5')!;
    const rows = rowsContainer.querySelectorAll(':scope > .flex');
    expect(rows).toHaveLength(7);
  });

  it('renders with bloomberg-border class', () => {
    const { container } = render(<SkeletonTable />);
    const wrapper = container.firstElementChild!;
    expect(wrapper.className).toContain('bloomberg-border');
  });
});

describe('SkeletonCard', () => {
  it('renders with bloomberg-border', () => {
    const { container } = render(<SkeletonCard />);
    const el = container.firstElementChild!;
    expect(el.className).toContain('bloomberg-border');
  });
});

describe('SkeletonProfile', () => {
  it('renders expected structure', () => {
    const { container } = render(<SkeletonProfile />);
    // Should render the outer div with space-y-4
    const outer = container.firstElementChild!;
    expect(outer.className).toContain('space-y-4');
    // Should contain a bloomberg-border card and a SkeletonTable
    const bloombergBorders = outer.querySelectorAll('.bloomberg-border');
    // The profile card + the table inside SkeletonTable
    expect(bloombergBorders.length).toBeGreaterThanOrEqual(2);
  });
});

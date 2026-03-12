import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from '../../src/components/layout/ConfirmModal';

describe('ConfirmModal', () => {
  it('renders the message text', () => {
    render(
      <ConfirmModal
        message="Are you sure you want to trade?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText('Are you sure you want to trade?')).toBeDefined();
  });

  it('renders optional title', () => {
    render(
      <ConfirmModal
        title="CONFIRM TRADE"
        message="This will execute the trade."
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByText('CONFIRM TRADE')).toBeDefined();
  });

  it('fires onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        message="Confirm action?"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    );
    fireEvent.click(screen.getByText('CONFIRM'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('fires onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmModal
        message="Cancel action?"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByText('CANCEL'));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

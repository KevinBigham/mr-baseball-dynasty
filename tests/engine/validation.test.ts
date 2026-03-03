import { describe, it, expect } from 'vitest';

// ─── Validation logic extracted from the worker API ─────────────────────────
// signFreeAgent and offerExtension both clamp years/salary the same way.
// We test the clamping/validation logic directly here.

function validateContract(
  years: number,
  salary: number,
): { years: number; salary: number } | null {
  if (isNaN(years) || isNaN(salary)) return null;
  return {
    years: Math.max(1, Math.min(10, Math.round(years))),
    salary: Math.max(0.5, salary),
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('contract validation', () => {
  it('salary must be at least 0.5M', () => {
    const result = validateContract(2, 0.1);
    expect(result).not.toBeNull();
    expect(result!.salary).toBe(0.5);
  });

  it('years must be between 1 and 10', () => {
    const tooLow = validateContract(0, 5);
    expect(tooLow).not.toBeNull();
    expect(tooLow!.years).toBe(1);

    const tooHigh = validateContract(15, 5);
    expect(tooHigh).not.toBeNull();
    expect(tooHigh!.years).toBe(10);

    const inRange = validateContract(5, 5);
    expect(inRange).not.toBeNull();
    expect(inRange!.years).toBe(5);
  });

  it('NaN salary is rejected', () => {
    const result = validateContract(3, NaN);
    expect(result).toBeNull();
  });

  it('NaN years is rejected', () => {
    const result = validateContract(NaN, 10);
    expect(result).toBeNull();
  });

  it('years are rounded to integers', () => {
    const result = validateContract(3.7, 5);
    expect(result).not.toBeNull();
    expect(result!.years).toBe(4);

    const result2 = validateContract(2.2, 5);
    expect(result2).not.toBeNull();
    expect(result2!.years).toBe(2);
  });
});

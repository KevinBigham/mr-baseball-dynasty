/**
 * Shared grade utilities for converting internal player attributes (0–550)
 * to the scouting display scale (20–80) and providing heat-map color coding.
 *
 * Heat map gradient: red(20) → orange(35) → yellow(50) → lime(65) → green(80)
 */

/** Convert internal attribute value (0–550) to scouting grade (20–80). */
export function toGrade(internal: number): number {
  return Math.round(20 + (internal / 550) * 60);
}

/** Convert scouting grade (20–80) back to internal value (0–550). */
export function fromGrade(grade: number): number {
  return Math.round(((grade - 20) / 60) * 550);
}

/**
 * Returns an inline CSS background-color for a heat-map gradient.
 * 20 = deep red, 35 = orange, 50 = yellow, 65 = lime, 80 = bright green.
 * Uses HSL interpolation: hue goes from 0 (red) → 60 (yellow) → 120 (green).
 */
export function gradeHeatBg(grade: number): string {
  const clamped = Math.max(20, Math.min(80, grade));
  // Map 20–80 → 0–1
  const t = (clamped - 20) / 60;
  // Hue: 0 (red) → 120 (green)
  const hue = Math.round(t * 120);
  // Saturation: constant 85%
  // Lightness: darker at extremes (38%), brighter in middle (42%) for readability on dark bg
  const lightness = 28 + Math.round(t * (1 - t) * 40);
  return `hsl(${hue}, 80%, ${lightness}%)`;
}

/**
 * Returns text color for contrast against the heat-map background.
 * All grades use white text since backgrounds are dark enough.
 */
export function gradeTextColor(_grade: number): string {
  return '#fff';
}

/**
 * Returns Tailwind-compatible inline style object for a grade cell.
 */
export function gradeStyle(grade: number): React.CSSProperties {
  return {
    backgroundColor: gradeHeatBg(grade),
    color: gradeTextColor(grade),
  };
}

/**
 * Grade label helpers for tooltips / screen readers.
 */
export function gradeLabel(grade: number): string {
  if (grade >= 75) return 'Elite';
  if (grade >= 65) return 'Plus';
  if (grade >= 55) return 'Above Avg';
  if (grade >= 45) return 'Average';
  if (grade >= 35) return 'Below Avg';
  return 'Poor';
}

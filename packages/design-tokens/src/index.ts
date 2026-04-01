/**
 * @mbd/design-tokens
 * Canonical design tokens for Mr. Baseball Dynasty.
 */

export { dynasty, accent } from './colors';
export type { DynastyColor, AccentColor } from './colors';

export { fontFamily, fontSize, fontWeight } from './typography';
export type { FontSizeEntry, FontFamily, FontSize, FontWeight } from './typography';

export { spacing } from './spacing';
export type { SpacingKey } from './spacing';

export { shadows } from './shadows';
export type { ShadowLevel } from './shadows';

export { density } from './density';
export type { DensityConfig, DensityMode } from './density';

export { default as mbdPreset, mbdPreset as tailwindPreset } from './tailwind-preset';

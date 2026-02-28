/**
 * Weather simulation for game effects.
 *
 * Temperature and wind affect HR rate and ball carry:
 * - Hot weather (85°F+): ball carries further, HR rate increases
 * - Cold weather (45°F-): ball dies faster, HR rate decreases
 * - Wind out to CF: HR rate increases
 * - Wind in from CF: HR rate decreases
 *
 * Weather is derived deterministically from the game seed and date
 * so it doesn't consume PRNG values (preserving the game's random chain).
 */

export interface GameWeather {
  temperature: number;  // °F
  windDirection: 'out' | 'in' | 'crosswind' | 'calm';
  windSpeed: number;    // mph
}

// Simple hash for deterministic weather (doesn't touch PRNG)
function simpleHash(seed: number, extra: number): number {
  let h = seed ^ extra;
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 13), 0x45d9f3b);
  h = (h ^ (h >>> 16)) >>> 0;
  return (h % 10000) / 10000; // 0-1 range
}

/**
 * Generate weather conditions for a game.
 *
 * @param gameSeed Game seed (for deterministic variation)
 * @param month 1-12 (from game date)
 * @param isDome Whether the park has a dome/retractable roof
 */
export function generateWeather(
  gameSeed: number,
  month: number,
  isDome: boolean,
): GameWeather {
  if (isDome) {
    return { temperature: 72, windDirection: 'calm', windSpeed: 0 };
  }

  // Base temperature by month (MLB season: March-October)
  const monthTemp: Record<number, number> = {
    3: 52, 4: 60, 5: 68, 6: 78, 7: 84, 8: 82, 9: 74, 10: 60,
  };
  const baseTemp = monthTemp[month] ?? 72;

  // Deterministic variation: ±12°F
  const tempHash = simpleHash(gameSeed, 1);
  const temperature = Math.round(baseTemp + (tempHash - 0.5) * 24);

  // Wind direction
  const windHash = simpleHash(gameSeed, 2);
  const windDirection: GameWeather['windDirection'] =
    windHash < 0.20 ? 'out' :
    windHash < 0.40 ? 'in' :
    windHash < 0.70 ? 'crosswind' : 'calm';

  // Wind speed: 0-20 mph
  const speedHash = simpleHash(gameSeed, 3);
  const windSpeed = windDirection === 'calm' ? 0 : Math.round(speedHash * 18 + 2);

  return { temperature, windDirection, windSpeed };
}

/**
 * Get the HR rate modifier from weather conditions.
 *
 * @returns Multiplier on HR rate (> 1 = more HRs, < 1 = fewer)
 */
export function getWeatherHRModifier(weather: GameWeather): number {
  // Temperature effect: each degree above 70°F adds ~0.1% to HR rate
  // (70°F baseline aligns with the season-average temperature)
  const tempDelta = (weather.temperature - 70) * 0.001;

  // Wind effect
  let windEffect = 0;
  if (weather.windDirection === 'out') {
    windEffect = weather.windSpeed * 0.003;
  } else if (weather.windDirection === 'in') {
    windEffect = -weather.windSpeed * 0.003;
  }

  const modifier = 1.0 + tempDelta + windEffect;
  return Math.max(0.92, Math.min(1.08, modifier));
}

/**
 * Extract month from a date string (YYYY-MM-DD format).
 */
export function getMonthFromDate(date: string): number {
  const parts = date.split('-');
  return parseInt(parts[1] ?? '7', 10);
}

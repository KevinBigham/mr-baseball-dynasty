// ─── Weather Impact ───────────────────────────────────────────────────────
// Game conditions, wind effects, temperature impacts, and rain delays.

export type WeatherCondition = 'clear' | 'partly_cloudy' | 'overcast' | 'rain' | 'drizzle' | 'hot' | 'cold' | 'windy' | 'dome';

export interface GameWeather {
  condition: WeatherCondition;
  temperature: number;     // °F
  humidity: number;        // %
  windSpeed: number;       // mph
  windDirection: 'in' | 'out' | 'cross_l' | 'cross_r' | 'calm';
  rainChance: number;      // %
  rainDelayMinutes: number;
}

export interface WeatherEffect {
  hrModifier: number;      // % change
  flyBallModifier: number;
  pitchGripPenalty: number;
  speedModifier: number;
  label: string;
}

export const CONDITION_DISPLAY: Record<WeatherCondition, { label: string; emoji: string; color: string }> = {
  clear:         { label: 'Clear Skies', emoji: '☀️', color: '#eab308' },
  partly_cloudy: { label: 'Partly Cloudy', emoji: '⛅', color: '#94a3b8' },
  overcast:      { label: 'Overcast', emoji: '☁️', color: '#6b7280' },
  rain:          { label: 'Rain', emoji: '🌧️', color: '#3b82f6' },
  drizzle:       { label: 'Drizzle', emoji: '🌦️', color: '#60a5fa' },
  hot:           { label: 'Scorching Hot', emoji: '🔥', color: '#ef4444' },
  cold:          { label: 'Cold', emoji: '🥶', color: '#06b6d4' },
  windy:         { label: 'Windy', emoji: '💨', color: '#a855f7' },
  dome:          { label: 'Dome (Controlled)', emoji: '🏟️', color: '#22c55e' },
};

export const WIND_LABELS: Record<string, string> = {
  in: 'Blowing In',
  out: 'Blowing Out',
  cross_l: 'L-to-R Cross',
  cross_r: 'R-to-L Cross',
  calm: 'Calm',
};

export function calculateWeatherEffect(weather: GameWeather): WeatherEffect {
  let hrMod = 0;
  let flyMod = 0;
  let gripPenalty = 0;
  let speedMod = 0;
  const labels: string[] = [];

  // Wind effects
  if (weather.windDirection === 'out' && weather.windSpeed >= 10) {
    hrMod += Math.min(25, Math.floor(weather.windSpeed * 1.5));
    flyMod += Math.min(15, Math.floor(weather.windSpeed * 0.8));
    labels.push(`Wind out +${hrMod}% HR`);
  }
  if (weather.windDirection === 'in' && weather.windSpeed >= 10) {
    hrMod -= Math.min(20, Math.floor(weather.windSpeed * 1.2));
    labels.push(`Wind in ${hrMod}% HR`);
  }

  // Temperature effects (heat = ball carries, cold = dead ball)
  if (weather.temperature >= 90) {
    hrMod += 8;
    labels.push('Heat: ball carries');
  }
  if (weather.temperature <= 50) {
    hrMod -= 10;
    gripPenalty += 2;
    labels.push('Cold: dead ball + grip issues');
  }

  // Humidity
  if (weather.humidity >= 80) {
    hrMod -= 5;
    labels.push('Heavy air');
  }

  // Rain/drizzle
  if (weather.condition === 'rain' || weather.condition === 'drizzle') {
    gripPenalty += weather.condition === 'rain' ? 5 : 2;
    speedMod -= weather.condition === 'rain' ? 3 : 1;
    labels.push('Wet conditions');
  }

  // Dome neutralizes everything
  if (weather.condition === 'dome') {
    return { hrModifier: 0, flyBallModifier: 0, pitchGripPenalty: 0, speedModifier: 0, label: 'Controlled environment' };
  }

  return {
    hrModifier: hrMod,
    flyBallModifier: flyMod,
    pitchGripPenalty: gripPenalty,
    speedModifier: speedMod,
    label: labels.length > 0 ? labels.join(' | ') : 'Normal conditions',
  };
}

// ─── Demo data ────────────────────────────────────────────────────────────

export function generateDemoForecasts(): { game: string; weather: GameWeather; effects: WeatherEffect }[] {
  const forecasts: { game: string; weather: GameWeather }[] = [
    { game: 'NYY vs BOS', weather: { condition: 'hot', temperature: 95, humidity: 65, windSpeed: 15, windDirection: 'out', rainChance: 5, rainDelayMinutes: 0 } },
    { game: 'LAD vs SFG', weather: { condition: 'windy', temperature: 62, humidity: 70, windSpeed: 22, windDirection: 'in', rainChance: 10, rainDelayMinutes: 0 } },
    { game: 'CHC vs STL', weather: { condition: 'clear', temperature: 78, humidity: 45, windSpeed: 8, windDirection: 'cross_l', rainChance: 0, rainDelayMinutes: 0 } },
    { game: 'COL vs ARI', weather: { condition: 'dome', temperature: 72, humidity: 40, windSpeed: 0, windDirection: 'calm', rainChance: 0, rainDelayMinutes: 0 } },
    { game: 'SEA vs MIN', weather: { condition: 'rain', temperature: 55, humidity: 92, windSpeed: 12, windDirection: 'cross_r', rainChance: 80, rainDelayMinutes: 45 } },
    { game: 'CLE vs DET', weather: { condition: 'cold', temperature: 42, humidity: 60, windSpeed: 18, windDirection: 'in', rainChance: 15, rainDelayMinutes: 0 } },
  ];

  return forecasts.map(f => ({
    ...f,
    effects: calculateWeatherEffect(f.weather),
  }));
}

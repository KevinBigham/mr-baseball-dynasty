import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  CONDITION_DISPLAY,
  WIND_LABELS,
  generateDemoForecasts,
  type GameWeather,
  type WeatherEffect,
} from '../../engine/game/weatherImpact';

function WeatherCard({ game, weather, effects }: { game: string; weather: GameWeather; effects: WeatherEffect }) {
  const condInfo = CONDITION_DISPLAY[weather.condition];
  const windLabel = WIND_LABELS[weather.windDirection];

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-orange-300 font-bold text-sm">{game}</span>
          <div className="flex items-center gap-1">
            <span>{condInfo.emoji}</span>
            <span className="text-xs font-bold" style={{ color: condInfo.color }}>{condInfo.label}</span>
          </div>
        </div>

        {/* Weather stats */}
        <div className="grid grid-cols-4 gap-2 text-[10px] mb-2">
          <div>
            <div className="text-gray-600">TEMP</div>
            <div className="text-gray-300 tabular-nums">{weather.temperature}°F</div>
          </div>
          <div>
            <div className="text-gray-600">HUMIDITY</div>
            <div className="text-gray-300 tabular-nums">{weather.humidity}%</div>
          </div>
          <div>
            <div className="text-gray-600">WIND</div>
            <div className="text-gray-300 tabular-nums">{weather.windSpeed} mph</div>
          </div>
          <div>
            <div className="text-gray-600">DIRECTION</div>
            <div className="text-gray-300">{windLabel}</div>
          </div>
        </div>

        {/* Effects */}
        <div className="space-y-1 text-[10px]">
          {effects.hrModifier !== 0 && (
            <div className="flex items-center gap-1">
              <span>💣</span>
              <span className={effects.hrModifier > 0 ? 'text-green-400' : 'text-red-400'}>
                HR {effects.hrModifier > 0 ? '+' : ''}{effects.hrModifier}%
              </span>
            </div>
          )}
          {effects.pitchGripPenalty > 0 && (
            <div className="flex items-center gap-1">
              <span>⚾</span>
              <span className="text-red-400">Grip penalty: -{effects.pitchGripPenalty}</span>
            </div>
          )}
          {effects.speedModifier !== 0 && (
            <div className="flex items-center gap-1">
              <span>💨</span>
              <span className="text-red-400">Speed: {effects.speedModifier}</span>
            </div>
          )}
          {weather.rainChance > 30 && (
            <div className="flex items-center gap-1">
              <span>🌧️</span>
              <span className="text-blue-400">{weather.rainChance}% rain chance</span>
              {weather.rainDelayMinutes > 0 && (
                <span className="text-yellow-400 ml-1">({weather.rainDelayMinutes} min delay expected)</span>
              )}
            </div>
          )}
        </div>

        <div className="text-gray-500 text-[10px] mt-2 italic">{effects.label}</div>
      </div>
    </div>
  );
}

export default function WeatherView() {
  const { gameStarted } = useGameStore();
  const [forecasts] = useState(() => generateDemoForecasts());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const hrImpactGames = forecasts.filter(f => Math.abs(f.effects.hrModifier) >= 5);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>WEATHER CONDITIONS</span>
        <span className="text-gray-600 text-[10px]">{forecasts.length} GAMES TODAY</span>
      </div>

      {/* Alerts */}
      {hrImpactGames.length > 0 && (
        <div className="bloomberg-border border-orange-800/50 px-4 py-2">
          <div className="text-orange-400 text-[10px] font-bold mb-1">⚠️ HR IMPACT ALERTS</div>
          {hrImpactGames.map(f => (
            <div key={f.game} className="text-xs text-gray-300">
              {f.game}: <span className={f.effects.hrModifier > 0 ? 'text-green-400' : 'text-red-400'}>
                {f.effects.hrModifier > 0 ? '+' : ''}{f.effects.hrModifier}% HR
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Forecast cards */}
      <div className="grid grid-cols-2 gap-3">
        {forecasts.map(f => (
          <WeatherCard key={f.game} game={f.game} weather={f.weather} effects={f.effects} />
        ))}
      </div>
    </div>
  );
}

import { addOverlays } from '../condition-overlays';
import { fetchJson } from '../http';
import type { Place } from '../location';
import { formatHour } from '../time';
import type { DailyForecast, HourlyForecast, ProviderWeather, WeatherData } from '../weather-data';
import { conditionsFromWmoCode } from '../wmo-condition';

type OpenMeteoResponse = {
  utc_offset_seconds: number;
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    weather_code: number;
    wind_speed_10m: number;
    is_day: number;
    uv_index?: number;
  };
  hourly: {
    time: number[];
    temperature_2m: number[];
    apparent_temperature: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    precipitation_probability: number[];
    is_day: number[];
    uv_index: number[];
  };
  // Day by day from today, in the location's time zone.
  daily: {
    // Unix seconds at the start of each day.
    time: number[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    snowfall_sum: number[];
    // Unix seconds; [0] is today, [1] tomorrow.
    sunrise: number[];
    sunset: number[];
  };
};

const HOURS_AHEAD = 12;
const DAYS = 5;

// Primary source. Free, no API key, worldwide: https://open-meteo.com/en/docs
export async function fetchOpenMeteo(place: Place): Promise<ProviderWeather> {
  const params = [
    `latitude=${place.latitude}`,
    `longitude=${place.longitude}`,
    'current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day,uv_index',
    'hourly=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation_probability,is_day,uv_index',
    'daily=weather_code,temperature_2m_max,temperature_2m_min,snowfall_sum,sunrise,sunset',
    'temperature_unit=fahrenheit',
    'wind_speed_unit=mph',
    // Snowfall in inches.
    'precipitation_unit=inch',
    'timezone=auto',
    'timeformat=unixtime',
    // The first hourly entry is the current hour, followed by the next 12.
    `forecast_hours=${HOURS_AHEAD + 1}`,
    // Today and the next four days.
    `forecast_days=${DAYS}`,
  ].join('&');

  const { current, hourly, daily, utc_offset_seconds } = await fetchJson<OpenMeteoResponse>(
    `https://api.open-meteo.com/v1/forecast?${params}`,
  );

  const hours: HourlyForecast[] = hourly.time.map((seconds, i) => ({
    time: seconds * 1000,
    // Shift into the location's time zone, then read the hour as UTC.
    hourLabel: formatHour(new Date((seconds + utc_offset_seconds) * 1000).getUTCHours()),
    conditions: addOverlays(conditionsFromWmoCode(hourly.weather_code[i]), {
      windSpeed: hourly.wind_speed_10m[i],
      feelsLike: hourly.apparent_temperature[i],
    }),
    isDay: hourly.is_day[i] === 1,
    temperature: Math.round(hourly.temperature_2m[i]),
    rainChance: hourly.precipitation_probability[i] ?? 0,
  }));

  return {
    source: 'open-meteo',
    locationName: place.name,
    updatedAt: Date.now(),
    current: {
      conditions: addOverlays(conditionsFromWmoCode(current.weather_code), {
        windSpeed: current.wind_speed_10m,
        feelsLike: current.apparent_temperature,
      }),
      isDay: current.is_day === 1,
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: Math.round(current.relative_humidity_2m),
      windSpeed: Math.round(current.wind_speed_10m),
      rainChance: hours[0]?.rainChance ?? 0,
      // Current UV, or this hour's if the current value is missing.
      uvIndex: roundOrNull(current.uv_index ?? hourly.uv_index?.[0]),
      // Today's total, to one decimal.
      snowToday: roundOrNull(daily?.snowfall_sum?.[0], 1),
    },
    hourly: hours.slice(1, HOURS_AHEAD + 1),
    daily: toDays(daily, utc_offset_seconds),
    sun: toSunTimes(daily),
  };
}

function toDays(daily: OpenMeteoResponse['daily'] | undefined, utcOffsetSeconds: number): DailyForecast[] {
  if (!daily?.time) return [];
  return daily.time.slice(0, DAYS).flatMap((seconds, i) => {
    const high = daily.temperature_2m_max?.[i];
    const low = daily.temperature_2m_min?.[i];
    const code = daily.weather_code?.[i];
    if (high == null || low == null || code == null) return [];
    return [
      {
        // Shift into the location's time zone, then read the date as UTC.
        date: new Date((seconds + utcOffsetSeconds) * 1000).toISOString().slice(0, 10),
        conditions: conditionsFromWmoCode(code),
        high: Math.round(high),
        low: Math.round(low),
      },
    ];
  });
}

// Today's sunrise and sunset and tomorrow's sunrise, or undefined if any is
// missing (the app then calculates them).
function toSunTimes(daily: OpenMeteoResponse['daily'] | undefined): WeatherData['sun'] {
  const [sunrise, tomorrowSunrise] = daily?.sunrise ?? [];
  const sunset = daily?.sunset?.[0];
  if (!sunrise || !sunset || !tomorrowSunrise) return undefined;
  return { sunrise: sunrise * 1000, sunset: sunset * 1000, tomorrowSunrise: tomorrowSunrise * 1000 };
}

// Rounds to the given decimals, or null if the value is missing.
function roundOrNull(value: number | null | undefined, decimals = 0): number | null {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

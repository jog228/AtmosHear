import { addOverlays } from '../condition-overlays';
import { feelsLikeF } from '../feels-like';
import { fetchJson } from '../http';
import type { Place } from '../location';
import { conditionsFromNwsForecast } from '../nws-condition';
import { formatHour } from '../time';
import type { ConditionId } from '@/constants/conditions';

import type { CurrentWeather, DailyForecast, HourlyForecast, ProviderWeather } from '../weather-data';

// Backup source. US only, no API key, but NWS requires a User-Agent.
// Docs: https://www.weather.gov/documentation/services-web-api
const BASE_URL = 'https://api.weather.gov';
const HEADERS = {
  'User-Agent': 'AtmosHear/1.0 (DES 156 class project)',
  Accept: 'application/geo+json',
};
const HOURS_AHEAD = 12;
const DAYS = 3;

type PointsResponse = {
  properties: { forecastHourly: string };
};

type NwsPeriod = {
  startTime: string; // "2026-10-13T11:00:00-04:00"
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: 'F' | 'C';
  probabilityOfPrecipitation: { value: number | null } | null;
  relativeHumidity: { value: number | null } | null;
  windSpeed: string; // "10 mph" or "5 to 10 mph"
  shortForecast: string; // "Chance Light Rain"
};

type HourlyResponse = {
  properties: { periods: NwsPeriod[] };
};

export async function fetchNws(place: Place): Promise<ProviderWeather> {
  // NWS wants at most 4 decimal places.
  const lat = Number(place.latitude.toFixed(4));
  const lon = Number(place.longitude.toFixed(4));

  const points = await fetchJson<PointsResponse>(`${BASE_URL}/points/${lat},${lon}`, { headers: HEADERS });
  const hourly = await fetchJson<HourlyResponse>(points.properties.forecastHourly, { headers: HEADERS });

  // Skip any hours that have already ended.
  const now = Date.now();
  const periods = hourly.properties.periods.filter((period) => Date.parse(period.endTime) > now);
  if (periods.length === 0) throw new Error('NWS returned no current forecast');

  const [currentPeriod, ...upcoming] = periods;

  return {
    source: 'nws',
    locationName: place.name,
    updatedAt: now,
    current: toCurrent(currentPeriod),
    hourly: upcoming.slice(0, HOURS_AHEAD).map(toHour),
    daily: toDays(periods),
  };
}

// NWS's hourly forecast runs about a week ahead, so the 3-day forecast comes
// from grouping its hours by day (no extra request). Today only counts the
// hours left, so its high or low can be missing earlier hours.
function toDays(periods: NwsPeriod[]): DailyForecast[] {
  const byDate = new Map<string, NwsPeriod[]>();
  for (const period of periods) {
    // startTime is in the location's time zone: "2026-10-13".
    const date = period.startTime.slice(0, 10);
    byDate.set(date, [...(byDate.get(date) ?? []), period]);
  }
  return [...byDate].slice(0, DAYS).map(([date, hours]) => {
    const temperatures = hours.map(toFahrenheit);
    const daytime = hours.filter((hour) => hour.isDaytime);
    return {
      date,
      conditions: [mostCommon((daytime.length > 0 ? daytime : hours).map((hour) => conditionsFromNwsForecast(hour.shortForecast)[0]))],
      high: Math.max(...temperatures),
      low: Math.min(...temperatures),
    };
  });
}

// The condition that covers the most hours (ties: the earliest).
function mostCommon(ids: ConditionId[]): ConditionId {
  const counts = new Map<ConditionId, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts].reduce((best, entry) => (entry[1] > best[1] ? entry : best))[0];
}

function toCurrent(period: NwsPeriod): CurrentWeather {
  const temperature = toFahrenheit(period);
  const humidity = Math.round(period.relativeHumidity?.value ?? 0);
  const windSpeed = parseWindSpeed(period.windSpeed);
  const feelsLike = feelsLikeF(temperature, humidity, windSpeed);

  return {
    conditions: addOverlays(conditionsFromNwsForecast(period.shortForecast), { windSpeed, feelsLike }),
    isDay: period.isDaytime,
    temperature,
    feelsLike,
    humidity,
    windSpeed,
    rainChance: period.probabilityOfPrecipitation?.value ?? 0,
    // The hourly forecast has no UV or snowfall amounts: unavailable.
    uvIndex: null,
    snowToday: null,
  };
}

function toHour(period: NwsPeriod): HourlyForecast {
  const { conditions, isDay, temperature, rainChance } = toCurrent(period);
  return {
    time: Date.parse(period.startTime),
    // startTime is already in the location's time zone: read "HH" directly.
    hourLabel: formatHour(Number(period.startTime.slice(11, 13))),
    conditions,
    isDay,
    temperature,
    rainChance,
  };
}

function toFahrenheit(period: NwsPeriod): number {
  const value = period.temperatureUnit === 'C' ? (period.temperature * 9) / 5 + 32 : period.temperature;
  return Math.round(value);
}

// "10 mph" -> 10, "5 to 10 mph" -> 10 (the higher end, so wind isn't
// understated), "" -> 0.
export function parseWindSpeed(text: string): number {
  const numbers = text.match(/\d+/g)?.map(Number) ?? [];
  return numbers.length > 0 ? Math.max(...numbers) : 0;
}

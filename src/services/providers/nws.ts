import { addOverlays } from '../condition-overlays';
import { feelsLikeF } from '../feels-like';
import { fetchJson } from '../http';
import type { Place } from '../location';
import { conditionsFromNwsForecast } from '../nws-condition';
import { formatHour } from '../time';
import type { CurrentWeather, HourlyForecast, WeatherData } from '../weather-data';

// Backup source. US only, no API key, but NWS requires a User-Agent.
// Docs: https://www.weather.gov/documentation/services-web-api
const BASE_URL = 'https://api.weather.gov';
const HEADERS = {
  'User-Agent': 'AtmosHear/1.0 (DES 156 class project)',
  Accept: 'application/geo+json',
};
const HOURS_AHEAD = 12;

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

export async function fetchNws(place: Place): Promise<WeatherData> {
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
  };
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

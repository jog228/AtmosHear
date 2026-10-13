import type { ConditionId } from '@/constants/conditions';

// Maps an NWS forecast phrase (e.g. "Chance Light Rain", "Rain And Snow",
// "Mostly Cloudy and Breezy") to our conditions, most important first.
//
// Words like "Chance" and "Likely" are ignored: the rain chance percentage
// already says how likely it is.
export function conditionsFromNwsForecast(shortForecast: string): ConditionId[] {
  // "Rain Showers then Sunny" describes a change; the first part is now.
  const text = shortForecast.toLowerCase().split(' then ')[0];
  const has = (...phrases: string[]) => phrases.some((phrase) => text.includes(phrase));
  const conditions: ConditionId[] = [];

  // Precipitation, most severe first.
  const thunder = has('thunderstorm', 't-storm');
  const sleet = has('freezing', 'sleet', 'ice pellets', 'wintry mix', 'rain and snow', 'snow and rain');
  const snow = !sleet && has('snow', 'flurries', 'blizzard');
  if (thunder) conditions.push('thunderstorm');
  if (sleet) conditions.push('sleet');
  if (snow) conditions.push('snow');
  // Thunderstorms already include rain, sleet covers freezing rain, and
  // "Snow Showers" is snow, not rain.
  if (!thunder && !sleet) {
    if (has('heavy rain')) conditions.push('heavy-rain');
    else if (has('rain', 'drizzle') || (!snow && has('showers'))) conditions.push('light-rain');
  }

  if (has('fog', 'haze', 'smoke', 'mist')) conditions.push('fog');

  // Sky cover only matters when nothing is falling.
  if (conditions.length === 0) {
    if (has('partly')) conditions.push('partly-cloudy');
    else if (has('cloudy', 'overcast')) conditions.push('overcast');
    else if (has('sunny', 'clear', 'fair')) conditions.push('clear');
  }

  if (has('breezy', 'windy', 'blustery', 'blowing', 'gust')) conditions.push('wind');
  if (/\bhot\b/.test(text)) conditions.push('extreme-heat');
  if (has('cold', 'frigid')) conditions.push('extreme-cold');

  return conditions.length > 0 ? conditions : ['overcast'];
}

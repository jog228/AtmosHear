// US EPA Air Quality Index levels. `label` is the short card text,
// `name` the full name VoiceOver reads.
export const AQI_LEVELS = [
  { id: 'good', max: 50, label: 'Good', name: 'Good' },
  { id: 'moderate', max: 100, label: 'Moderate', name: 'Moderate' },
  { id: 'sensitive', max: 150, label: 'Sensitive', name: 'Unhealthy for sensitive groups' },
  { id: 'unhealthy', max: 200, label: 'Unhealthy', name: 'Unhealthy' },
  { id: 'very-unhealthy', max: 300, label: 'Very unhealthy', name: 'Very unhealthy' },
  { id: 'hazardous', max: Infinity, label: 'Hazardous', name: 'Hazardous' },
] as const;

export type AqiLevel = (typeof AQI_LEVELS)[number]['id'];

export function aqiLevel(aqi: number): AqiLevel {
  return AQI_LEVELS.find((level) => aqi <= level.max)!.id;
}

export function getAqiLevel(id: AqiLevel) {
  return AQI_LEVELS.find((level) => level.id === id)!;
}

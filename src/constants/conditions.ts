export const CONDITION_IDS = [
  'clear',
  'partly-cloudy',
  'overcast',
  'light-rain',
  'heavy-rain',
  'thunderstorm',
  'snow',
  'sleet',
  'fog',
  'wind',
  'extreme-heat',
  'extreme-cold',
  'severe-alert',
] as const;

export type ConditionId = (typeof CONDITION_IDS)[number];

import type { ConditionId } from './conditions';

// Swap these values when the visual style is finalized. Every text color here
// is checked for WCAG AA (4.5:1) against both `background` and `card`.
export const colors = {
  background: '#E8EDF2',
  card: '#FFFFFF',
  text: '#16202B',
  textMuted: '#4A5563',
  shadow: '#1B2A3A',
  onAccent: '#FFFFFF',
};

// One accent per condition. Each must reach 4.5:1 with `onAccent` (white),
// because the Play button puts white text on it.
export const conditionAccents: Record<ConditionId, string> = {
  'clear': '#B45309',
  'partly-cloudy': '#2563A8',
  'overcast': '#4B5563',
  'light-rain': '#1F6F9F',
  'heavy-rain': '#1E3A8A',
  'thunderstorm': '#6D28D9',
  'snow': '#0E7490',
  'sleet': '#4A5E7A',
  'fog': '#5B6472',
  'wind': '#0F766E',
  'extreme-heat': '#C2410C',
  'extreme-cold': '#1D4ED8',
  'severe-alert': '#B91C1C',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const radius = { md: 16, lg: 24, pill: 999 };

export const cardShadow = {
  boxShadow: `0 4px 16px ${colors.shadow}14`,
};

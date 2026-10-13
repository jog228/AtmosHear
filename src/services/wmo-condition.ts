import type { ConditionId } from '@/constants/conditions';

// Maps a WMO weather code (used by Open-Meteo) to one of our conditions.
// Code table: https://open-meteo.com/en/docs (see "WMO Weather interpretation codes").
export function conditionFromWmoCode(code: number): ConditionId {
  switch (code) {
    case 0:
    case 1: // mainly clear
      return 'clear';
    case 2:
      return 'partly-cloudy';
    case 3:
      return 'overcast';
    case 45:
    case 48: // depositing rime fog
      return 'fog';
    case 51:
    case 53:
    case 55: // drizzle
    case 61:
    case 63: // slight / moderate rain
    case 80:
    case 81: // slight / moderate showers
      return 'light-rain';
    case 65:
    case 82: // heavy rain / violent showers
      return 'heavy-rain';
    case 56:
    case 57: // freezing drizzle
    case 66:
    case 67: // freezing rain
      return 'sleet';
    case 71:
    case 73:
    case 75:
    case 77: // snow grains
    case 85:
    case 86: // snow showers
      return 'snow';
    case 95:
    case 96:
    case 99: // thunderstorm, with or without hail
      return 'thunderstorm';
    default:
      return 'overcast';
  }
}

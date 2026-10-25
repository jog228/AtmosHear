import { conditionIconDots as dots } from './condition-shapes';
import { dotIcon } from './dot-icon';

// One dotted icon per condition (src/constants/conditions.ts). The dots
// are in condition-shapes.ts.

export const ClearIcon = dotIcon('ClearIcon', dots.clear);
export const PartlyCloudyIcon = dotIcon('PartlyCloudyIcon', dots['partly-cloudy']);
export const OvercastIcon = dotIcon('OvercastIcon', dots.overcast);
export const LightRainIcon = dotIcon('LightRainIcon', dots['light-rain']);
export const HeavyRainIcon = dotIcon('HeavyRainIcon', dots['heavy-rain']);
export const ThunderstormIcon = dotIcon('ThunderstormIcon', dots.thunderstorm);
export const SnowIcon = dotIcon('SnowIcon', dots.snow);
export const SleetIcon = dotIcon('SleetIcon', dots.sleet);
export const HailIcon = dotIcon('HailIcon', dots.hail);
export const FogIcon = dotIcon('FogIcon', dots.fog);
export const WindIcon = dotIcon('WindIcon', dots.wind);
export const ExtremeHeatIcon = dotIcon('ExtremeHeatIcon', dots['extreme-heat']);
export const ExtremeColdIcon = dotIcon('ExtremeColdIcon', dots['extreme-cold']);
export const SevereAlertIcon = dotIcon('SevereAlertIcon', dots['severe-alert']);

import * as Location from 'expo-location';

export type Place = {
  latitude: number;
  longitude: number;
  name: string;
  // ISO country code, e.g. "US", for the automatic °F / °C choice. Null
  // if unknown.
  countryCode: string | null;
  isFallback: boolean;
};

export const FALLBACK_PLACE: Place = {
  latitude: 40.6259,
  longitude: -75.3705,
  name: 'Bethlehem, PA',
  countryCode: 'US',
  isFallback: true,
};

const LOCATION_TIMEOUT_MS = 10_000;

// Returns the user's location, or Bethlehem, PA if permission is denied or
// the location can't be found in time.
export async function getPlace(): Promise<Place> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return FALLBACK_PLACE;

    const position =
      (await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 })) ??
      (await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        LOCATION_TIMEOUT_MS,
      ));

    const { latitude, longitude } = position.coords;
    return { latitude, longitude, ...(await describePlace(latitude, longitude)), isFallback: false };
  } catch {
    return FALLBACK_PLACE;
  }
}

// The phone's last known position, without asking for permission or
// waiting for GPS (works offline), or Bethlehem, PA. For sunrise and sunset
// times, which don't need precision.
export async function lastKnownCoordinates(): Promise<{ latitude: number; longitude: number }> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return FALLBACK_PLACE;
    const position = await Location.getLastKnownPositionAsync();
    return position?.coords ?? FALLBACK_PLACE;
  } catch {
    return FALLBACK_PLACE;
  }
}

async function describePlace(latitude: number, longitude: number): Promise<Pick<Place, 'name' | 'countryCode'>> {
  try {
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    const name = [address?.city ?? address?.subregion, address?.region].filter(Boolean).join(', ');
    return { name: name || 'Your location', countryCode: address?.isoCountryCode ?? null };
  } catch {
    return { name: 'Your location', countryCode: null };
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Location timed out')), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

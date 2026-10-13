import * as Location from 'expo-location';

export type Place = {
  latitude: number;
  longitude: number;
  name: string;
  isFallback: boolean;
};

export const FALLBACK_PLACE: Place = {
  latitude: 40.6259,
  longitude: -75.3705,
  name: 'Bethlehem, PA',
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
    return { latitude, longitude, name: await getPlaceName(latitude, longitude), isFallback: false };
  } catch {
    return FALLBACK_PLACE;
  }
}

async function getPlaceName(latitude: number, longitude: number): Promise<string> {
  try {
    const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
    const name = [address?.city ?? address?.subregion, address?.region].filter(Boolean).join(', ');
    return name || 'Your location';
  } catch {
    return 'Your location';
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Location timed out')), ms);
    promise.then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

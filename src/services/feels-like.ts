// NWS doesn't send a "feels like" temperature, so we calculate it with the
// same formulas NWS uses: heat index when hot, wind chill when cold.
// https://www.weather.gov/safety/heat-index, https://www.weather.gov/safety/cold-wind-chill-chart
export function feelsLikeF(temperatureF: number, humidity: number, windMph: number): number {
  const t = temperatureF;

  if (t >= 80) {
    const rh = humidity;
    return Math.round(
      -42.379 +
        2.04901523 * t +
        10.14333127 * rh -
        0.22475541 * t * rh -
        0.00683783 * t * t -
        0.05481717 * rh * rh +
        0.00122874 * t * t * rh +
        0.00085282 * t * rh * rh -
        0.00000199 * t * t * rh * rh,
    );
  }

  if (t <= 50 && windMph > 3) {
    const v = Math.pow(windMph, 0.16);
    return Math.round(35.74 + 0.6215 * t - 35.75 * v + 0.4275 * t * v);
  }

  return Math.round(t);
}

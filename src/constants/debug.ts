// Development-only switches for testing the weather fallback chain.
// Set one to true and reload the app to pretend that source is down.
// They have no effect in a production build.
export const simulateOutage = {
  openMeteo: false,
  nws: false,
};

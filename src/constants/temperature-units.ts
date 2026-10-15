// Countries and territories that normally use °F; everywhere else uses °C.
// ISO 3166 country codes.
const FAHRENHEIT_COUNTRIES = new Set([
  'US', // United States
  'PR', // Puerto Rico
  'GU', // Guam
  'VI', // U.S. Virgin Islands
  'AS', // American Samoa
  'MP', // Northern Mariana Islands
  'UM', // U.S. Minor Outlying Islands
  'BS', // Bahamas
  'BZ', // Belize
  'KY', // Cayman Islands
  'LR', // Liberia
  'PW', // Palau
  'FM', // Micronesia
  'MH', // Marshall Islands
]);

export function unitForCountry(countryCode: string): 'fahrenheit' | 'celsius' {
  return FAHRENHEIT_COUNTRIES.has(countryCode.toUpperCase()) ? 'fahrenheit' : 'celsius';
}

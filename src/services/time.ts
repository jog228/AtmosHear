// 15 -> "3 PM"
export function formatHour(hour: number): string {
  const suffix = hour < 12 ? 'AM' : 'PM';
  return `${hour % 12 || 12} ${suffix}`;
}

// "3:15 PM" if today, otherwise "Oct 12, 3:15 PM".
export function formatSavedTime(timestamp: number): string {
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (date.toDateString() === new Date().toDateString()) return time;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}

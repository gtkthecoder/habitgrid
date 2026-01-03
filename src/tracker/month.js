export function getDaysInMonth(month = 12, year = 2026) {
  return new Date(year, month, 0).getDate();
}

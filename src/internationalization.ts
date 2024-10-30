import { differenceInDays } from 'date-fns';

/**
 * Get an appropriate relative time string for a given date.
 *
 * If the given date less than 30 days ago, then it will return a relative time string for today.
 *
 * Otherwise, it will return a formatted date.
 */
export function getRelativeTime(value: Date) {
  const difference = differenceInDays(new Date(), value);
  if (difference < 1) {
    return 'today';
  }
  // If it's not too long ago, then use a relative time format
  if (difference < 30) {
    const formatter = new Intl.RelativeTimeFormat('en', {
      style: 'long',
    });
    return formatter.format(-difference, 'days');
  }
  return formatDate(value);
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(value);
}

export function formatYearAndMonth(value: Date) {
  return new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'long',
  }).format(value);
}

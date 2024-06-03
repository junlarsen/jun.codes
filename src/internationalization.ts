import { differenceInDays } from 'date-fns';

export function getRelativeTime(value: Date) {
  const difference = differenceInDays(new Date(), value);
  if (difference < 1) {
    return 'today';
  }
  const formatter = new Intl.RelativeTimeFormat('en', {
    style: 'long',
  });
  return formatter.format(-difference, 'days');
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

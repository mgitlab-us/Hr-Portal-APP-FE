import { format, isValid, parseISO } from 'date-fns';

export function formatNoticeDate(value: string, pattern = 'MMM dd, yyyy · hh:mm a'): string {
  const date = parseISO(value);
  return isValid(date) ? format(date, pattern) : '';
}

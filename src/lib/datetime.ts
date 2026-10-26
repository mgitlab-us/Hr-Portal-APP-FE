import { format, isValid, parse, parseISO } from 'date-fns';

export const DATE_DMY = 'dd MMM yyyy';
export const DATE_FULL_DMY = 'dd MMMM yyyy';
export const WEEKDAY_DATE_DMY = 'EEEE, dd MMMM yyyy';
export const SHORT_DATE_DMY = 'dd MMM';
export const TIME_12H = 'hh:mm a';
export const DATE_TIME_DMY = 'dd MMM yyyy · hh:mm a';

export function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isValid(value) ? value : null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function formatDateDMY(
  value: string | Date | null | undefined,
  pattern: string = DATE_DMY
): string {
  const date = toDate(value);
  return date ? format(date, pattern) : '';
}

export function formatTime12h(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? format(date, TIME_12H) : '';
}

export function formatDateTimeDMY(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? format(date, DATE_TIME_DMY) : '';
}

export function formatDateRangeDMY(
  start: string | Date | null | undefined,
  end: string | Date | null | undefined
): string {
  if (!start && !end) return '';
  if (!start) return formatDateDMY(end);
  if (!end) return formatDateDMY(start);
  return `${formatDateDMY(start)} – ${formatDateDMY(end)}`;
}

/** Parse a user-entered DD-MM-YYYY / DD/MM/YYYY value. */
export function parseDMY(value: string): Date | null {
  const trimmed = value.trim();
  for (const pattern of ['dd-MM-yyyy', 'dd/MM/yyyy', 'd-M-yyyy', 'd/M/yyyy']) {
    const parsed = parse(trimmed, pattern, new Date());
    if (isValid(parsed)) return parsed;
  }
  return null;
}

/** Local calendar key for API payloads and native inputs (YYYY-MM-DD). */
export function toDateKey(value: string | Date): string {
  const date = toDate(value);
  if (!date) return '';
  return format(date, 'yyyy-MM-dd');
}

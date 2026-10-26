import { DATE_TIME_DMY, formatDateDMY } from '@/lib/datetime';

export function formatNoticeDate(value: string, pattern = DATE_TIME_DMY): string {
  return formatDateDMY(value, pattern);
}

export type NoticeType = 'ANNOUNCEMENT' | 'HOLIDAY' | 'EVENT' | 'URGENT';

export type NoticeFilter = NoticeType | 'ALL';

export interface Notice {
  id: string;
  companyId?: string;
  title: string;
  content: string;
  type: NoticeType;
  departmentId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoticePage {
  data: Notice[];
  total: number;
}

export interface NoticeListParams {
  page?: number;
  limit?: number;
  type?: NoticeType;
}

export interface NoticeTypeMeta {
  label: string;
  icon: string;
  bg: string;
  text: string;
  color: string;
}

export const NOTICE_FILTERS: { label: string; value: NoticeFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Announcements', value: 'ANNOUNCEMENT' },
  { label: 'Holidays', value: 'HOLIDAY' },
  { label: 'Events', value: 'EVENT' },
  { label: 'Urgent', value: 'URGENT' },
];

export const NOTICE_TYPE_META: Record<NoticeType, NoticeTypeMeta> = {
  ANNOUNCEMENT: {
    label: 'Announcement',
    icon: 'megaphone-outline',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    color: '#2563EB',
  },
  HOLIDAY: {
    label: 'Holiday',
    icon: 'sunny-outline',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    color: '#059669',
  },
  EVENT: {
    label: 'Event',
    icon: 'calendar-outline',
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    color: '#7C3AED',
  },
  URGENT: {
    label: 'Urgent',
    icon: 'alert-circle-outline',
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    color: '#E11D48',
  },
};

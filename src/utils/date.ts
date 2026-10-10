import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

export const formatRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
};

export const formatMessageTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
};
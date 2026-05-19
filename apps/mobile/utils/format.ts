import { formatPln } from '@finera/shared';
import { format, formatDistanceToNow, isAfter } from 'date-fns';
import { pl } from 'date-fns/locale';

export { formatPln };

export function formatDate(date: Date | string, fmt = 'dd.MM.yyyy'): string {
  return format(new Date(date), fmt, { locale: pl });
}

export function formatDateRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: pl });
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function isOverdue(dueDate: Date | string): boolean {
  return isAfter(new Date(), new Date(dueDate));
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function maskNip(nip: string): string {
  if (nip.length !== 10) return nip;
  return `${nip.substring(0, 3)}-***-${nip.substring(7)}`;
}

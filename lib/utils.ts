import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, getISOWeek, getYear } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getISOWeekString(date: Date): string {
  const week = getISOWeek(date)
  const year = getYear(date)
  return `${year}-W${String(week).padStart(2, '0')}`
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatDateShort(date: Date | string): string {
  return format(new Date(date), 'dd MMM')
}

export const EVENT_COLORS: Record<string, string> = {
  'Weekly Chapter Meeting': '#CC0000',
  'Internal 1-to-1 Conclave': '#C9A84C',
  'Visitors Day Conclave': '#22C55E',
  'Business Training': '#3B82F6',
  'Evening Gathering': '#A855F7',
  'Domestic Trip': '#14B8A6',
  'Inter-Chapter Conclave': '#F97316',
  'Regional 1-to-1 Conclave': '#EC4899',
  'International Trip': '#10B981',
  'Regional Event': '#6B7280',
}

export const ACHIEVEMENT_CATEGORIES = [
  { value: 'referral', label: 'Referral Given', points: 2 },
  { value: 'testimonial', label: 'Testimonial', points: 1 },
  { value: 'one-to-one', label: '1-to-1 Meeting', points: 1 },
  { value: 'visitor', label: 'Visitor Invited', points: 2 },
  { value: 'tyfcb', label: 'TYFCB', points: 3 },
  { value: 'training', label: 'Training Attended', points: 1 },
]


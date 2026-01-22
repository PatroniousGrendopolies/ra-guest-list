import { customAlphabet } from 'nanoid'

// Generate URL-friendly unique slugs (lowercase letters and numbers)
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10)

export function generateSlug(): string {
  return nanoid()
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function getRelativeDayName(date: Date): string {
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Compare only the date parts (ignoring time)
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return 'tonight'
  }

  if (dateOnly.getTime() === tomorrowOnly.getTime()) {
    return 'tomorrow'
  }

  // Return the day name (e.g., "Friday")
  return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date)
}

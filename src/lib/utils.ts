import { customAlphabet } from 'nanoid'

// Generate URL-friendly unique slugs (lowercase letters and numbers)
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10)

export function generateSlug(): string {
  return nanoid()
}

// Convert a YYYY-MM-DD date-input value into the canonical stored value:
// midnight UTC of that calendar day. Used by every write path (create + edit)
// so they store the exact same instant for the same picked day, in any timezone.
export function gigDateFromInput(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00Z')
}

// Gig dates are stored as midnight UTC of the intended calendar day, so all
// formatting is pinned to UTC. This makes the rendered day deterministic and
// identical on the Netlify server (UTC) and in every guest's browser timezone.
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function getRelativeDayName(date: Date): string {
  // Work entirely in UTC so the server (UTC) and every browser agree.
  const now = new Date()
  const oneDay = 24 * 60 * 60 * 1000
  const dateOnly = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const todayOnly = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())

  if (dateOnly === todayOnly) {
    return 'tonight'
  }

  if (dateOnly === todayOnly + oneDay) {
    return 'tomorrow'
  }

  // Return the day name (e.g., "Friday")
  return new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(date)
}

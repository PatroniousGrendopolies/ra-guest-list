import JSZip from 'jszip'

export interface ParsedEvent {
  id: string
  djName: string
  date: Date
  description?: string
}

export interface ParseResult {
  events: ParsedEvent[]
  errors: string[]
}

/**
 * Parse a single iCal date string into a Date object
 * Handles formats:
 * - DTSTART;VALUE=DATE:20240323 (all-day event)
 * - DTSTART:20240323T200000Z (with time, UTC)
 * - DTSTART;TZID=America/Toronto:20240323T200000 (with time, timezone)
 */
function parseICalDate(line: string): Date | null {
  // Extract the date part from various formats
  const colonIndex = line.lastIndexOf(':')
  if (colonIndex === -1) return null

  const dateStr = line.slice(colonIndex + 1).trim()

  // All-day event format: YYYYMMDD
  if (dateStr.length === 8) {
    const year = parseInt(dateStr.slice(0, 4), 10)
    const month = parseInt(dateStr.slice(4, 6), 10) - 1
    const day = parseInt(dateStr.slice(6, 8), 10)
    return new Date(year, month, day)
  }

  // Datetime format: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
  if (dateStr.includes('T')) {
    const year = parseInt(dateStr.slice(0, 4), 10)
    const month = parseInt(dateStr.slice(4, 6), 10) - 1
    const day = parseInt(dateStr.slice(6, 8), 10)
    const hour = parseInt(dateStr.slice(9, 11), 10)
    const minute = parseInt(dateStr.slice(11, 13), 10)
    const second = dateStr.length >= 15 ? parseInt(dateStr.slice(13, 15), 10) : 0

    // If it ends with Z, it's UTC
    if (dateStr.endsWith('Z')) {
      return new Date(Date.UTC(year, month, day, hour, minute, second))
    }

    // Otherwise treat as local time
    return new Date(year, month, day, hour, minute, second)
  }

  return null
}

/**
 * Unescape iCal text values per RFC 5545
 * - \n or \N → newline (we'll convert to space for single-line display)
 * - \, → comma
 * - \; → semicolon
 * - \\ → backslash
 */
function unescapeICalText(text: string): string {
  return text
    .replace(/\\n/gi, ' ')  // Convert newlines to spaces for cleaner display
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .replace(/\s+/g, ' ')   // Collapse multiple spaces
    .trim()
}

/**
 * Parse raw iCal content and extract events
 */
export function parseICalContent(content: string): ParseResult {
  const events: ParsedEvent[] = []
  const errors: string[] = []

  // Normalize line endings and handle line folding (lines starting with space/tab continue previous line)
  const normalizedContent = content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n[ \t]/g, '') // Handle line folding per RFC 5545

  // Split into events
  const eventBlocks = normalizedContent.split('BEGIN:VEVENT')

  for (let i = 1; i < eventBlocks.length; i++) {
    const block = eventBlocks[i]
    const endIndex = block.indexOf('END:VEVENT')
    if (endIndex === -1) continue

    const eventContent = block.slice(0, endIndex)
    const lines = eventContent.split('\n')

    let dtstart: string | null = null
    let summary: string | null = null
    let description: string | null = null
    let uid: string | null = null

    for (const line of lines) {
      if (line.startsWith('DTSTART')) {
        dtstart = line
      } else if (line.startsWith('SUMMARY:')) {
        summary = unescapeICalText(line.slice(8))
      } else if (line.startsWith('DESCRIPTION:')) {
        description = unescapeICalText(line.slice(12))
      } else if (line.startsWith('UID:')) {
        uid = line.slice(4)
      }
    }

    // Validate required fields
    if (!dtstart) {
      errors.push(`Event missing DTSTART`)
      continue
    }
    if (!summary) {
      errors.push(`Event on ${dtstart} missing SUMMARY`)
      continue
    }

    const date = parseICalDate(dtstart)
    if (!date || isNaN(date.getTime())) {
      errors.push(`Could not parse date for event: ${summary}`)
      continue
    }

    events.push({
      id: uid || `event-${i}-${date.getTime()}`,
      djName: summary,
      date,
      description: description || undefined,
    })
  }

  return { events, errors }
}

/**
 * Read and parse a .ics file from File object
 */
export async function parseIcsFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const content = e.target?.result as string
      if (!content) {
        resolve({ events: [], errors: ['Could not read file content'] })
        return
      }
      resolve(parseICalContent(content))
    }

    reader.onerror = () => {
      resolve({ events: [], errors: ['Failed to read file'] })
    }

    reader.readAsText(file)
  })
}

/**
 * Read and parse a .zip file containing .ics files
 */
export async function parseZipFile(file: File): Promise<ParseResult> {
  const allEvents: ParsedEvent[] = []
  const allErrors: string[] = []

  try {
    const arrayBuffer = await file.arrayBuffer()
    const zip = await JSZip.loadAsync(arrayBuffer)

    const icsFiles = Object.keys(zip.files).filter(
      (name) => name.toLowerCase().endsWith('.ics') && !zip.files[name].dir
    )

    if (icsFiles.length === 0) {
      return { events: [], errors: ['No .ics files found in ZIP archive'] }
    }

    for (const icsName of icsFiles) {
      const content = await zip.files[icsName].async('string')
      const result = parseICalContent(content)
      allEvents.push(...result.events)
      allErrors.push(...result.errors.map((e) => `${icsName}: ${e}`))
    }

    // Deduplicate events by UID
    const uniqueEvents = new Map<string, ParsedEvent>()
    for (const event of allEvents) {
      uniqueEvents.set(event.id, event)
    }

    return {
      events: Array.from(uniqueEvents.values()),
      errors: allErrors,
    }
  } catch (err) {
    return {
      events: [],
      errors: [`Failed to read ZIP file: ${err instanceof Error ? err.message : 'Unknown error'}`],
    }
  }
}

/**
 * Parse either a .ics or .zip file
 */
export async function parseCalendarFile(file: File): Promise<ParseResult> {
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith('.zip')) {
    return parseZipFile(file)
  } else if (fileName.endsWith('.ics')) {
    return parseIcsFile(file)
  } else {
    return {
      events: [],
      errors: ['Unsupported file format. Please upload a .ics or .zip file'],
    }
  }
}

/**
 * Filter events to a specific date range
 */
export function filterEventsByDateRange(
  events: ParsedEvent[],
  startDate: Date,
  endDate: Date
): ParsedEvent[] {
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)

  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)

  return events.filter((event) => {
    return event.date >= start && event.date <= end
  })
}

/**
 * Sort events by date ascending
 */
export function sortEventsByDate(events: ParsedEvent[]): ParsedEvent[] {
  return [...events].sort((a, b) => a.date.getTime() - b.date.getTime())
}

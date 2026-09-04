import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { gigDateFromInput, formatDate, formatDateShort, getRelativeDayName, gigDayKey, isGigPast, localDayKey } from './utils'
import { parseICalContent } from './ical-parser'

// Regression guard for the off-by-one date bug. A gig "date" is a calendar day,
// stored as midnight UTC and rendered in UTC, so create == edit == display yield
// the same correct day regardless of the timezone the code runs in.
//
// 2026-06-12 is a Friday; these assertions only hold if no path leaks a local
// timezone. They are deterministic because every function pins UTC internally.

describe('gigDateFromInput (write path)', () => {
  it('stores a picked day as midnight UTC', () => {
    expect(gigDateFromInput('2026-06-12').toISOString()).toBe('2026-06-12T00:00:00.000Z')
  })

  it('produces the identical instant for create and edit of the same day', () => {
    // create stores the Date; edit serializes via toISOString then re-parses.
    const created = gigDateFromInput('2026-06-12')
    const editedRoundTrip = new Date(gigDateFromInput('2026-06-12').toISOString())
    expect(editedRoundTrip.getTime()).toBe(created.getTime())
  })
})

describe('display formatters (read path)', () => {
  const friday = gigDateFromInput('2026-06-12')

  it('formatDate renders the picked day, not the day before', () => {
    expect(formatDate(friday)).toBe('Friday, June 12, 2026')
  })

  it('formatDateShort renders the picked day', () => {
    expect(formatDateShort(friday)).toBe('Friday, Jun 12, 2026')
  })

  it('getRelativeDayName returns the weekday for a non-adjacent day', () => {
    expect(getRelativeDayName(gigDateFromInput('2026-06-12'))).toBe('Friday')
  })
})

describe('round trip: create -> store -> display', () => {
  it('a gig created for Friday June 12 displays as Friday June 12', () => {
    // Simulates: form value -> write helper -> DB instant -> read formatter.
    const stored = gigDateFromInput('2026-06-12').toISOString()
    expect(formatDate(new Date(stored))).toBe('Friday, June 12, 2026')
  })
})

describe('iCal import (venue-timezone anchoring)', () => {
  function importDate(dtstart: string): Date {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:test-1',
      'SUMMARY:Test Night',
      dtstart,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n')
    const result = parseICalContent(ics)
    expect(result.errors).toEqual([])
    expect(result.events).toHaveLength(1)
    return result.events[0].date
  }

  it('all-day event keeps its calendar day', () => {
    expect(importDate('DTSTART;VALUE=DATE:20260612').toISOString()).toBe('2026-06-12T00:00:00.000Z')
  })

  it('a 9pm venue-local event stays on its own night', () => {
    // Floating local time: the date part is the venue night.
    expect(importDate('DTSTART:20260612T210000').toISOString()).toBe('2026-06-12T00:00:00.000Z')
  })

  it('a late event exported in UTC resolves to the venue night, not the next UTC day', () => {
    // 21:00 in Toronto (UTC-4 in June) is 01:00Z on the 13th. It must count as
    // the night of the 12th, the bug that pushed imported gigs a day forward.
    expect(importDate('DTSTART:20260613T010000Z').toISOString()).toBe('2026-06-12T00:00:00.000Z')
  })
})

// Regression guard: a gig on today's calendar day must stay "upcoming" all day
// in the viewer's timezone. The stored instant is midnight UTC, which is 8pm the
// previous evening in Montreal, so a raw instant comparison against `now` filed
// tonight's event under "Past Guest Lists" from the night before.
describe('isGigPast (dashboard upcoming/past split)', () => {
  const originalTZ = process.env.TZ
  beforeAll(() => {
    process.env.TZ = 'America/Montreal'
  })
  afterAll(() => {
    process.env.TZ = originalTZ
  })

  const tonight = gigDateFromInput('2026-09-04') // Friday

  it('keeps tonight’s gig upcoming on the morning of the event', () => {
    const fri9am = new Date('2026-09-04T13:13:00Z') // 9:13am EDT
    expect(isGigPast(tonight, fri9am)).toBe(false)
  })

  it('keeps tonight’s gig upcoming late in the evening (after midnight UTC)', () => {
    const fri11pm = new Date('2026-09-05T03:00:00Z') // 11pm EDT Friday
    expect(isGigPast(tonight, fri11pm)).toBe(false)
  })

  it('files the gig under past on the following local day', () => {
    const satMorning = new Date('2026-09-05T13:00:00Z') // 9am EDT Saturday
    expect(isGigPast(tonight, satMorning)).toBe(true)
  })

  it('treats a gig on the previous day as past', () => {
    expect(isGigPast(gigDateFromInput('2026-09-03'), new Date('2026-09-04T13:13:00Z'))).toBe(true)
  })

  it('places the gig on its own local calendar cell', () => {
    const cell = new Date(2026, 8, 4) // local Sep 4 cell in the month grid
    expect(gigDayKey(tonight)).toBe(localDayKey(cell))
    expect(gigDayKey(tonight)).not.toBe(localDayKey(new Date(2026, 8, 3)))
  })
})

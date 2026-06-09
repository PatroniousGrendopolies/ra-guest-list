import { describe, it, expect } from 'vitest'
import { gigDateFromInput, formatDate, formatDateShort, getRelativeDayName } from './utils'
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

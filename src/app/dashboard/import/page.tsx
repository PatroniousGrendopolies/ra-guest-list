'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  parseCalendarFile,
  filterEventsByDateRange,
  sortEventsByDate,
  ParsedEvent,
} from '@/lib/ical-parser'

interface ExistingGig {
  id: string
  date: string
  djName: string
}

interface ImportEvent extends ParsedEvent {
  selected: boolean
  guestCap: number
  maxPerSignup: number
  hasConflict: boolean
  conflictingGigs: ExistingGig[]
}

type Step = 'upload' | 'dateRange' | 'preview' | 'review' | 'success'

export default function ImportPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('upload')

  // File state
  const [fileName, setFileName] = useState<string>('')
  const [rawEvents, setRawEvents] = useState<ParsedEvent[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])

  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    const future = new Date()
    future.setMonth(future.getMonth() + 3)
    return future.toISOString().split('T')[0]
  })

  // Import events state
  const [importEvents, setImportEvents] = useState<ImportEvent[]>([])
  const [existingGigs, setExistingGigs] = useState<ExistingGig[]>([])

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [createdCount, setCreatedCount] = useState(0)

  // Bulk edit state
  const [bulkGuestCap, setBulkGuestCap] = useState('50')

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false)

  // Fetch existing gigs for conflict detection
  useEffect(() => {
    async function fetchGigs() {
      try {
        const response = await fetch('/api/gigs')
        if (response.ok) {
          const data = await response.json()
          setExistingGigs(data)
        }
      } catch {
        // Silently fail - not critical
      }
    }
    fetchGigs()
  }, [])

  // Check for conflicts on a given date
  const getGigsOnDate = useCallback(
    (date: Date): ExistingGig[] => {
      return existingGigs.filter((gig) => {
        const gigDate = new Date(gig.date)
        return (
          gigDate.getFullYear() === date.getFullYear() &&
          gigDate.getMonth() === date.getMonth() &&
          gigDate.getDate() === date.getDate()
        )
      })
    },
    [existingGigs]
  )

  // Process events when date range changes
  useEffect(() => {
    if (rawEvents.length === 0) return

    const start = new Date(startDate)
    const end = new Date(endDate)
    const filtered = filterEventsByDateRange(rawEvents, start, end)
    const sorted = sortEventsByDate(filtered)

    const eventsWithState: ImportEvent[] = sorted.map((event) => {
      const conflictingGigs = getGigsOnDate(event.date)
      const hasConflict = conflictingGigs.length > 0
      return {
        ...event,
        selected: !hasConflict, // Deselect events with conflicts by default
        guestCap: 50,
        maxPerSignup: 5,
        hasConflict,
        conflictingGigs,
      }
    })

    setImportEvents(eventsWithState)
  }, [rawEvents, startDate, endDate, getGigsOnDate])

  // Process uploaded file
  async function processFile(file: File) {
    setFileName(file.name)
    const result = await parseCalendarFile(file)
    setRawEvents(result.events)
    setParseErrors(result.errors)

    if (result.events.length > 0) {
      setStep('dateRange')
    }
  }

  // Handle file input change
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  // Drag and drop handlers
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    // Check file extension
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.ics') && !fileName.endsWith('.zip')) {
      setParseErrors(['Please upload a .ics or .zip file'])
      return
    }

    await processFile(file)
  }

  // Toggle event selection
  function toggleEvent(id: string) {
    setImportEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, selected: !e.selected } : e))
    )
  }

  // Select/deselect all
  function selectAll(selected: boolean) {
    setImportEvents((prev) => prev.map((e) => ({ ...e, selected })))
  }

  // Update DJ name for an event
  function updateDjName(id: string, djName: string) {
    setImportEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, djName } : e))
    )
  }

  // Update guest cap for an event
  function updateGuestCap(id: string, guestCap: number) {
    setImportEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, guestCap } : e))
    )
  }

  // Update max per signup for an event
  function updateMaxPerSignup(id: string, maxPerSignup: number) {
    setImportEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, maxPerSignup } : e))
    )
  }

  // Apply bulk guest cap to all selected events
  function applyBulkGuestCap() {
    const cap = parseInt(bulkGuestCap, 10)
    if (isNaN(cap) || cap < 1) return
    setImportEvents((prev) =>
      prev.map((e) => (e.selected ? { ...e, guestCap: cap } : e))
    )
  }

  // Format date for display
  function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  // Submit import
  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError('')

    const selectedEvents = importEvents.filter((e) => e.selected)
    const gigs = selectedEvents.map((e) => ({
      date: e.date.toISOString(),
      djName: e.djName,
      guestCap: e.guestCap,
      maxPerSignup: e.maxPerSignup,
    }))

    try {
      const response = await fetch('/api/gigs/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gigs }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to import')
      }

      const result = await response.json()
      setCreatedCount(result.count)
      setStep('success')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedCount = importEvents.filter((e) => e.selected).length
  const conflictCount = importEvents.filter((e) => e.selected && e.hasConflict).length

  return (
    <main className="min-h-screen p-4 max-w-4xl mx-auto font-[Helvetica,Arial,sans-serif]">
      <div className="flex justify-center pt-4 mb-6">
        <Image
          src="/datcha-logo-black.jpg"
          alt="Datcha"
          width={235}
          height={79}
          className="h-[75px] w-auto"
        />
      </div>

      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="bg-white rounded-3xl p-6">
          <h1 className="text-2xl font-bold mb-2">Import Calendar</h1>
          <p className="text-gray-600 mb-6">
            Upload a Google Calendar export (.ics file) to batch-create guest lists
          </p>

          <div
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
              isDragging
                ? 'border-gray-500 bg-gray-50'
                : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".ics,.zip"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <svg
                className={`w-12 h-12 mb-4 transition-colors ${
                  isDragging ? 'text-gray-600' : 'text-gray-400'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-gray-600 mb-2">
                {isDragging ? 'Drop file here' : 'Click to upload or drag and drop'}
              </span>
              <span className="text-gray-400 text-sm">.ics or .zip files supported</span>
            </label>
          </div>

          {fileName && (
            <p className="mt-4 text-sm text-gray-600">
              Selected: <span className="font-medium">{fileName}</span>
            </p>
          )}

          {parseErrors.length > 0 && (
            <div className="mt-4 bg-yellow-50 text-yellow-800 p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">Some events could not be parsed:</p>
              <ul className="list-disc list-inside">
                {parseErrors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {parseErrors.length > 5 && (
                  <li>...and {parseErrors.length - 5} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Date Range */}
      {step === 'dateRange' && (
        <div className="bg-white rounded-3xl p-6">
          <h1 className="text-2xl font-bold mb-2">Select Date Range</h1>
          <p className="text-gray-600 mb-6">
            Found <span className="font-medium">{rawEvents.length}</span> events in{' '}
            <span className="font-medium">{fileName}</span>
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-gray-600">
              <span className="font-medium">{importEvents.length}</span> events match this date
              range
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('upload')}
              className="flex-1 px-5 py-2.5 border border-gray-300 rounded-full hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => setStep('preview')}
              disabled={importEvents.length === 0}
              className="flex-1 px-5 py-2.5 bg-gray-700 text-white rounded-full hover:bg-gray-800 disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Edit */}
      {step === 'preview' && (
        <div className="bg-white rounded-3xl p-6">
          <h1 className="text-2xl font-bold mb-2">Preview & Edit Events</h1>
          <p className="text-gray-600 mb-4">
            Review and customize events before importing
          </p>

          {/* Bulk actions */}
          <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-50 rounded-2xl">
            <button
              onClick={() => selectAll(true)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-full hover:bg-white"
            >
              Select All
            </button>
            <button
              onClick={() => selectAll(false)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-full hover:bg-white"
            >
              Deselect All
            </button>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-gray-600">Set all caps to:</span>
              <input
                type="number"
                value={bulkGuestCap}
                onChange={(e) => setBulkGuestCap(e.target.value)}
                min="1"
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400"
              />
              <button
                onClick={applyBulkGuestCap}
                className="px-3 py-1.5 text-sm bg-gray-700 text-white rounded-full hover:bg-gray-800"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Events table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 w-16">Import?</th>
                  <th className="text-left py-2 px-2 w-1/4">Date</th>
                  <th className="text-left py-2 px-2 w-1/4">DJ Name</th>
                  <th className="text-left py-2 px-2 w-20">Guestlist Cap</th>
                  <th className="text-left py-2 px-2 w-20">Max Guests per Signup</th>
                </tr>
              </thead>
              <tbody>
                {importEvents.map((event) => (
                  <tr
                    key={event.id}
                    className={`border-b border-gray-100 ${
                      event.hasConflict ? 'bg-yellow-50' : ''
                    } ${!event.selected ? 'opacity-50' : ''}`}
                  >
                    <td className="py-2 px-2">
                      <input
                        type="checkbox"
                        checked={event.selected}
                        onChange={() => toggleEvent(event.id)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                    </td>
                    <td className="py-2 px-2 w-1/4">
                      <div>{formatDate(event.date)}</div>
                      {event.hasConflict && (
                        <div className="text-xs text-yellow-700 mt-0.5">
                          Conflict: {event.conflictingGigs.map((g) => g.djName).join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-2 w-1/4">
                      <textarea
                        value={event.djName}
                        onChange={(e) => {
                          updateDjName(event.id, e.target.value)
                          // Auto-resize
                          e.target.style.height = 'auto'
                          e.target.style.height = e.target.scrollHeight + 'px'
                        }}
                        ref={(el) => {
                          // Auto-resize on initial render
                          if (el) {
                            el.style.height = 'auto'
                            el.style.height = el.scrollHeight + 'px'
                          }
                        }}
                        rows={1}
                        className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 resize-none overflow-hidden"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={event.guestCap || ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                          updateGuestCap(event.id, val)
                        }}
                        onBlur={(e) => {
                          if (!e.target.value || parseInt(e.target.value, 10) < 1) {
                            updateGuestCap(event.id, 50)
                          }
                        }}
                        min="1"
                        className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="number"
                        value={event.maxPerSignup || ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10)
                          updateMaxPerSignup(event.id, val)
                        }}
                        onBlur={(e) => {
                          if (!e.target.value || parseInt(e.target.value, 10) < 1) {
                            updateMaxPerSignup(event.id, 5)
                          }
                        }}
                        min="1"
                        className="w-full px-2 py-1 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="text-sm text-gray-600 mb-4">
            <span className="font-medium">{selectedCount}</span> of {importEvents.length} events
            selected
            {conflictCount > 0 && (
              <span className="text-yellow-700">
                {' '}
                ({conflictCount} with date conflicts)
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('dateRange')}
              className="flex-1 px-5 py-2.5 border border-gray-300 rounded-full hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => {
                // Blur active element to ensure all edits are committed
                if (document.activeElement instanceof HTMLElement) {
                  document.activeElement.blur()
                }
                // Small delay to let blur handlers complete
                setTimeout(() => setStep('review'), 0)
              }}
              disabled={selectedCount === 0}
              className="flex-1 px-5 py-2.5 bg-gray-700 text-white rounded-full hover:bg-gray-800 disabled:opacity-50"
            >
              Review Import
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Confirm */}
      {step === 'review' && (
        <div className="bg-white rounded-3xl p-6">
          <h1 className="text-2xl font-bold mb-2">Confirm Import</h1>
          <p className="text-gray-600 mb-6">
            You are about to create <span className="font-medium">{selectedCount}</span> guest
            lists
          </p>

          {conflictCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-2xl mb-4">
              <p className="font-medium">
                {conflictCount} event{conflictCount !== 1 ? 's' : ''} will be created on dates
                that already have guest lists
              </p>
            </div>
          )}

          <div className="max-h-80 overflow-y-auto mb-6 border border-gray-200 rounded-2xl">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3">Date</th>
                  <th className="text-left py-2 px-3">DJ Name</th>
                  <th className="text-left py-2 px-3">Guestlist Cap</th>
                  <th className="text-left py-2 px-3">Max Guests per Signup</th>
                </tr>
              </thead>
              <tbody>
                {importEvents
                  .filter((e) => e.selected)
                  .map((event) => (
                    <tr
                      key={event.id}
                      className={`border-b border-gray-100 ${
                        event.hasConflict ? 'bg-yellow-50' : ''
                      }`}
                    >
                      <td className="py-2 px-3">
                        {formatDate(event.date)}
                        {event.hasConflict && (
                          <span className="text-yellow-700 text-xs ml-1">(conflict)</span>
                        )}
                      </td>
                      <td className="py-2 px-3">{event.djName}</td>
                      <td className="py-2 px-3">{event.guestCap}</td>
                      <td className="py-2 px-3">{event.maxPerSignup}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {submitError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
              {submitError}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('preview')}
              className="flex-1 px-5 py-2.5 border border-gray-300 rounded-full hover:bg-gray-50"
              disabled={submitting}
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-5 py-2.5 bg-gray-700 text-white rounded-full hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting ? 'Importing...' : 'Confirm Import'}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Success */}
      {step === 'success' && (
        <div className="bg-white rounded-3xl p-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Import Complete!</h1>
          <p className="text-gray-600 mb-6">
            Successfully created <span className="font-medium">{createdCount}</span> guest lists
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="px-5 py-2.5 bg-gray-700 text-white rounded-full hover:bg-gray-800"
            >
              View Dashboard
            </button>
            <button
              onClick={() => {
                setStep('upload')
                setFileName('')
                setRawEvents([])
                setImportEvents([])
                setParseErrors([])
              }}
              className="text-gray-600 hover:text-gray-800"
            >
              Import Another Calendar
            </button>
          </div>
        </div>
      )}
    </main>
  )
}

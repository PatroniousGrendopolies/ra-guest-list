// Admin dashboard showing all guest lists in list or calendar view.

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { formatDateShort } from '@/lib/utils'

interface Gig {
  id: string
  slug: string
  date: string
  djName: string
  venueName: string | null
  guestCap: number | null
  maxPerSignup: number
  isClosed: boolean
  lastExportedAt: string | null
  totalGuests: number
  signUpCount: number
  newGuestCount: number
}

type ViewMode = 'list' | 'calendar'

interface EditModalProps {
  gig: Gig
  onClose: () => void
  onSave: () => void
}

function EditModal({ gig, onClose, onSave }: EditModalProps) {
  const [djName, setDjName] = useState(gig.djName)
  const [date, setDate] = useState(() => {
    const d = new Date(gig.date)
    return d.toISOString().split('T')[0]
  })
  const [guestCap, setGuestCap] = useState<string>(gig.guestCap?.toString() || '')
  const [maxPerSignup, setMaxPerSignup] = useState<string>(gig.maxPerSignup?.toString() || '10')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const response = await fetch(`/api/gigs/${gig.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          djName: djName.trim(),
          date: new Date(date + 'T00:00:00').toISOString(),
          guestCap: guestCap ? parseInt(guestCap, 10) : null,
          maxPerSignup: maxPerSignup ? parseInt(maxPerSignup, 10) : 10,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update')
      }

      onSave()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Edit Guest List</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DJ / Artist Name
            </label>
            <input
              type="text"
              value={djName}
              onChange={(e) => setDjName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guest Cap {gig.totalGuests > 0 && <span className="text-gray-500 font-normal">(min: {gig.totalGuests})</span>}
            </label>
            <input
              type="number"
              value={guestCap}
              onChange={(e) => setGuestCap(e.target.value)}
              min={gig.totalGuests || 1}
              placeholder="No limit"
              className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            {gig.totalGuests > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Currently {gig.totalGuests} guest{gig.totalGuests !== 1 ? 's' : ''} on the list
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Guests Per Signup
            </label>
            <input
              type="number"
              value={maxPerSignup}
              onChange={(e) => setMaxPerSignup(e.target.value)}
              min={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum +1s allowed per signup
            </p>
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full hover:bg-gray-50"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-full hover:bg-gray-800 disabled:opacity-50"
              disabled={saving || !djName.trim()}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showPastEvents, setShowPastEvents] = useState(false)
  const [editingGig, setEditingGig] = useState<Gig | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
    } catch {
      setLoggingOut(false)
    }
  }

  async function fetchGigs() {
    try {
      const response = await fetch('/api/gigs')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setGigs(data)
    } catch {
      setError('Failed to load guest lists')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGigs()
  }, [])

  async function toggleClose(slug: string, currentState: boolean) {
    try {
      const response = await fetch(`/api/gigs/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isClosed: !currentState }),
      })
      if (!response.ok) {
        throw new Error('Failed to update')
      }
      await fetchGigs()
    } catch {
      alert('Failed to update')
    }
  }

  async function deleteGig(slug: string) {
    if (!confirm('Are you sure you want to delete this guest list?')) return

    try {
      await fetch(`/api/gigs/${slug}`, { method: 'DELETE' })
      fetchGigs()
    } catch {
      alert('Failed to delete')
    }
  }

  function downloadCsv(slug: string) {
    window.location.href = `/api/gigs/${slug}/csv`
  }

  function downloadNewCsv(slug: string) {
    window.location.href = `/api/gigs/${slug}/csv?newOnly=true`
  }

  function copyLink(slug: string) {
    const url = `${window.location.origin}/gig/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  function getCalendarDays() {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const startPadding = firstDay.getDay()
    const days: (Date | null)[] = []

    for (let i = 0; i < startPadding; i++) {
      days.push(null)
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  function getGigsForDate(date: Date) {
    return gigs.filter((gig) => {
      const gigDate = new Date(gig.date)
      return (
        gigDate.getFullYear() === date.getFullYear() &&
        gigDate.getMonth() === date.getMonth() &&
        gigDate.getDate() === date.getDate()
      )
    })
  }

  function prevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Filter gigs into upcoming and past
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const upcomingGigs = gigs
    .filter((gig) => new Date(gig.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Ascending: soonest first
  const pastGigs = gigs
    .filter((gig) => new Date(gig.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Descending: most recent first
  const displayedGigs = showPastEvents ? pastGigs : upcomingGigs

  if (loading) {
    return (
      <main className="min-h-screen p-4 max-w-6xl mx-auto font-[Helvetica,Arial,sans-serif]">
        <div className="text-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-black rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 max-w-6xl mx-auto font-[Helvetica,Arial,sans-serif]">
      <div className="flex justify-center pt-4 mb-6">
        <Image
          src="/datcha-logo-black.jpg"
          alt="Datcha"
          width={235}
          height={79}
          className="h-[75px] w-auto"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{showPastEvents ? 'Past Guest Lists' : 'Upcoming Guest Lists'}</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-full ${
                viewMode === 'list'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="List view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-full ${
                viewMode === 'calendar'
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Calendar view"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
          <a href="/dashboard/import" className="px-5 py-2 border border-gray-300 text-gray-600 text-sm rounded-full hover:bg-gray-50">
            Import Calendar
          </a>
          <a href="/" className="px-5 py-2 bg-gray-700 text-white text-sm rounded-full hover:bg-gray-800">
            Create New List
          </a>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50"
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {displayedGigs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">
            {showPastEvents ? 'No past guest lists' : 'No upcoming guest lists'}
          </p>
          {!showPastEvents && (
            <a href="/" className="px-5 py-2 bg-gray-700 text-white rounded-full hover:bg-gray-800 inline-block">
              Create your first guest list
            </a>
          )}
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {displayedGigs.map((gig) => (
            <div
              key={gig.id}
              className="card cursor-pointer rounded-3xl border-2 border-transparent hover:border-gray-300 transition-all duration-150"
              onClick={() => router.push(`/dashboard/${gig.slug}`)}
            >
              <div className="flex flex-col gap-3">
                {/* Top row: DJ name + buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <h2 className="font-semibold text-lg">{gig.djName}</h2>
                    {gig.isClosed && (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded">
                        Closed
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => copyLink(gig.slug)}
                      className={`px-4 py-1.5 text-sm border rounded-full transition-all ${
                        copiedSlug === gig.slug
                          ? 'bg-[#5c7a6a] text-white border-emerald-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {copiedSlug === gig.slug ? 'Copied!' : 'Copy Link'}
                    </button>
                    {gig.newGuestCount > 0 && (
                      <button
                        onClick={() => downloadNewCsv(gig.slug)}
                        className="px-4 py-1.5 text-sm bg-[#5c7a6a] text-white rounded-full hover:bg-[#4a675a]"
                      >
                        Download CSV - New ({gig.newGuestCount})
                      </button>
                    )}
                    <button
                      onClick={() => downloadCsv(gig.slug)}
                      className={`px-4 py-1.5 text-sm rounded-full ${
                        gig.lastExportedAt
                          ? 'border border-gray-300 hover:bg-gray-50'
                          : 'bg-[#5c7a6a] text-white hover:bg-[#4a675a]'
                      }`}
                    >
                      {gig.lastExportedAt ? 'Download CSV - All' : 'Download CSV'}
                    </button>
                    <button
                      onClick={() => toggleClose(gig.slug, gig.isClosed)}
                      className="px-4 py-1.5 text-sm border border-gray-300 rounded-full hover:bg-gray-50"
                    >
                      {gig.isClosed ? 'Reopen List' : 'Close List'}
                    </button>
                    <button
                      onClick={() => setEditingGig(gig)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteGig(gig.slug)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Date row */}
                <p className="text-gray-600 text-sm">
                  {formatDateShort(new Date(gig.date))}
                  {gig.venueName && ` • ${gig.venueName}`}
                </p>

                {/* Progress bar */}
                {gig.guestCap ? (
                  <div>
                    {(() => {
                      const percentage = (gig.totalGuests / gig.guestCap) * 100
                      const isEmpty = gig.totalGuests === 0
                      const isFull = gig.totalGuests >= gig.guestCap
                      const showCapNumber = percentage < 85
                      return (
                        <div className="flex items-center h-5 bg-gray-200 rounded-full overflow-hidden">
                          {!isEmpty && (
                            <div
                              className={`h-full bg-gray-500 flex items-center justify-end pr-2 min-w-[2.5rem] ${isFull ? 'rounded-full' : 'rounded-full'}`}
                              style={{ width: isFull ? '100%' : `${Math.max(percentage, 10)}%` }}
                            >
                              <span className="text-white text-xs font-medium">{gig.totalGuests}</span>
                            </div>
                          )}
                          {!isFull && (
                            <div className={`flex-1 flex items-center pr-2 ${isEmpty ? 'justify-between pl-2' : 'justify-end'}`}>
                              {isEmpty && <span className="text-gray-500 text-xs">0</span>}
                              <span className={`text-gray-500 text-xs ${!showCapNumber && !isEmpty ? 'hidden' : ''}`}>{gig.guestCap}</span>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>Confirmed</span>
                      <span>Spots available</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">
                    {gig.totalGuests} guest{gig.totalGuests !== 1 ? 's' : ''} confirmed
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card rounded-3xl">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold">{monthName}</h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}

            {getCalendarDays().map((date, index) => {
              const dayGigs = date ? getGigsForDate(date) : []
              const isToday = date &&
                date.getFullYear() === new Date().getFullYear() &&
                date.getMonth() === new Date().getMonth() &&
                date.getDate() === new Date().getDate()
              const hasGig = dayGigs.length > 0

              return (
                <div
                  key={index}
                  className={`min-h-[120px] border border-gray-100 rounded-xl ${
                    date ? (hasGig ? 'p-0' : 'p-2 bg-white') : 'bg-gray-50'
                  }`}
                >
                  {date && (
                    <>
                      {hasGig ? (
                        // Cell with gig - card fills the whole cell
                        dayGigs.map((gig) => (
                          <div
                            key={gig.id}
                            className={`h-full p-2 rounded-xl text-xs cursor-pointer border-2 hover:border-gray-400 transition-all duration-150 flex flex-col ${
                              gig.isClosed
                                ? 'bg-red-50 border-red-200'
                                : 'bg-blue-50 border-blue-200'
                            }`}
                            onClick={() => router.push(`/dashboard/${gig.slug}`)}
                          >
                            {/* Date number inside card */}
                            <div className="text-sm mb-1 text-gray-500">
                              {date.getDate()}
                            </div>
                            {/* Title - can wrap */}
                            <div className="font-medium text-xs leading-tight">{gig.djName}</div>
                            {/* Spacer to push progress bar and buttons to bottom */}
                            <div className="flex-1" />
                            {/* Progress bar */}
                            {gig.guestCap ? (
                              <div className="mb-1">
                                {(() => {
                                  const pct = (gig.totalGuests / gig.guestCap) * 100
                                  const isFull = gig.totalGuests >= gig.guestCap
                                  const isEmpty = gig.totalGuests === 0
                                  return (
                                    <div className="flex items-center h-3 bg-gray-200 rounded-full overflow-hidden">
                                      {!isEmpty && (
                                        <div
                                          className="h-full bg-gray-500 rounded-full flex items-center justify-end pr-1"
                                          style={{ width: isFull ? '100%' : `${Math.max(pct, 15)}%`, minWidth: '1rem' }}
                                        >
                                          <span className="text-white text-[8px] font-medium">{gig.totalGuests}</span>
                                        </div>
                                      )}
                                      {!isFull && (
                                        <div className={`flex-1 flex items-center pr-1 ${isEmpty ? 'justify-between pl-1' : 'justify-end'}`}>
                                          {isEmpty && <span className="text-gray-500 text-[8px]">0</span>}
                                          {pct < 75 && <span className="text-gray-500 text-[8px]">{gig.guestCap}</span>}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })()}
                              </div>
                            ) : (
                              <div className="text-gray-500 mb-1 text-[10px]">
                                {gig.totalGuests} guests
                              </div>
                            )}
                            {/* Buttons */}
                            <div
                              className="flex gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => copyLink(gig.slug)}
                                className={`px-1.5 py-1 rounded-full text-[10px] transition-all flex items-center justify-center ${
                                  copiedSlug === gig.slug
                                    ? 'bg-[#5c7a6a] text-white'
                                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                                title="Copy Link"
                              >
                                {copiedSlug === gig.slug ? (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                  </svg>
                                )}
                              </button>
                              <button
                                onClick={() => downloadCsv(gig.slug)}
                                className="flex-1 px-1.5 py-1 bg-[#5c7a6a] text-white rounded-full text-[10px] hover:bg-[#4a675a]"
                              >
                                CSV
                              </button>
                              <button
                                onClick={() => setEditingGig(gig)}
                                className="px-1.5 py-1 bg-white border border-gray-300 rounded-full text-[10px] hover:bg-gray-50"
                                title="Edit"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        // Empty cell - just show date
                        <div className={`text-sm ${
                          isToday
                            ? 'bg-gray-700 text-white w-6 h-6 rounded-full flex items-center justify-center'
                            : 'text-gray-500'
                        }`}>
                          {date.getDate()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Past/Upcoming Events Toggle */}
      {(showPastEvents ? upcomingGigs.length > 0 : pastGigs.length > 0) && (
        <div className="text-center mt-8">
          <button
            onClick={() => setShowPastEvents(!showPastEvents)}
            className="px-5 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-full hover:bg-gray-50"
          >
            {showPastEvents ? `View Upcoming Events (${upcomingGigs.length})` : `View Past Events (${pastGigs.length})`}
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editingGig && (
        <EditModal
          gig={editingGig}
          onClose={() => setEditingGig(null)}
          onSave={fetchGigs}
        />
      )}
    </main>
  )
}

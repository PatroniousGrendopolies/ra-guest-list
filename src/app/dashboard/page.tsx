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
  isClosed: boolean
  totalGuests: number
  signUpCount: number
}

type ViewMode = 'list' | 'calendar'

export default function Dashboard() {
  const router = useRouter()
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

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
          src="/datcha-logo.png"
          alt="Datcha"
          width={150}
          height={50}
          className="h-12 w-auto"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Guest Lists</h1>
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
          <a href="/" className="px-5 py-2 bg-gray-700 text-white text-sm rounded-full hover:bg-gray-800">
            Create New List
          </a>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {gigs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">No guest lists yet</p>
          <a href="/" className="px-5 py-2 bg-gray-700 text-white rounded-full hover:bg-gray-800 inline-block">
            Create your first guest list
          </a>
        </div>
      ) : viewMode === 'list' ? (
        <div className="space-y-4">
          {gigs.map((gig) => (
            <div
              key={gig.id}
              className="card cursor-pointer rounded-3xl border-2 border-transparent hover:border-gray-300 transition-all duration-150"
              onClick={() => router.push(`/dashboard/${gig.slug}`)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-lg">{gig.djName}</h2>
                    {gig.isClosed && (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded">
                        Closed
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">
                    {formatDateShort(new Date(gig.date))}
                    {gig.venueName && ` • ${gig.venueName}`}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {gig.totalGuests} guest{gig.totalGuests !== 1 ? 's' : ''}
                    {gig.guestCap && ` / ${gig.guestCap} cap`}
                    {' • '}
                    {gig.signUpCount} sign-up{gig.signUpCount !== 1 ? 's' : ''}
                  </p>
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
                  <button
                    onClick={() => downloadCsv(gig.slug)}
                    className="px-4 py-1.5 text-sm bg-[#5c7a6a] text-white rounded-full hover:bg-[#4a675a]"
                  >
                    Download CSV
                  </button>
                  <button
                    onClick={() => toggleClose(gig.slug, gig.isClosed)}
                    className="px-4 py-1.5 text-sm border border-gray-300 rounded-full hover:bg-gray-50"
                  >
                    {gig.isClosed ? 'Reopen' : 'Close'}
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

              return (
                <div
                  key={index}
                  className={`min-h-[100px] border border-gray-100 p-1 ${
                    date ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  {date && (
                    <>
                      <div className={`text-sm mb-1 ${
                        isToday
                          ? 'bg-gray-700 text-white w-6 h-6 rounded-full flex items-center justify-center'
                          : 'text-gray-500'
                      }`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayGigs.map((gig) => (
                          <div
                            key={gig.id}
                            className={`p-2 rounded-xl text-xs cursor-pointer border-2 hover:border-gray-400 transition-all duration-150 ${
                              gig.isClosed
                                ? 'bg-red-50 border-red-200'
                                : 'bg-blue-50 border-blue-200'
                            }`}
                            onClick={() => router.push(`/dashboard/${gig.slug}`)}
                          >
                            <div className="font-medium truncate">{gig.djName}</div>
                            <div className="text-gray-500 mt-0.5">
                              {gig.totalGuests}{gig.guestCap ? `/${gig.guestCap}` : ''} guests
                            </div>
                            <div
                              className="flex gap-1 mt-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => copyLink(gig.slug)}
                                className={`flex-1 px-1.5 py-1 rounded-full text-[10px] transition-all ${
                                  copiedSlug === gig.slug
                                    ? 'bg-[#5c7a6a] text-white'
                                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {copiedSlug === gig.slug ? 'Copied!' : 'Link'}
                              </button>
                              <button
                                onClick={() => downloadCsv(gig.slug)}
                                className="flex-1 px-1.5 py-1 bg-[#5c7a6a] text-white rounded-full text-[10px] hover:bg-[#4a675a]"
                              >
                                CSV
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
}

'use client'

import { useState, useEffect } from 'react'
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

export default function Dashboard() {
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    alert('Link copied!')
  }

  if (loading) {
    return (
      <main className="min-h-screen p-4 max-w-4xl mx-auto">
        <div className="text-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-black rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 pt-4">
        <h1 className="text-2xl font-bold">Guest Lists</h1>
        <a href="/" className="btn-primary text-sm">
          + Create New
        </a>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {gigs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">No guest lists yet</p>
          <a href="/" className="btn-primary inline-block">
            Create your first guest list
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {gigs.map((gig) => (
            <div key={gig.id} className="card">
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

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => copyLink(gig.slug)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Copy Link
                  </button>
                  <button
                    onClick={() => downloadCsv(gig.slug)}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Download CSV
                  </button>
                  <button
                    onClick={() => toggleClose(gig.slug, gig.isClosed)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    {gig.isClosed ? 'Reopen' : 'Close'}
                  </button>
                  <button
                    onClick={() => deleteGig(gig.slug)}
                    className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'

interface Guest {
  id: string
  name: string
  email: string
  quantity: number
  createdAt: string
}

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
  guests: Guest[]
}

export default function GigDetail() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [gig, setGig] = useState<Gig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedSlug, setCopiedSlug] = useState(false)

  async function fetchGig() {
    try {
      const response = await fetch(`/api/gigs/${slug}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Gig not found')
        } else {
          setError('Failed to load gig')
        }
        return
      }
      const data = await response.json()
      setGig(data)
    } catch {
      setError('Failed to load gig')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slug) {
      fetchGig()
    }
  }, [slug])

  function copyLink() {
    const url = `${window.location.origin}/gig/${slug}`
    navigator.clipboard.writeText(url)
    setCopiedSlug(true)
    setTimeout(() => setCopiedSlug(false), 2000)
  }

  function downloadCsv() {
    window.location.href = `/api/gigs/${slug}/csv`
  }

  async function toggleClose() {
    if (!gig) return
    try {
      const response = await fetch(`/api/gigs/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isClosed: !gig.isClosed }),
      })
      if (!response.ok) {
        throw new Error('Failed to update')
      }
      await fetchGig()
    } catch {
      alert('Failed to update')
    }
  }

  async function deleteGig() {
    if (!confirm('Are you sure you want to delete this guest list?')) return

    try {
      await fetch(`/api/gigs/${slug}`, { method: 'DELETE' })
      router.push('/dashboard')
    } catch {
      alert('Failed to delete')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen p-4 max-w-4xl mx-auto font-[Helvetica,Arial,sans-serif]">
        <div className="flex justify-center pt-4 mb-6">
          <Image
            src="/datcha-logo.png"
            alt="Datcha"
            width={150}
            height={50}
            className="h-12 w-auto"
          />
        </div>
        <div className="text-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-gray-700 rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  if (error || !gig) {
    return (
      <main className="min-h-screen p-4 max-w-4xl mx-auto font-[Helvetica,Arial,sans-serif]">
        <div className="flex justify-center pt-4 mb-6">
          <Image
            src="/datcha-logo.png"
            alt="Datcha"
            width={150}
            height={50}
            className="h-12 w-auto"
          />
        </div>
        <div className="text-center py-20">
          <p className="text-red-600 mb-4">{error || 'Gig not found'}</p>
          <button onClick={() => router.push('/dashboard')} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            Back to Dashboard
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 max-w-4xl mx-auto font-[Helvetica,Arial,sans-serif]">
      <div className="flex justify-center pt-4 mb-6">
        <Image
          src="/datcha-logo.png"
          alt="Datcha"
          width={150}
          height={50}
          className="h-12 w-auto"
        />
      </div>

      <div className="mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      <div className="card mb-6 rounded-3xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{gig.djName}</h1>
              {gig.isClosed && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded">
                  Closed
                </span>
              )}
            </div>
            <p className="text-gray-600">{formatDate(new Date(gig.date))}</p>
            <p className="text-gray-500 text-sm mt-2">
              {gig.totalGuests} guest{gig.totalGuests !== 1 ? 's' : ''}
              {gig.guestCap && ` / ${gig.guestCap} cap`}
              {' · '}
              {gig.signUpCount} sign-up{gig.signUpCount !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={copyLink}
              className={`px-4 py-2 text-sm border rounded-full transition-all ${
                copiedSlug
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {copiedSlug ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={downloadCsv}
              className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-full hover:bg-emerald-700"
            >
              Download CSV
            </button>
            <button
              onClick={toggleClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-full hover:bg-gray-50"
            >
              {gig.isClosed ? 'Reopen' : 'Close'}
            </button>
            <button
              onClick={deleteGig}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Delete"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="card rounded-3xl">
        <h2 className="text-lg font-semibold mb-4">Guest List</h2>

        {gig.guests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No guests yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Name</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Email</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-gray-600">Guests</th>
                </tr>
              </thead>
              <tbody>
                {gig.guests.map((guest) => (
                  <tr key={guest.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 px-2">{guest.name}</td>
                    <td className="py-3 px-2 text-gray-600">{guest.email}</td>
                    <td className="py-3 px-2 text-center">{guest.quantity}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 bg-gray-50">
                  <td className="py-3 px-2 font-medium" colSpan={2}>Total</td>
                  <td className="py-3 px-2 text-center font-medium">{gig.totalGuests}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

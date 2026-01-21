'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'

interface Gig {
  id: string
  slug: string
  date: string
  djName: string
  venueName: string | null
  guestCap: number | null
  isClosed: boolean
  totalGuests: number
}

export default function GigSignUp() {
  const params = useParams()
  const slug = params.slug as string
  const router = useRouter()
  const [gig, setGig] = useState<Gig | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchGig() {
      try {
        const response = await fetch(`/api/gigs/${slug}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('This guest list does not exist')
          } else {
            setError('Failed to load guest list')
          }
          return
        }
        const data = await response.json()
        setGig(data)
      } catch {
        setError('Failed to load guest list')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchGig()
    }
  }, [slug])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      quantity: formData.get('quantity'),
    }

    try {
      const response = await fetch(`/api/gigs/${slug}/guests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to sign up')
      }

      router.push(`/success/${slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 font-[Helvetica,Arial,sans-serif]">
        <div className="mb-8">
          <Image
            src="/datcha-logo.png"
            alt="Datcha"
            width={150}
            height={50}
            className="h-12 w-auto"
          />
        </div>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-gray-700 rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  if (error && !gig) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 font-[Helvetica,Arial,sans-serif]">
        <div className="mb-8">
          <Image
            src="/datcha-logo.png"
            alt="Datcha"
            width={150}
            height={50}
            className="h-12 w-auto"
          />
        </div>
        <div className="card max-w-lg w-full text-center rounded-3xl">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">Guest List Not Found</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </main>
    )
  }

  if (!gig) return null

  const isFull =
    gig.guestCap !== null && gig.totalGuests >= gig.guestCap
  const remainingSpots =
    gig.guestCap !== null ? gig.guestCap - gig.totalGuests : null
  const isUnavailable = gig.isClosed || isFull

  if (isUnavailable) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 font-[Helvetica,Arial,sans-serif]">
        <div className="mb-8">
          <Image
            src="/datcha-logo.png"
            alt="Datcha"
            width={150}
            height={50}
            className="h-12 w-auto"
          />
        </div>
        <div className="card max-w-lg w-full text-center rounded-3xl">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-orange-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">Guest List Unavailable</h1>
          <p className="text-gray-600 mb-4">
            {gig.isClosed
              ? 'This guest list has been closed.'
              : 'Sorry, the guest list is full!'}
          </p>
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="font-medium">{gig.djName}</p>
            <p className="text-gray-600">{formatDate(new Date(gig.date))}</p>
            {gig.venueName && (
              <p className="text-gray-500 text-sm">{gig.venueName}</p>
            )}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 font-[Helvetica,Arial,sans-serif]">
      <div className="mb-8">
        <Image
          src="/datcha-logo.png"
          alt="Datcha"
          width={150}
          height={50}
          className="h-12 w-auto"
        />
      </div>
      <div className="card max-w-lg w-full rounded-3xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1">{gig.djName}</h1>
          <p className="text-gray-600">{formatDate(new Date(gig.date))}</p>
          {gig.venueName && (
            <p className="text-gray-500 text-sm">{gig.venueName}</p>
          )}
        </div>

        {remainingSpots !== null && remainingSpots <= 10 && (
          <div className="bg-orange-50 text-orange-800 p-3 rounded-2xl text-sm text-center mb-6">
            Only {remainingSpots} spot{remainingSpots === 1 ? '' : 's'} remaining!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="label">
              Your Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="input-field rounded-lg"
              placeholder="Full name"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="email" className="label">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="input-field rounded-lg"
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="quantity" className="label">
              Number of Guests (including yourself) *
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              required
              min="1"
              max={remainingSpots ?? undefined}
              defaultValue="1"
              className="input-field rounded-lg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Include yourself and any +1s
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
            disabled={submitting}
          >
            {submitting ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </main>
  )
}

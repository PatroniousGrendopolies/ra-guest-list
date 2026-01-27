// Public guest signup form - collects name, email, and party size.

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'

interface Gig {
  id: string
  slug: string
  date: string
  djName: string
  venueName: string | null
  guestCap: number | null
  maxPerSignup: number
  isClosed: boolean
  totalGuests: number
}

interface GigSignUpClientProps {
  slug: string
}

export default function GigSignUpClient({ slug }: GigSignUpClientProps) {
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
      marketingConsent: formData.get('marketingConsent') === 'on',
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
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#fcfcfd]">
        <div className="mb-8">
          <Image
            src="/datcha-logo-black.jpg"
            alt="Datcha"
            width={235}
            height={79}
            className="h-[75px] w-auto"
          />
        </div>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  if (error && !gig) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#fcfcfd]">
        <div className="mb-8">
          <Image
            src="/datcha-logo-black.jpg"
            alt="Datcha"
            width={235}
            height={79}
            className="h-[75px] w-auto"
          />
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-900"
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
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#fcfcfd]">
        <div className="mb-8">
          <Image
            src="/datcha-logo-black.jpg"
            alt="Datcha"
            width={235}
            height={79}
            className="h-[75px] w-auto"
          />
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-900"
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
          <div className="bg-gray-50 rounded-3xl p-4">
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
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#fcfcfd]">
      <div className="mb-8">
        <Image
          src="/datcha-logo-black.jpg"
          alt="Datcha"
          width={235}
          height={79}
          className="h-[75px] w-auto"
        />
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-lg w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1">{gig.djName}</h1>
          <p className="text-gray-600">{formatDate(new Date(gig.date))}</p>
          <p className="text-gray-500 mt-2">Join the guestlist</p>
          {gig.venueName && (
            <p className="text-gray-500 text-sm">{gig.venueName}</p>
          )}
        </div>

        {remainingSpots !== null && remainingSpots <= 10 && (
          <div className="bg-gray-100 border border-gray-200 text-gray-700 p-3 rounded-3xl text-sm text-center mb-6">
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl text-base bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent transition-shadow autofill:bg-white autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]"
              placeholder="Full name"
              autoComplete="name"
            />
          </div>

          <div>
            <p className="text-gray-500 text-sm mb-2">Guestlist tickets are sent via email</p>
            <label htmlFor="email" className="label">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl text-base bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent transition-shadow autofill:bg-white autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]"
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="quantity" className="label">
              Number of Guests (including yourself) *
            </label>
            {(() => {
              const effectiveMax = remainingSpots !== null ? Math.min(gig.maxPerSignup, remainingSpots) : gig.maxPerSignup
              return (
                <>
                  <input
                    type="number"
                    id="quantity"
                    name="quantity"
                    required
                    min="1"
                    max={effectiveMax}
                    defaultValue="1"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl text-base bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent transition-shadow autofill:bg-white autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Include yourself and any +1s (max {effectiveMax})
                  </p>
                </>
              )
            })()}
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="marketingConsent"
              name="marketingConsent"
              defaultChecked={true}
              className="mt-1 h-4 w-4 rounded border-gray-300 accent-gray-900 focus:ring-gray-600 cursor-pointer"
            />
            <label htmlFor="marketingConsent" className="text-sm text-gray-600 cursor-pointer">
              Get early access to private lists and exclusive event invites
            </label>
          </div>

          {error && (
            <div className="bg-gray-100 border border-gray-300 text-gray-900 p-4 rounded-3xl text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full px-5 py-2.5 bg-gray-400 text-white rounded-full font-medium hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            {submitting ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </main>
  )
}

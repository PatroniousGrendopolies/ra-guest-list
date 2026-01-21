'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdGig, setCreatedGig] = useState<{
    slug: string
    djName: string
  } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data = {
      date: formData.get('date'),
      djName: formData.get('djName'),
      venueName: formData.get('venueName'),
      guestCap: formData.get('guestCap'),
    }

    try {
      const response = await fetch('/api/gigs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to create gig')
      }

      const gig = await response.json()
      setCreatedGig({ slug: gig.slug, djName: gig.djName })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function getGuestListUrl() {
    if (!createdGig) return ''
    return `${window.location.origin}/gig/${createdGig.slug}`
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(getGuestListUrl())
  }

  if (createdGig) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="card max-w-lg w-full text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
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
            <h1 className="text-2xl font-bold mb-2">Guest List Created!</h1>
            <p className="text-gray-600">
              Share this link with {createdGig.djName} to collect guest signups
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-2">Guest list link:</p>
            <p className="font-mono text-sm break-all">{getGuestListUrl()}</p>
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={copyToClipboard} className="btn-primary">
              Copy Link
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="btn-secondary"
            >
              View Dashboard
            </button>
            <button
              onClick={() => setCreatedGig(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              Create Another
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Guest List Creator</h1>
          <p className="text-gray-600">
            Create a sign-up link for your event&apos;s guest list
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="djName" className="label">
              DJ / Artist Name *
            </label>
            <input
              type="text"
              id="djName"
              name="djName"
              required
              className="input-field"
              placeholder="e.g. DJ Shadow"
            />
          </div>

          <div>
            <label htmlFor="date" className="label">
              Event Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              required
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="venueName" className="label">
              Venue Name (optional)
            </label>
            <input
              type="text"
              id="venueName"
              name="venueName"
              className="input-field"
              placeholder="e.g. Club XYZ"
            />
          </div>

          <div>
            <label htmlFor="guestCap" className="label">
              Guest Cap (optional)
            </label>
            <input
              type="number"
              id="guestCap"
              name="guestCap"
              min="1"
              className="input-field"
              placeholder="Leave empty for unlimited"
            />
            <p className="text-sm text-gray-500 mt-1">
              Maximum total guests including +1s
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Guest List Link'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <a
            href="/dashboard"
            className="text-gray-600 hover:text-black text-sm"
          >
            View existing guest lists
          </a>
        </div>
      </div>
    </main>
  )
}

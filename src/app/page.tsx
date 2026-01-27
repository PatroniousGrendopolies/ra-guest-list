// Home page form for creating a new guest list.

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface ExistingGig {
  id: string
  date: string
  djName: string
}

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdGig, setCreatedGig] = useState<{
    slug: string
    djName: string
  } | null>(null)
  const [copied, setCopied] = useState(false)
  const [existingGigs, setExistingGigs] = useState<ExistingGig[]>([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingData, setPendingData] = useState<{
    date: string
    djName: string
    guestCap: string | null
    maxPerSignup: string
  } | null>(null)
  const [conflictingGigs, setConflictingGigs] = useState<ExistingGig[]>([])

  useEffect(() => {
    async function fetchGigs() {
      try {
        const response = await fetch('/api/gigs')
        if (response.ok) {
          const data = await response.json()
          setExistingGigs(data)
        }
      } catch {
        // Silently fail - not critical for form to work
      }
    }
    fetchGigs()
  }, [])

  function getGigsOnDate(dateStr: string) {
    return existingGigs.filter((gig) => {
      const gigDate = new Date(gig.date)
      const selectedDate = new Date(dateStr)
      return (
        gigDate.getFullYear() === selectedDate.getFullYear() &&
        gigDate.getMonth() === selectedDate.getMonth() &&
        gigDate.getDate() === selectedDate.getDate()
      )
    })
  }

  async function createGig(data: { date: string; djName: string; guestCap: string | null }) {
    setLoading(true)
    setError('')

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const guestCapValue = formData.get('guestCap') as string
    const maxPerSignupValue = formData.get('maxPerSignup') as string
    const data = {
      date: formData.get('date') as string,
      djName: formData.get('djName') as string,
      guestCap: guestCapValue && guestCapValue.trim() !== '' ? guestCapValue : null,
      maxPerSignup: maxPerSignupValue || '10',
    }

    const gigsOnDate = getGigsOnDate(data.date)
    if (gigsOnDate.length > 0) {
      setPendingData(data)
      setConflictingGigs(gigsOnDate)
      setShowConfirm(true)
      return
    }

    await createGig(data)
  }

  function handleConfirm() {
    if (pendingData) {
      createGig(pendingData)
    }
    setShowConfirm(false)
    setPendingData(null)
    setConflictingGigs([])
  }

  function handleCancel() {
    setShowConfirm(false)
    setPendingData(null)
    setConflictingGigs([])
  }

  function getGuestListUrl() {
    if (!createdGig) return ''
    return `${window.location.origin}/gig/${createdGig.slug}`
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(getGuestListUrl())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (createdGig) {
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
          <div className="mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-700"
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

          <div className="bg-gray-50 rounded-3xl p-4 mb-6">
            <p className="text-sm text-gray-500 mb-2">Guest list link:</p>
            <p className="font-mono text-sm break-all">{getGuestListUrl()}</p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={copyToClipboard}
              className={`px-5 py-2.5 rounded-full font-medium text-white transition-colors ${copied ? 'bg-gray-900 hover:bg-gray-800' : 'bg-gray-900 hover:bg-gray-800'}`}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
            >
              View Dashboard
            </button>
            <button
              onClick={() => setCreatedGig(null)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Create Another
            </button>
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
        <div className="text-center mb-8">
          <h1 className="text-2xl font-medium mb-2">Guest List Creator</h1>
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl text-base bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent transition-shadow autofill:bg-white autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]"
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
              className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl text-base bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent transition-shadow autofill:bg-white autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]"
            />
          </div>

          <div>
            <label htmlFor="guestCap" className="label">
              Guestlist Capacity
            </label>
            <input
              type="number"
              id="guestCap"
              name="guestCap"
              min="1"
              defaultValue="75"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl text-base bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent transition-shadow autofill:bg-white autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]"
            />
            <p className="text-sm text-gray-500 mt-1">
              Maximum total guests including +1s
            </p>
          </div>

          <div>
            <label htmlFor="maxPerSignup" className="label">
              Max Guests Per Signup
            </label>
            <input
              type="number"
              id="maxPerSignup"
              name="maxPerSignup"
              min="1"
              defaultValue="10"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl text-base bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent transition-shadow autofill:bg-white autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]"
            />
            <p className="text-sm text-gray-500 mt-1">
              Maximum +1s allowed per signup
            </p>
          </div>

          {error && (
            <div className="bg-gray-100 border border-gray-300 text-gray-900 p-4 rounded-3xl text-sm flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="w-full px-5 py-2.5 bg-gray-400 text-white rounded-full font-medium hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={loading}>
            {loading ? 'Creating...' : 'Create Guest List Link'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <a
            href="/dashboard"
            className="block w-full px-5 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm rounded-full font-medium text-center transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Date Already Has Events</h2>
            <p className="text-gray-600 mb-4">
              There {conflictingGigs.length === 1 ? 'is' : 'are'} already {conflictingGigs.length} guest list{conflictingGigs.length !== 1 ? 's' : ''} on{' '}
              <span className="font-medium">{pendingData && formatDate(pendingData.date)}</span>:
            </p>
            <ul className="bg-gray-50 rounded-3xl p-3 mb-4 space-y-2">
              {conflictingGigs.map((gig) => (
                <li key={gig.id} className="text-sm">
                  <span className="font-medium">{gig.djName}</span>
                </li>
              ))}
            </ul>
            <p className="text-gray-600 mb-6">
              Do you want to create another guest list for this date?
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-5 py-2.5 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Yes, Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

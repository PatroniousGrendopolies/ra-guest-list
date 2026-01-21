'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { formatDate } from '@/lib/utils'

interface Gig {
  djName: string
  date: string
  venueName: string | null
}

export default function SuccessPage() {
  const params = useParams()
  const slug = params.slug as string
  const [gig, setGig] = useState<Gig | null>(null)

  useEffect(() => {
    async function fetchGig() {
      try {
        const response = await fetch(`/api/gigs/${slug}`)
        if (response.ok) {
          const data = await response.json()
          setGig(data)
        }
      } catch {
        // Ignore errors, we'll just show generic success
      }
    }

    if (slug) {
      fetchGig()
    }
  }, [slug])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 font-[Helvetica,Arial,sans-serif]">
      <div className="mb-8">
        <Image
          src="/datcha-logo-black.jpg"
          alt="Datcha"
          width={235}
          height={79}
          className="h-[75px] w-auto"
        />
      </div>
      <div className="card max-w-lg w-full text-center rounded-3xl">
        <div className="mb-6">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-emerald-600"
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
          <h1 className="text-2xl font-bold mb-2">You&apos;re on the list!</h1>
          <p className="text-gray-600">
            Your spot has been reserved. See you there!
          </p>
          <p className="text-gray-500 text-sm mt-3">
            Resident Advisor will email your QR code ticket before the event.
          </p>
        </div>

        {gig && (
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="font-medium text-lg">{gig.djName}</p>
            <p className="text-gray-600">{formatDate(new Date(gig.date))}</p>
            {gig.venueName && (
              <p className="text-gray-500 text-sm">{gig.venueName}</p>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

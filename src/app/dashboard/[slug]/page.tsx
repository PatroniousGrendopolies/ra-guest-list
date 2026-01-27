// Detail page for a single gig - view/edit guests and gig settings.

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
  maxPerSignup: number
  isClosed: boolean
  lastExportedAt: string | null
  totalGuests: number
  signUpCount: number
  guests: Guest[]
}

interface EditModalProps {
  gig: Gig
  onClose: () => void
  onSave: () => void
}

interface GuestEditModalProps {
  guest: Guest
  gig: Gig
  onClose: () => void
  onSave: () => void
}

function isNewGuest(guestCreatedAt: string, lastExportedAt: string | null): boolean {
  if (!lastExportedAt) return false
  return new Date(guestCreatedAt) > new Date(lastExportedAt)
}

function GuestEditModal({ guest, gig: _gig, onClose, onSave }: GuestEditModalProps) {
  void _gig // Reserved for potential future use
  const [quantity, setQuantity] = useState<string>(guest.quantity.toString())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const response = await fetch(`/api/guests/${guest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: parseInt(quantity, 10) }),
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

  async function handleDelete() {
    if (!confirm(`Remove ${guest.name} from the guest list?`)) return
    setDeleting(true)

    try {
      const response = await fetch(`/api/guests/${guest.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete')
      }

      onSave()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-1">Edit Guest</h2>
        <p className="text-gray-600 mb-4">{guest.name} ({guest.email})</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Number of Guests
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min={1}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl text-base bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent transition-shadow autofill:bg-white autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]"
              required
            />
          </div>

          {error && (
            <div className="bg-gray-100 border border-gray-300 text-gray-900 p-4 rounded-3xl text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleDelete}
              className="px-5 py-2.5 text-gray-900 border border-gray-300 rounded-full font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving || deleting}
            >
              {deleting ? 'Removing...' : 'Remove'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
              disabled={saving || deleting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-5 py-2.5 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving || deleting || !quantity || parseInt(quantity) < 1}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
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
        className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Edit Guest List</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              DJ / Artist Name
            </label>
            <input
              type="text"
              value={djName}
              onChange={(e) => setDjName(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl text-base bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent transition-shadow autofill:bg-white autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl text-base bg-white text-gray-900 cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent transition-shadow"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Guest Cap {gig.totalGuests > 0 && <span className="text-gray-500 font-normal">(min: {gig.totalGuests})</span>}
            </label>
            <input
              type="number"
              value={guestCap}
              onChange={(e) => setGuestCap(e.target.value)}
              min={gig.totalGuests || 1}
              placeholder="No limit"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl text-base bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent transition-shadow autofill:bg-white autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]"
            />
            {gig.totalGuests > 0 && (
              <p className="text-xs text-gray-500 mt-1.5">
                Currently {gig.totalGuests} guest{gig.totalGuests !== 1 ? 's' : ''} on the list
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Max Guests Per Signup
            </label>
            <input
              type="number"
              value={maxPerSignup}
              onChange={(e) => setMaxPerSignup(e.target.value)}
              min={1}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-2xl text-base bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-600 focus:border-transparent transition-shadow autofill:bg-white autofill:shadow-[inset_0_0_0px_1000px_rgb(255,255,255)]"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Maximum +1s allowed per signup
            </p>
          </div>

          {error && (
            <div className="bg-gray-100 border border-gray-300 text-gray-900 p-4 rounded-3xl text-sm">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-2.5 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-5 py-2.5 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

export default function GigDetail() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const [gig, setGig] = useState<Gig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copiedSlug, setCopiedSlug] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)

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

  function downloadNewCsv() {
    window.location.href = `/api/gigs/${slug}/csv?newOnly=true`
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
      <main className="min-h-screen p-4 max-w-6xl mx-auto bg-[#fcfcfd]">
        <div className="flex justify-center pt-4 mb-6">
          <Image
            src="/datcha-logo-black.jpg"
            alt="Datcha"
            width={235}
            height={79}
            className="h-[75px] w-auto"
          />
        </div>
        <div className="text-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </main>
    )
  }

  if (error || !gig) {
    return (
      <main className="min-h-screen p-4 max-w-6xl mx-auto bg-[#fcfcfd]">
        <div className="flex justify-center pt-4 mb-6">
          <Image
            src="/datcha-logo-black.jpg"
            alt="Datcha"
            width={235}
            height={79}
            className="h-[75px] w-auto"
          />
        </div>
        <div className="text-center py-20">
          <p className="text-gray-900 mb-4">{error || 'Gig not found'}</p>
          <button onClick={() => router.push('/dashboard')} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors">
            Back to Dashboard
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 max-w-6xl mx-auto bg-[#fcfcfd]">
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
          className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold">{gig.djName}</h1>
              {gig.isClosed && (
                <span className="bg-gray-200 text-gray-900 text-xs px-2.5 py-1 rounded-full inline-flex items-center">
                  Closed
                </span>
              )}
            </div>
            <p className="text-gray-600">{formatDate(new Date(gig.date))}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={copyLink}
              className={`px-3 py-1.5 text-xs border-[1.5px] rounded-full font-medium transition-colors ${
                copiedSlug
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'border-gray-900 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {copiedSlug ? 'Copied!' : 'Copy Link'}
            </button>
            {(() => {
              const newGuestCount = gig.lastExportedAt
                ? gig.guests.filter(g => isNewGuest(g.createdAt, gig.lastExportedAt)).length
                : 0
              const hasBeenExported = !!gig.lastExportedAt

              return (
                <>
                  {newGuestCount > 0 && (
                    <button
                      onClick={downloadNewCsv}
                      className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
                    >
                      Download CSV - New ({newGuestCount})
                    </button>
                  )}
                  <button
                    onClick={downloadCsv}
                    className="px-3 py-1.5 text-xs bg-gray-50 text-gray-500 rounded-full font-medium hover:bg-gray-100 transition-colors"
                  >
                    {hasBeenExported ? 'Download CSV - All' : 'Download CSV'}
                  </button>
                </>
              )
            })()}
            <button
              onClick={toggleClose}
              className="px-3 py-1.5 text-xs border border-gray-200 text-gray-400 rounded-full font-medium hover:bg-gray-50 transition-colors"
            >
              {gig.isClosed ? 'Reopen' : 'Close'}
            </button>
            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Edit"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
              </svg>
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

        {gig.lastExportedAt && (
          <p className="text-sm text-gray-500 mt-3">
            Last exported: {new Date(gig.lastExportedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </p>
        )}

        {/* Progress bar - full width */}
        {gig.guestCap && (
          <div className="mt-4">
            {(() => {
              const percentage = (gig.totalGuests / gig.guestCap) * 100
              const isEmpty = gig.totalGuests === 0
              const isFull = gig.totalGuests >= gig.guestCap
              return (
                <>
                  <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                    {!isEmpty && (
                      <div
                        className="h-full bg-gray-900 rounded-full flex items-center justify-end pr-2 min-w-[2.5rem]"
                        style={{ width: isFull ? '100%' : `${Math.max(percentage, 10)}%` }}
                      >
                        <span className="text-white text-xs font-medium">{gig.totalGuests}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>Confirmed</span>
                    <span>{gig.guestCap - gig.totalGuests} spots available</span>
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
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
                  <tr
                    key={guest.id}
                    className="border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setEditingGuest(guest)}
                  >
                    <td className="py-3 px-2">
                      <span className="flex items-center gap-2">
                        {guest.name}
                        {isNewGuest(guest.createdAt, gig.lastExportedAt) && (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full inline-flex items-center">
                            NEW
                          </span>
                        )}
                      </span>
                    </td>
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

      {/* Edit Modal */}
      {showEditModal && gig && (
        <EditModal
          gig={gig}
          onClose={() => setShowEditModal(false)}
          onSave={fetchGig}
        />
      )}

      {/* Guest Edit Modal */}
      {editingGuest && gig && (
        <GuestEditModal
          guest={editingGuest}
          gig={gig}
          onClose={() => setEditingGuest(null)}
          onSave={fetchGig}
        />
      )}
    </main>
  )
}

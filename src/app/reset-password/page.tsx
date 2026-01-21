'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send reset email')
        return
      }

      setSuccess(true)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 font-[Helvetica,Arial,sans-serif]">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Image
            src="/datcha-logo-black.jpg"
            alt="Datcha"
            width={235}
            height={79}
            className="h-[75px] w-auto"
          />
        </div>

        <div className="card rounded-3xl">
          <h1 className="text-2xl font-bold text-center mb-2">Reset Password</h1>
          <p className="text-gray-600 text-center mb-6">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          {success ? (
            <div className="text-center">
              <div className="bg-green-50 text-green-700 p-4 rounded-2xl mb-4">
                Check your email for a password reset link.
              </div>
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-400"
                    required
                    autoComplete="email"
                  />
                </div>

                {error && (
                  <p className="text-red-600 text-sm text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-700 text-white rounded-full hover:bg-gray-800 disabled:opacity-50 font-medium"
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
                >
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

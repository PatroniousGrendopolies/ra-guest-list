import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard']
const PROTECTED_API_PATHS = ['/api/gigs', '/api/guests']

const SESSION_SECRET = process.env.SESSION_SECRET || 'default-secret-change-me'

// Edge-compatible HMAC signing using Web Crypto API
async function sign(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function verifySignature(data: string, signature: string): Promise<boolean> {
  const expected = await sign(data)
  if (expected.length !== signature.length) return false
  // Constant-time comparison
  let result = 0
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return result === 0
}

async function verifySessionToken(token: string): Promise<string | null> {
  try {
    const decoded = atob(token.replace(/-/g, '+').replace(/_/g, '/'))
    const parts = decoded.split(':')
    if (parts.length !== 3) return null

    const [email, timestamp, signature] = parts
    const data = `${email}:${timestamp}`

    if (!(await verifySignature(data, signature))) return null

    return email
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if this is a protected page route
  const isProtectedPage = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path)
  )

  // Check if this is a protected API route
  const isProtectedApi = PROTECTED_API_PATHS.some((path) =>
    pathname.startsWith(path)
  )

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next()
  }

  // Get session cookie
  const sessionToken = request.cookies.get('auth_session')?.value

  if (!sessionToken) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Verify session token
  const email = await verifySessionToken(sessionToken)
  if (!email) {
    if (isProtectedApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/gigs/:path*',
    '/api/guests/:path*',
  ],
}

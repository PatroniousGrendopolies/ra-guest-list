import { scrypt, randomBytes, timingSafeEqual, createHmac } from 'crypto'
import { cookies } from 'next/headers'

const SESSION_SECRET = process.env.SESSION_SECRET || 'default-secret-change-me'
const COOKIE_NAME = 'auth_session'

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const hash = await new Promise<string>((resolve, reject) => {
    scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err)
      resolve(derivedKey.toString('hex'))
    })
  })
  return `${salt}:${hash}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':')
  const hashBuffer = Buffer.from(hash, 'hex')
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, 64, (err, key) => {
      if (err) reject(err)
      resolve(key)
    })
  })
  return timingSafeEqual(hashBuffer, derivedKey)
}

function sign(data: string): string {
  const hmac = createHmac('sha256', SESSION_SECRET)
  hmac.update(data)
  return hmac.digest('hex')
}

function verifySignature(data: string, signature: string): boolean {
  const expected = sign(data)
  if (expected.length !== signature.length) return false
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

export function createSessionToken(email: string): string {
  const data = `${email}:${Date.now()}`
  const signature = sign(data)
  return Buffer.from(`${data}:${signature}`).toString('base64url')
}

export function verifySessionToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const parts = decoded.split(':')
    if (parts.length !== 3) return null

    const [email, timestamp, signature] = parts
    const data = `${email}:${timestamp}`

    if (!verifySignature(data, signature)) return null

    return email
  } catch {
    return null
  }
}

export function createResetToken(email: string, passwordHash: string): string {
  const expiry = Date.now() + 60 * 60 * 1000 // 1 hour
  const data = `${email}:${expiry}`
  const hmac = createHmac('sha256', SESSION_SECRET + passwordHash)
  hmac.update(data)
  const signature = hmac.digest('hex')
  return Buffer.from(`${data}:${signature}`).toString('base64url')
}

export function verifyResetToken(token: string, passwordHash: string): { email: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString()
    const parts = decoded.split(':')
    if (parts.length !== 3) return null

    const [email, expiry, signature] = parts
    const data = `${email}:${expiry}`

    // Check expiry
    if (Date.now() > parseInt(expiry, 10)) return null

    // Verify signature using password hash (so token invalidates when password changes)
    const hmac = createHmac('sha256', SESSION_SECRET + passwordHash)
    hmac.update(data)
    const expected = hmac.digest('hex')

    if (expected.length !== signature.length) return null
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null

    return { email }
  } catch {
    return null
  }
}

export async function setSessionCookie(email: string): Promise<void> {
  const token = createSessionToken(email)
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // No maxAge = session cookie (expires when browser closes)
  })
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyResetToken, hashPassword } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // First, decode the token to get the email
    const decoded = Buffer.from(token, 'base64url').toString()
    const parts = decoded.split(':')
    if (parts.length !== 3) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 }
      )
    }

    const [email] = parts

    // Find admin config to get current password hash for verification
    const admin = await prisma.adminConfig.findUnique({
      where: { email },
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 }
      )
    }

    // Verify the token with the current password hash
    const verified = verifyResetToken(token, admin.passwordHash)
    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 }
      )
    }

    // Hash new password and update
    const newPasswordHash = await hashPassword(password)
    await prisma.adminConfig.update({
      where: { email: admin.email },
      data: { passwordHash: newPasswordHash },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Confirm reset error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

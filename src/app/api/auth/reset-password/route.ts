import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createResetToken } from '@/lib/auth'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find admin config by email
    const admin = await prisma.adminConfig.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return success to prevent email enumeration
    if (!admin) {
      return NextResponse.json({ success: true })
    }

    // Generate reset token
    const resetToken = createResetToken(admin.email, admin.passwordHash)

    // Send reset email
    await sendPasswordResetEmail(admin.email, resetToken)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

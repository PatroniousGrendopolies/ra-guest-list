import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const resetUrl = `${baseUrl}/reset-password/${resetToken}`

  try {
    await resend.emails.send({
      from: 'Datcha Guest List <onboarding@resend.dev>',
      to: email,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 20px;">Reset Your Password</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            You requested to reset your password. Click the button below to set a new password.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #374151; color: white; padding: 12px 24px; text-decoration: none; border-radius: 9999px; font-size: 14px; font-weight: 500;">
            Reset Password
          </a>
          <p style="color: #999; font-size: 14px; margin-top: 20px;">
            This link expires in 1 hour. If you didn't request this, you can ignore this email.
          </p>
          <p style="color: #999; font-size: 14px; margin-top: 20px;">
            Or copy and paste this URL into your browser:<br>
            <a href="${resetUrl}" style="color: #666;">${resetUrl}</a>
          </p>
        </div>
      `,
    })
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

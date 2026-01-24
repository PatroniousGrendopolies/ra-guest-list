// API endpoint for public guest signup - validates capacity and creates guest entry.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const body = await request.json()
    const { name, email, quantity } = body

    if (!name || !email || !quantity) {
      return NextResponse.json(
        { error: 'Name, email, and quantity are required' },
        { status: 400 }
      )
    }

    const parsedQuantity = parseInt(quantity)
    if (isNaN(parsedQuantity) || parsedQuantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      )
    }

    // Get the gig and check capacity atomically
    const gig = await prisma.gig.findUnique({
      where: { slug },
      include: { guests: true },
    })

    if (!gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 })
    }

    if (gig.isClosed) {
      return NextResponse.json(
        { error: 'This guest list is closed' },
        { status: 400 }
      )
    }

    // Normalize email for comparison and storage
    const normalizedEmail = email.toLowerCase().trim()

    // Check for duplicate email (case-insensitive)
    const existingGuest = await prisma.guest.findFirst({
      where: {
        gigId: gig.id,
        email: { equals: normalizedEmail, mode: 'insensitive' }
      }
    })

    if (existingGuest) {
      return NextResponse.json(
        { error: 'This email is already on the guest list' },
        { status: 409 }
      )
    }

    // Check max per signup
    if (parsedQuantity > gig.maxPerSignup) {
      return NextResponse.json(
        { error: `Maximum ${gig.maxPerSignup} guests per signup` },
        { status: 400 }
      )
    }

    const currentTotal = gig.guests.reduce((sum, g) => sum + g.quantity, 0)

    if (gig.guestCap !== null) {
      const remainingSpots = gig.guestCap - currentTotal

      if (remainingSpots <= 0) {
        return NextResponse.json(
          { error: 'Sorry, the guest list is full!' },
          { status: 400 }
        )
      }

      if (parsedQuantity > remainingSpots) {
        return NextResponse.json(
          {
            error: `Only ${remainingSpots} spot${remainingSpots === 1 ? '' : 's'} remaining`,
          },
          { status: 400 }
        )
      }
    }

    // Create the guest entry
    const guest = await prisma.guest.create({
      data: {
        name,
        email: normalizedEmail,
        quantity: parsedQuantity,
        gigId: gig.id,
      },
    })

    return NextResponse.json(guest, { status: 201 })
  } catch (error) {
    console.error('Error creating guest:', error)
    return NextResponse.json(
      { error: 'Failed to sign up. Please try again.' },
      { status: 500 }
    )
  }
}

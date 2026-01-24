// API endpoints for listing all gigs (GET) and creating a single gig (POST).

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'

export async function GET() {
  try {
    const gigs = await prisma.gig.findMany({
      orderBy: { date: 'desc' },
      include: {
        guests: true,
      },
    })

    const gigsWithCounts = gigs.map((gig) => {
      const newGuestCount = gig.lastExportedAt
        ? gig.guests.filter(g => new Date(g.createdAt) > new Date(gig.lastExportedAt!)).length
        : 0
      return {
        ...gig,
        totalGuests: gig.guests.reduce((sum, g) => sum + g.quantity, 0),
        signUpCount: gig.guests.length,
        newGuestCount,
      }
    })

    return NextResponse.json(gigsWithCounts)
  } catch (error) {
    console.error('Error fetching gigs:', error)
    return NextResponse.json({ error: 'Failed to fetch gigs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, djName, venueName, guestCap, maxPerSignup } = body

    if (!date || !djName) {
      return NextResponse.json(
        { error: 'Date and DJ name are required' },
        { status: 400 }
      )
    }

    const slug = generateSlug()

    const gig = await prisma.gig.create({
      data: {
        slug,
        date: new Date(date),
        djName,
        venueName: venueName || null,
        guestCap: guestCap ? parseInt(guestCap) : null,
        maxPerSignup: maxPerSignup ? parseInt(maxPerSignup) : 10,
      },
    })

    return NextResponse.json(gig, { status: 201 })
  } catch (error) {
    console.error('Error creating gig:', error)
    return NextResponse.json({ error: 'Failed to create gig' }, { status: 500 })
  }
}

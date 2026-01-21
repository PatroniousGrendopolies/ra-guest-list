import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'

interface GigInput {
  date: string
  djName: string
  guestCap?: number | null
  maxPerSignup?: number
}

interface CreatedGig {
  id: string
  slug: string
  date: Date
  djName: string
  guestCap: number | null
  maxPerSignup: number
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gigs } = body as { gigs: GigInput[] }

    if (!Array.isArray(gigs) || gigs.length === 0) {
      return NextResponse.json(
        { error: 'gigs array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Validate all gigs have required fields before creating any
    const validationErrors: string[] = []
    for (let i = 0; i < gigs.length; i++) {
      const gig = gigs[i]
      if (!gig.date) {
        validationErrors.push(`Gig at index ${i} is missing date`)
      }
      if (!gig.djName || !gig.djName.trim()) {
        validationErrors.push(`Gig at index ${i} is missing djName`)
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      )
    }

    // Create all gigs in a single transaction for atomicity
    const createdGigs = await prisma.$transaction(
      gigs.map((gig) =>
        prisma.gig.create({
          data: {
            slug: generateSlug(),
            date: new Date(gig.date),
            djName: gig.djName.trim(),
            guestCap: gig.guestCap ?? 75,
            maxPerSignup: gig.maxPerSignup ?? 10,
          },
          select: {
            id: true,
            slug: true,
            date: true,
            djName: true,
            guestCap: true,
            maxPerSignup: true,
          },
        })
      )
    )

    return NextResponse.json(
      {
        success: true,
        count: createdGigs.length,
        gigs: createdGigs as CreatedGig[],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating gigs in batch:', error)
    return NextResponse.json(
      { error: 'Failed to create gigs' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const gig = await prisma.gig.findUnique({
      where: { slug },
      include: {
        guests: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 })
    }

    const totalGuests = gig.guests.reduce((sum, g) => sum + g.quantity, 0)

    return NextResponse.json({
      ...gig,
      totalGuests,
      signUpCount: gig.guests.length,
    })
  } catch (error) {
    console.error('Error fetching gig:', error)
    return NextResponse.json({ error: 'Failed to fetch gig' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // If guestCap is being updated, validate it's not below current guest count
    if (body.guestCap !== undefined && body.guestCap !== null) {
      const existingGig = await prisma.gig.findUnique({
        where: { slug },
        include: { guests: true },
      })

      if (!existingGig) {
        return NextResponse.json({ error: 'Gig not found' }, { status: 404 })
      }

      const totalGuests = existingGig.guests.reduce((sum, g) => sum + g.quantity, 0)

      if (body.guestCap < totalGuests) {
        return NextResponse.json(
          { error: `Cannot set guest cap below current guest count (${totalGuests})` },
          { status: 400 }
        )
      }
    }

    const gig = await prisma.gig.update({
      where: { slug },
      data: {
        ...(body.djName !== undefined && { djName: body.djName }),
        ...(body.guestCap !== undefined && { guestCap: body.guestCap }),
        ...(body.maxPerSignup !== undefined && { maxPerSignup: body.maxPerSignup }),
        ...(body.isClosed !== undefined && { isClosed: body.isClosed }),
      },
    })

    return NextResponse.json(gig)
  } catch (error) {
    console.error('Error updating gig:', error)
    return NextResponse.json({ error: 'Failed to update gig' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    await prisma.gig.delete({
      where: { slug },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting gig:', error)
    return NextResponse.json({ error: 'Failed to delete gig' }, { status: 500 })
  }
}

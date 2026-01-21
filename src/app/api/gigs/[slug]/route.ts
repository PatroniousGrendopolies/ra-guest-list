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

    const gig = await prisma.gig.update({
      where: { slug },
      data: {
        ...(body.guestCap !== undefined && { guestCap: body.guestCap }),
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

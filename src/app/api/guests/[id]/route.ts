import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const guest = await prisma.guest.findUnique({
      where: { id },
      include: { gig: { include: { guests: true } } },
    })

    if (!guest) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 })
    }

    // Validate quantity if provided
    if (body.quantity !== undefined) {
      const newQuantity = parseInt(body.quantity)
      if (isNaN(newQuantity) || newQuantity < 1) {
        return NextResponse.json(
          { error: 'Quantity must be at least 1' },
          { status: 400 }
        )
      }
      // Admin edits can exceed guest cap - no cap validation here
    }

    const updatedGuest = await prisma.guest.update({
      where: { id },
      data: {
        ...(body.quantity !== undefined && { quantity: parseInt(body.quantity) }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email }),
      },
    })

    return NextResponse.json(updatedGuest)
  } catch (error) {
    console.error('Error updating guest:', error)
    return NextResponse.json({ error: 'Failed to update guest' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.guest.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting guest:', error)
    return NextResponse.json({ error: 'Failed to delete guest' }, { status: 500 })
  }
}

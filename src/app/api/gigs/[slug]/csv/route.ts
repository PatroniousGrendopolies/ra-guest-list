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

    // Generate CSV in Resident Advisor format
    // Columns: Name, Company, Email, Quantity, Type
    const headers = ['Name', 'Company', 'Email', 'Quantity', 'Type']
    const rows = gig.guests.map((guest) => [
      escapeCsvField(guest.name),
      '', // Company - always blank
      escapeCsvField(guest.email),
      guest.quantity.toString(),
      '', // Type - always blank
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    const filename = `guestlist-${gig.djName.replace(/\s+/g, '-').toLowerCase()}-${gig.date.toISOString().split('T')[0]}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error generating CSV:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSV' },
      { status: 500 }
    )
  }
}

function escapeCsvField(field: string): string {
  // If the field contains comma, quotes, or newlines, wrap in quotes and escape internal quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

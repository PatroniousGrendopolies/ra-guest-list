import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { getRelativeDayName } from '@/lib/utils'
import GigSignUpClient from './GigSignUpClient'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params
    const gig = await prisma.gig.findUnique({
      where: { slug },
      select: { djName: true, date: true, venueName: true }
    })

    if (!gig) {
      return { title: 'Guest List Not Found' }
    }

    const dayName = getRelativeDayName(new Date(gig.date))
    const needsThis = dayName !== 'tonight' && dayName !== 'tomorrow'
    // TODO: Replace hardcoded "Datcha" with gig.venueName when venue column is populated
    const venueText = ' at Datcha'
    const title = `Sign up to the list for ${gig.djName} ${needsThis ? `this ${dayName}` : dayName}${venueText}`
    const description = `Join the guest list for ${gig.djName}${gig.venueName ? ` at ${gig.venueName}` : ''}`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
      },
    }
  } catch {
    // If metadata fetch fails, return default - the page will still work
    return { title: 'Guest List Sign Up' }
  }
}

export default async function GigSignUpPage({ params }: PageProps) {
  const { slug } = await params
  return <GigSignUpClient slug={slug} />
}

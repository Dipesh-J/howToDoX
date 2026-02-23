import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json([])
  }

  try {
    const videos = await prisma.video.findMany({
      where: {
        title: {
          contains: query,
          mode: 'insensitive',
        },
        status: {
          in: ['COMPLETED', 'TRANSCRIBED'], // Only show processed videos
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: {
            // we don't have name and image URL directly in User table in minimal setup maybe? Let's check or mock.
            // but prisma user model has clerkId and maybe email.
            // Let's just fetch id for now if it doesn't have name.
            id: true,
            email: true,
          }
        },
        _count: {
          select: { frames: true, documents: true },
        },
      },
    })

    // Map output to include dummy name/image if not present in DB
    const results = videos.map(v => ({
      ...v,
      user: {
        name: v.user.email?.split('@')[0] || 'Anonymous',
        imageUrl: null
      }
    }))

    return NextResponse.json(results)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search videos' },
      { status: 500 }
    )
  }
}

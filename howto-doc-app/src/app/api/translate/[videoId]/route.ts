import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { userId } = await auth()
  const { videoId } = await params

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const video = await prisma.video.findUnique({
    where: { id: videoId },
  })

  if (!video || video.userId !== user.id) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  const body = await request.json()
  const { locale, content, title } = body

  try {
    const existingDoc = await prisma.document.findUnique({
      where: {
        videoId_locale: {
          videoId,
          locale,
        },
      },
    })

    if (existingDoc) {
      const updated = await prisma.document.update({
        where: { id: existingDoc.id },
        data: {
          content,
          title: title || video.title,
        },
      })
      return NextResponse.json(updated)
    }

    const doc = await prisma.document.create({
      data: {
        videoId,
        locale,
        content,
        title: title || video.title,
      },
    })

    const allDocs = await prisma.document.count({
      where: { videoId },
    })

    if (allDocs > 0) {
      await prisma.video.update({
        where: { id: videoId },
        data: { status: 'COMPLETED' },
      })
    }

    return NextResponse.json(doc)
  } catch (error) {
    console.error('Translation save error:', error)
    return NextResponse.json({ error: 'Failed to save translation' }, { status: 500 })
  }
}

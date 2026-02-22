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
    include: { frames: true },
  })

  if (!video || video.userId !== user.id) {
    return NextResponse.json({ error: 'Video not found' }, { status: 404 })
  }

  try {
    await prisma.video.update({
      where: { id: videoId },
      data: { status: 'TRANSCRIBED' },
    })

    await prisma.transcript.upsert({
      where: { videoId },
      create: {
        videoId,
        content: JSON.stringify(video.frames.map((f: { timestamp: number, imageUrl: string, aiSuggestion: string | null }) => ({
          id: f.id,
          timestamp: f.timestamp,
          aiSuggestion: f.aiSuggestion,
          userEdit: f.userEdit,
          stepNumber: f.stepNumber,
        }))),
        status: 'DRAFT',
      },
      update: {
        content: JSON.stringify(video.frames.map((f: { timestamp: number, imageUrl: string, aiSuggestion: string | null }) => ({
          id: f.id,
          timestamp: f.timestamp,
          aiSuggestion: f.aiSuggestion,
          userEdit: f.userEdit,
          stepNumber: f.stepNumber,
        }))),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analysis complete error:', error)
    return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 })
  }
}

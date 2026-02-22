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
  const { frameId, aiSuggestion, stepNumber } = body

  try {
    const frame = await prisma.frame.update({
      where: { id: frameId },
      data: {
        aiSuggestion,
        stepNumber,
      },
    })

    return NextResponse.json(frame)
  } catch (error) {
    console.error('Frame update error:', error)
    return NextResponse.json({ error: 'Failed to update frame' }, { status: 500 })
  }
}

export async function PATCH(
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
  const { frameId, userEdit } = body

  try {
    const frame = await prisma.frame.update({
      where: { id: frameId },
      data: {
        userEdit,
      },
    })

    return NextResponse.json(frame)
  } catch (error) {
    console.error('Frame update error:', error)
    return NextResponse.json({ error: 'Failed to update frame' }, { status: 500 })
  }
}

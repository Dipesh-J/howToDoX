import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { deleteVideo } from '@/lib/cloudinary'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { title } = await request.json()

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Invalid title' }, { status: 400 })
    }

    // Ensure the video belongs to the user
    const video = await prisma.video.findUnique({
      where: { id },
    })

    if (!video || video.userId !== user.id) {
      return NextResponse.json({ error: 'Video not found or unauthorized' }, { status: 404 })
    }

    const updatedVideo = await prisma.video.update({
      where: { id },
      data: { title },
    })

    return NextResponse.json(updatedVideo)
  } catch (error) {
    console.error('Failed to update video:', error)
    return NextResponse.json({ error: 'Failed to update video' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params

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
      where: { id },
    })

    if (!video || video.userId !== user.id) {
      return NextResponse.json({ error: 'Video not found or unauthorized' }, { status: 404 })
    }

    try {
      await deleteVideo(video.publicId)
    } catch (cloudinaryError) {
      console.error('Failed to delete from Cloudinary:', cloudinaryError)
    }

    await prisma.video.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete video:', error)
    return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { uploadVideo, extractFrames } from '@/lib/cloudinary'

export const maxDuration = 60 // Prevent 500 timeouts on Vercel

export async function GET() {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    return NextResponse.json([])
  }

  const videos = await prisma.video.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { frames: true, documents: true },
      },
    },
  })

  return NextResponse.json(videos)
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  // Auto-create user if they don't exist in DB (e.g. registered before DB connected)
  if (!user) {
    const clerkUser = await currentUser()
    if (!clerkUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    user = await prisma.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      }
    })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  try {
    const result = await uploadVideo(file) as any

    const video = await prisma.video.create({
      data: {
        title: file.name.replace(/\.[^/.]+$/, ''),
        cloudinaryId: result.asset_id,
        publicId: result.public_id,
        originalUrl: result.url,
        secureUrl: result.secure_url,
        duration: Math.round(result.duration || 0),
        status: 'UPLOADED',
        userId: user.id,
      },
    })

    const frames = await extractFrames(result.public_id, 10)
    
    await Promise.all(
      frames.map((frame) =>
        prisma.frame.create({
          data: {
            videoId: video.id,
            timestamp: frame.timestamp,
            imageUrl: frame.imageUrl,
          },
        })
      )
    )

    await prisma.video.update({
      where: { id: video.id },
      data: { status: 'PROCESSING' },
    })

    return NextResponse.json(video)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    )
  }
}

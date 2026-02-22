import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle, FileText } from 'lucide-react'
import { VideoEditor } from './video-editor'
import { InlineTitle } from './inline-title'

export default async function VideoEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId } = await auth()
  const { id } = await params

  if (!userId) {
    redirect('/sign-in')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  })

  if (!user) {
    redirect('/sign-in')
  }

  const video = await prisma.video.findUnique({
    where: { id },
    include: {
      frames: {
        orderBy: { timestamp: 'asc' },
      },
      transcript: true,
      documents: true,
    },
  })

  if (!video || video.userId !== user.id) {
    redirect('/dashboard')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 text-sm font-medium rounded-none border border-green-500 uppercase tracking-widest font-sans">
            <CheckCircle className="w-4 h-4" />
            Completed
          </span>
        )
      case 'TRANSCRIBED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-accent text-sm font-medium rounded-none border border-accent uppercase tracking-widest font-sans">
            <FileText className="w-4 h-4" />
            Transcribed
          </span>
        )
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent text-sm font-medium rounded-none border border-accent shadow-[2px_2px_0px_var(--accent)] uppercase tracking-widest font-sans">
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-500/10 text-zinc-400 text-sm font-medium rounded-none border border-zinc-500 uppercase tracking-widest font-sans">
            <Loader2 className="w-4 h-4" />
            Uploaded
          </span>
        )
    }
  }

  return (
    <div className="animate-slide-up max-w-5xl mx-auto">
      <div className="mb-8 pb-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-10 h-10 border border-border bg-[#050505] hover:bg-[#2F2F2F] hover:border-accent text-zinc-400 hover:text-white transition-all shadow-[4px_4px_0px_#2F2F2F] hover:shadow-[2px_2px_0px_#EBFF00] hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <InlineTitle initialTitle={video.title} videoId={video.id} />
            <p className="text-zinc-500 font-sans tracking-wide uppercase font-bold text-xs mt-1">ID: {video.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusBadge(video.status)}
        </div>
      </div>

      <div className="mt-8 border border-border bg-[#0A0A0A] p-6 shadow-[8px_8px_0px_#2F2F2F]">
        <VideoEditor video={video} />
      </div>
    </div>
  )
}

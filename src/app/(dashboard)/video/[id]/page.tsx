import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle, FileText, User, Clock } from 'lucide-react'
import { VideoEditor } from './video-editor'
import { InlineTitle } from './inline-title'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { PublicDocumentViewer } from './public-document-viewer'

export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { userId } = await auth()
  const { id } = await params

  const video = await prisma.video.findUnique({
    where: { id },
    include: {
      frames: {
        orderBy: { timestamp: 'asc' },
      },
      transcript: true,
      documents: true,
      user: true,
    },
  })

  if (!video) {
    return (
      <div className="text-center py-20">
        <h1 className="font-display text-2xl uppercase">Video not found</h1>
        <Link href="/dashboard" className="text-accent mt-4 inline-block">Back to dashboard</Link>
      </div>
    )
  }

  // Determine if the current user is the owner
  let isOwner = false
  if (userId) {
    const currentUser = await prisma.user.findUnique({ where: { clerkId: userId } })
    isOwner = currentUser?.id === video.userId
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

  // Build markdown for public view from frames
  const publicMarkdown = video.frames.length > 0
    ? `# How to ${video.title}\n\n## Overview\nThis guide will walk you through the steps shown in the tutorial video.\n\n## Steps\n\n${video.frames.map((frame, index) => {
      const description = frame.userEdit || frame.aiSuggestion || 'No description'
      const mins = Math.floor(frame.timestamp / 60)
      const secs = frame.timestamp % 60
      const ts = `${mins}:${secs.toString().padStart(2, '0')}`
      return `### Step ${frame.stepNumber || index + 1}: ${ts}\n\n![Frame at ${ts}](${frame.imageUrl})\n\n${description}\n`
    }).join('\n')
    }\n\n---\n*Generated with HowToDoX*`
    : ''

  // ─── PUBLIC (non-owner) VIEW ───────────────────────────────────────────────
  if (!isOwner) {
    return (
      <div className="animate-slide-up max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 pb-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/search"
              className="flex items-center justify-center w-10 h-10 border border-border bg-[#050505] hover:bg-[#2F2F2F] hover:border-accent text-zinc-400 hover:text-white transition-all shadow-[4px_4px_0px_#2F2F2F] hover:shadow-[2px_2px_0px_#EBFF00] hover:translate-x-[2px] hover:translate-y-[2px]"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-3xl font-display font-bold uppercase tracking-tight">
                <span className="text-accent opacity-80">How to do / </span>{video.title}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5 text-zinc-500 font-sans text-xs font-bold uppercase tracking-wider">
                  <User className="w-3 h-3" />
                  {video.user.name || 'Anonymous'}
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500 font-sans text-xs font-bold uppercase tracking-wider">
                  <Clock className="w-3 h-3" />
                  {new Date(video.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            </div>
          </div>
          {getStatusBadge(video.status)}
        </div>

        {/* Video Player */}
        <div className="bg-[#050505] border border-border overflow-hidden shadow-[8px_8px_0px_#2F2F2F] mb-8">
          <div className="aspect-video bg-black">
            <video
              src={video.secureUrl}
              className="w-full h-full"
              controls
            />
          </div>
        </div>

        {/* Document — read-only rendered */}
        {video.frames.length > 0 ? (
          <PublicDocumentViewer initialMarkdown={publicMarkdown} />
        ) : (
          <div className="border border-border bg-[#050505] p-12 text-center shadow-[8px_8px_0px_#2F2F2F]">
            <p className="text-zinc-500 font-sans text-sm uppercase tracking-wider font-bold">No guide generated yet.</p>
          </div>
        )}
      </div>
    )
  }

  // ─── OWNER VIEW ────────────────────────────────────────────────────────────
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

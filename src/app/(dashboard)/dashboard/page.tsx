'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { Video, Clock, CheckCircle, Loader2, FileText, Upload as UploadIcon, MoreVertical, Pencil, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface VideoItem {
  id: string
  title: string
  status: string
  duration: number
  createdAt: Date
  _count: { frames: number; documents: number }
}

export default function DashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<VideoItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
    }
  }, [isLoaded, isSignedIn, router])

  const fetchVideos = async () => {
    if (!user) return
    try {
      const res = await fetch('/api/videos')
      if (res.ok) {
        const data = await res.json()
        setVideos(data)
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) {
      fetchVideos()
    }
  }, [user?.id])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/videos/${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        setVideos((prev) => prev.filter((v) => v.id !== deleteTarget.id))
      }
    } catch (error) {
      console.error('Failed to delete video:', error)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 bg-[#050505] text-accent text-xs font-bold font-sans uppercase tracking-wider border border-accent">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        )
      case 'TRANSCRIBED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 bg-[#050505] text-zinc-300 text-xs font-bold font-sans uppercase tracking-wider border border-zinc-500">
            <FileText className="w-3 h-3" />
            Transcribed
          </span>
        )
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 bg-white text-black text-xs font-bold font-sans uppercase tracking-wider border border-white">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 bg-[#050505] text-zinc-400 text-xs font-bold font-sans uppercase tracking-wider border border-border">
            <Clock className="w-3 h-3" />
            Uploaded
          </span>
        )
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!user?.id) {
    return null
  }

  return (
    <div className="animate-slide-up">
      <div className="flex items-end justify-between mb-8 pb-4 border-b border-border">
        <div>
          <h1 className="text-4xl font-display font-bold mb-2 uppercase tracking-tight">My Videos</h1>
          <p className="text-zinc-400 font-sans">
            Your uploaded tutorial videos and generated guides.
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 bg-accent text-black px-5 py-2.5 font-sans font-bold uppercase tracking-wider hover:bg-white transition-all shadow-[4px_4px_0px_white] hover:shadow-[2px_2px_0px_white] hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          <UploadIcon className="w-4 h-4" />
          Upload New
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20 bg-background border border-border shadow-[8px_8px_0px_#2F2F2F]">
          <div className="w-20 h-20 mx-auto mb-6 bg-[#050505] border border-border flex items-center justify-center">
            <Video className="w-10 h-10 text-zinc-600" />
          </div>
          <h3 className="text-2xl font-display font-bold mb-3 uppercase tracking-wide">No videos yet</h3>
          <p className="text-zinc-500 font-sans max-w-sm mx-auto mb-8">
            Upload your first tutorial video to start generating guides.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-background border border-border text-foreground px-6 py-3 font-sans font-bold uppercase tracking-wider hover:border-accent transition-colors"
          >
            Go to Upload
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              onClick={() => router.push(`/video/${video.id}`)}
              className="group bg-background border border-border p-5 hover:border-accent transition-all shadow-[4px_4px_0px_#2F2F2F] hover:shadow-[4px_4px_0px_var(--accent)] hover:-translate-y-1 block relative cursor-pointer"
            >
              <div className="aspect-video bg-[#050505] border border-border mb-4 overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center group-hover:bg-accent/5 transition-colors">
                  <Video className="w-10 h-10 text-zinc-700 group-hover:text-accent transition-colors" />
                </div>
                <div className="absolute bottom-0 right-0 px-2 py-1 bg-black border-t border-l border-border text-xs font-sans font-bold uppercase tracking-widest text-white">
                  {formatDuration(video.duration)}
                </div>
                {/* Ellipsis Menu Button */}
                <div className="absolute top-2 right-2 z-10" ref={openMenuId === video.id ? menuRef : null}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenuId(openMenuId === video.id ? null : video.id)
                    }}
                    className="w-8 h-8 flex items-center justify-center bg-black/70 border border-border hover:border-accent text-zinc-400 hover:text-accent transition-all"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenuId === video.id && (
                    <div className="absolute top-full right-0 mt-1 w-40 bg-[#111111] border border-border shadow-[4px_4px_0px_#000] z-20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuId(null)
                          router.push(`/video/${video.id}`)
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-sans font-bold uppercase tracking-wider text-zinc-200 hover:bg-accent/10 hover:text-accent border-l-2 border-transparent hover:border-accent transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setOpenMenuId(null)
                          setDeleteTarget(video)
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-sans font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/10 hover:text-red-300 border-l-2 border-transparent hover:border-red-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <h3 className="font-sans font-bold text-lg mb-4 truncate uppercase tracking-tight group-hover:text-accent transition-colors">
                {video.title}
              </h3>
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                {getStatusBadge(video.status)}
                <span className="text-zinc-500 font-sans font-bold text-xs uppercase tracking-wider">
                  {formatDate(video.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => !deleting && setDeleteTarget(null)}>
          <div
            className="bg-[#111111] border border-border p-6 w-full max-w-sm shadow-[8px_8px_0px_#000] animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-display font-bold uppercase tracking-tight">Delete Video?</h3>
              <button
                onClick={() => !deleting && setDeleteTarget(null)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-zinc-400 font-sans text-sm mb-6">
              This will permanently delete <span className="text-white font-bold">&ldquo;{deleteTarget.title}&rdquo;</span> and all its generated guides. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 font-sans font-bold uppercase tracking-wider text-sm border border-border text-zinc-300 hover:border-zinc-500 hover:text-white transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={deleting}
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 font-sans font-bold uppercase tracking-wider text-sm bg-red-600 text-white hover:bg-red-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

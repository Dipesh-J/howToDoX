'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Video, Loader2, Sparkles } from 'lucide-react'

export default function UploadPage() {
    const router = useRouter()
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)

    const handleUpload = async (file: File) => {
        if (!file || !file.type.startsWith('video/')) {
            alert('Please upload a valid video file')
            return
        }

        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/videos', {
                method: 'POST',
                body: formData,
            })

            if (res.ok) {
                const video = await res.json()
                router.push(`/video/${video.id}`)
            } else {
                const error = await res.json()
                alert(error.message || 'Upload failed')
            }
        } catch (error) {
            console.error('Upload failed:', error)
            alert('Network error during upload')
        } finally {
            setUploading(false)
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0])
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0])
        }
    }

    return (
        <div className="animate-slide-up max-w-3xl mx-auto">
            <div className="mb-8 pb-4 border-b border-border">
                <h1 className="text-4xl font-display font-bold mb-2 uppercase tracking-tight">Upload Video</h1>
                <p className="text-zinc-400 font-sans">
                    Upload a tutorial video, and we'll generate a step-by-step guide.
                </p>
            </div>

            <div
                className={`relative border-2 border-dashed p-16 text-center transition-all shadow-[8px_8px_0px_#2F2F2F] ${dragActive
                    ? 'border-accent bg-accent/5'
                    : 'border-border bg-background hover:border-accent hover:bg-[#050505]'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                {uploading ? (
                    <div className="relative py-8">
                        <div className="w-20 h-20 mx-auto mb-6 bg-[#050505] border border-accent flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-accent/20 animate-pulse" />
                            <Loader2 className="w-8 h-8 animate-spin text-accent relative z-10" />
                        </div>
                        <h3 className="text-2xl font-display font-bold mb-2 uppercase tracking-wide text-foreground">Extracting Frames...</h3>
                        <p className="text-zinc-500 font-sans tracking-wide uppercase font-bold text-sm">Please do not close this window</p>
                    </div>
                ) : (
                    <div className="relative">
                        <div className="w-20 h-20 mx-auto mb-6 bg-[#050505] border border-border flex items-center justify-center transition-colors group-hover:border-accent">
                            <Upload className="w-8 h-8 text-zinc-500" />
                        </div>
                        <h3 className="text-2xl font-display font-bold mb-3 uppercase tracking-wide">
                            Drag & Drop Video
                        </h3>
                        <p className="text-zinc-500 font-sans tracking-wide uppercase font-bold text-sm mb-8">- OR -</p>
                        <label className="inline-flex items-center justify-center gap-3 bg-accent text-black px-8 py-4 font-sans font-bold text-lg uppercase tracking-wider cursor-pointer hover:bg-white transition-all shadow-[4px_4px_0px_white] hover:shadow-[2px_2px_0px_white] hover:translate-x-[2px] hover:translate-y-[2px]">
                            <Video className="w-5 h-5" />
                            Browse Files
                            <input
                                type="file"
                                accept="video/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </label>
                    </div>
                )}
            </div>

            {!uploading && (
                <div className="mt-8 bg-background border border-border p-6 flex gap-4 items-start shadow-[4px_4px_0px_#2F2F2F]">
                    <div className="w-10 h-10 bg-[#050505] border border-border flex shrink-0 items-center justify-center">
                        <Sparkles className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h4 className="font-display font-bold uppercase tracking-wide mb-1">Upload Guidelines</h4>
                        <p className="text-zinc-400 font-sans text-sm leading-relaxed">
                            For best results, upload videos under 5 minutes with clear visual steps and distinct pauses between actions. Max file size: 50MB.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

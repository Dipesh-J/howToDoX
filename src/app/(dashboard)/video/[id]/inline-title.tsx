'use client'

import { useState, useRef, useEffect } from 'react'
import { Edit2, Check, X, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function InlineTitle({ initialTitle, videoId }: { initialTitle: string, videoId: string }) {
    const [isEditing, setIsEditing] = useState(false)
    const [title, setTitle] = useState(initialTitle)
    const [isSaving, setIsSaving] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    const handleSave = async () => {
        if (title.trim() === initialTitle || title.trim() === '') {
            setTitle(initialTitle)
            setIsEditing(false)
            return
        }

        setIsSaving(true)
        try {
            const res = await fetch(`/api/videos/${videoId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: title.trim() }),
            })

            if (!res.ok) throw new Error('Failed to update title')
            setIsEditing(false)
            router.refresh()
        } catch (error) {
            console.error(error)
            alert('Failed to save title')
            setTitle(initialTitle)
        } finally {
            setIsSaving(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave()
        if (e.key === 'Escape') {
            setTitle(initialTitle)
            setIsEditing(false)
        }
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSaving}
                    className="text-3xl font-display font-bold md:min-w-[400px] uppercase tracking-tight bg-[#050505] border border-accent text-white px-3 py-1 outline-none shadow-[4px_4px_0px_#EBFF00]"
                />
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="p-3 border border-border bg-[#0A0A0A] hover:border-accent hover:text-accent transition-colors shadow-[4px_4px_0px_#2F2F2F] hover:shadow-[2px_2px_0px_#EBFF00] hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                </button>
                <button
                    onClick={() => {
                        setTitle(initialTitle)
                        setIsEditing(false)
                    }}
                    disabled={isSaving}
                    className="p-3 border border-border bg-[#0A0A0A] hover:border-red-500 hover:text-red-500 transition-colors shadow-[4px_4px_0px_#2F2F2F] hover:shadow-[2px_2px_0px_#ef4444] hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        )
    }

    return (
        <div className="group flex items-center gap-3 cursor-pointer" onClick={() => setIsEditing(true)}>
            <h1 className="text-3xl font-display font-bold uppercase tracking-tight truncate max-w-[70vw] lg:max-w-4xl" title={title}>
                <span className="text-accent opacity-80">How to do / </span>{title}
            </h1>
            <Edit2 className="w-5 h-5 text-zinc-600 group-hover:text-accent transition-colors opacity-0 group-hover:opacity-100" />
        </div>
    )
}

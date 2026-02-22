'use client'

import { useState, useEffect } from 'react'
import { Search as SearchIcon, Video, Clock, Loader2, Sparkles, User } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'

interface SearchResult {
    id: string
    title: string
    duration: number
    createdAt: Date
    user: {
        name: string | null
        imageUrl: string | null
    }
}

export default function SearchPage() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query.trim()) return

        setLoading(true)
        setHasSearched(true)
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
            if (res.ok) {
                const data = await res.json()
                setResults(data)
            }
        } catch (error) {
            console.error('Search failed:', error)
        } finally {
            setLoading(false)
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

    return (
        <div className="animate-slide-up">
            <div className="mb-8 pb-4 border-b border-border">
                <h1 className="text-4xl font-display font-bold mb-2 uppercase tracking-tight">Search Guides</h1>
                <p className="text-zinc-400 font-sans">
                    Find "how to do X" guides created by the community.
                </p>
            </div>

            <form onSubmit={handleSearch} className="mb-12 relative flex max-w-3xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <SearchIcon className="h-6 w-6 text-zinc-500" />
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="HOW TO DO..."
                    className="w-full pl-14 pr-4 py-5 bg-[#050505] border-2 border-border text-foreground font-display text-xl uppercase tracking-wide placeholder:text-zinc-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent shadow-[8px_8px_0px_#2F2F2F] transition-all"
                />
                <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="absolute right-2 top-2 bottom-2 bg-accent text-black px-8 font-sans font-bold uppercase tracking-wider hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
                </button>
            </form>

            {loading ? (
                <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-8 h-8 animate-spin text-accent" />
                </div>
            ) : hasSearched && results.length === 0 ? (
                <div className="text-center py-20 bg-background border border-border shadow-[8px_8px_0px_#2F2F2F] max-w-3xl">
                    <div className="w-20 h-20 mx-auto mb-6 bg-[#050505] border border-border flex items-center justify-center">
                        <SearchIcon className="w-10 h-10 text-zinc-600" />
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-3 uppercase tracking-wide">No Results Found</h3>
                    <p className="text-zinc-500 font-sans max-w-sm mx-auto">
                        We couldn't find any guides matching "{query}". Try a different search term.
                    </p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((video) => (
                        <Link
                            key={video.id}
                            href={`/video/${video.id}/edit`}
                            className="group bg-background border border-border p-5 hover:border-accent transition-all shadow-[4px_4px_0px_#2F2F2F] hover:shadow-[4px_4px_0px_var(--accent)] hover:-translate-y-1 block relative"
                        >
                            <div className="aspect-video bg-[#050505] border border-border mb-4 overflow-hidden relative">
                                <div className="absolute inset-0 flex items-center justify-center group-hover:bg-accent/5 transition-colors">
                                    <Video className="w-10 h-10 text-zinc-700 group-hover:text-accent transition-colors" />
                                </div>
                                <div className="absolute bottom-0 right-0 px-2 py-1 bg-black border-t border-l border-border text-xs font-sans font-bold uppercase tracking-widest text-white">
                                    {formatDuration(video.duration)}
                                </div>
                            </div>
                            <h3 className="font-sans font-bold text-lg mb-4 truncate uppercase tracking-tight group-hover:text-accent transition-colors">
                                {video.title}
                            </h3>
                            <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-none bg-[#050505] border border-border flex items-center justify-center overflow-hidden">
                                        {video.user.imageUrl ? (
                                            <img src={video.user.imageUrl} alt="User" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-3 h-3 text-zinc-500" />
                                        )}
                                    </div>
                                    <span className="text-zinc-400 font-sans text-xs font-bold uppercase tracking-wider truncate max-w-[100px]">
                                        {video.user.name || 'User'}
                                    </span>
                                </div>
                                <span className="text-zinc-500 font-sans font-bold text-xs uppercase tracking-wider">
                                    {formatDate(video.createdAt)}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {!hasSearched && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mt-12">
                    {['How to tie a tie', 'How to code in React', 'How to fold a shirt', 'How to cook pasta'].map((suggestion) => (
                        <button
                            key={suggestion}
                            onClick={() => {
                                setQuery(suggestion)
                                // handleSearch is normally calling API, we could trigger it directly but setting query is fine for user to click Search
                            }}
                            className="bg-background border border-border p-4 text-left hover:border-accent transition-colors group cursor-pointer"
                        >
                            <Sparkles className="w-4 h-4 text-zinc-600 group-hover:text-accent mb-2 transition-colors" />
                            <div className="text-sm font-sans font-bold text-zinc-400 group-hover:text-foreground uppercase tracking-wide">
                                {suggestion}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

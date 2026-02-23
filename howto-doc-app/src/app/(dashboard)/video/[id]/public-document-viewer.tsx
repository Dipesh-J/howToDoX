'use client'

import { useState } from 'react'
import { FileText, Globe, Loader2, Check } from 'lucide-react'
import { MarkdownRenderer } from '@/components/markdown-renderer'

const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
]

export function PublicDocumentViewer({ initialMarkdown }: { initialMarkdown: string }) {
    const [isTranslating, setIsTranslating] = useState(false)
    const [selectedLanguage, setSelectedLanguage] = useState('en')
    const [translatedDoc, setTranslatedDoc] = useState('')

    const handleTranslate = async () => {
        if (!initialMarkdown) return

        setIsTranslating(true)
        try {
            const res = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: initialMarkdown,
                    sourceLocale: 'en',
                    targetLocale: selectedLanguage,
                }),
            })

            if (!res.ok) {
                throw new Error('Translation failed')
            }

            const { translated } = await res.json()
            setTranslatedDoc(translated)
        } catch (error) {
            console.error('Translation failed:', error)
            alert('Failed to translate document')
        } finally {
            setIsTranslating(false)
        }
    }

    const displayDoc = translatedDoc || initialMarkdown

    return (
        <div className="border border-border bg-[#050505] shadow-[8px_8px_0px_#2F2F2F]">
            <div className="border-b border-border flex flex-col md:flex-row md:items-center justify-between">
                <div className="px-6 py-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-accent" />
                    <span className="font-sans font-bold text-xs uppercase tracking-wider text-zinc-400">Guide Document</span>
                </div>

                {/* Translate row */}
                <div className="flex flex-wrap items-center gap-3 px-6 py-3 bg-[#0A0A0A] border-t md:border-t-0 md:border-l border-border">
                    <label className="font-sans font-bold text-xs uppercase tracking-wider text-zinc-500 whitespace-nowrap">Translate to</label>
                    <div className="flex gap-2">
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="w-36 bg-[#050505] border border-border rounded-none px-3 py-1.5 font-sans text-sm text-white focus:outline-none focus:border-accent"
                        >
                            {languages.map((lang) => (
                                <option key={lang.code} value={lang.code} className="bg-zinc-900">
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleTranslate}
                            disabled={isTranslating}
                            className="flex items-center justify-center gap-2 px-4 py-1.5 border border-border bg-[#050505] hover:border-accent hover:text-accent transition-colors font-sans text-xs uppercase font-bold tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isTranslating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                            {isTranslating ? 'Translating...' : 'Translate'}
                        </button>
                        {translatedDoc && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/20 text-accent font-sans text-xs uppercase font-bold tracking-wider">
                                <Check className="w-3.5 h-3.5" />
                                {languages.find(l => l.code === selectedLanguage)?.name}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-8 max-w-3xl border-t border-border mt-[-1px]">
                <MarkdownRenderer content={displayDoc} />
            </div>
        </div>
    )
}

'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Sparkles, Loader2, Check, Globe, Download, Edit3, Zap, FileText, Eye, Code2 } from 'lucide-react'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { analyzeVideoMultimodal, generateDocumentTitle } from '@/lib/gemini'
import { useRouter } from 'next/navigation'

interface Frame {
  id: string
  timestamp: number
  imageUrl: string
  aiSuggestion: string | null
  userEdit: string | null
  stepNumber: number | null
}

const formatTimestamp = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const generateMarkdown = (framesList: Frame[], titleText: string) => {
  const steps = framesList
    .map((frame, index) => {
      const description = frame.userEdit || frame.aiSuggestion || 'No description'
      return `### Step ${frame.stepNumber || index + 1}: ${formatTimestamp(frame.timestamp)}

![Frame at ${formatTimestamp(frame.timestamp)}](${frame.imageUrl})

${description}
`
    })
    .join('\n')

  return `# How to ${titleText}

## Overview
This guide will walk you through the steps shown in the tutorial video.

## Steps

${steps}

---
*Generated with HowToDoX*
`
}

interface Video {
  id: string
  title: string
  secureUrl: string
  duration: number
  status: string
  frames: Frame[]
}

interface VideoEditorProps {
  video: Video
}

export function VideoEditor({ video }: VideoEditorProps) {
  const router = useRouter()
  const [frames, setFrames] = useState<Frame[]>(video.frames)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [generatedTitle, setGeneratedTitle] = useState(video.title)
  const [translatedDoc, setTranslatedDoc] = useState('')
  const [markdownMode, setMarkdownMode] = useState<'edit' | 'preview'>('preview')
  const [customMarkdown, setCustomMarkdown] = useState<string | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const currentFrame = frames[currentFrameIndex]
  const hasAnalyzed = frames.length > 0

  const generatedDoc = useMemo(() => {
    if (!hasAnalyzed) return ''
    return generateMarkdown(frames, generatedTitle)
  }, [frames, hasAnalyzed, generatedTitle])

  // The markdown the owner sees/edits: custom overrides generated
  const activeMarkdown = customMarkdown ?? generatedDoc
  const displayDoc = translatedDoc || activeMarkdown

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    // Clear any stale overrides so the fresh generated doc shows through
    setCustomMarkdown(null)
    setTranslatedDoc('')
    setSelectedLanguage('en')
    try {
      // 1. Send the entire video to Gemini natively!
      const newFramesData = await analyzeVideoMultimodal(video.id)

      // 2. Temporarily hydrate local state for instant UI update
      const updatedFrames = newFramesData.map((frame, index) => ({
        id: Math.random().toString(), // temporary until router.refresh maps DB ids
        timestamp: frame.timestamp,
        imageUrl: frame.imageUrl,
        aiSuggestion: frame.aiSuggestion,
        userEdit: null,
        stepNumber: index + 1,
      })) as Frame[]

      setFrames(updatedFrames)

      // 3. Generate summary title based on returned native steps
      const descriptions = updatedFrames.map(f => f.aiSuggestion || '')
      const title = await generateDocumentTitle(descriptions)

      setGeneratedTitle(title)

      // 4. Sync Server Components with the DB
      router.refresh()
    } catch (error) {
      console.error('Analysis failed:', error)
      alert('Native Gemini processing failed. Check the console.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFrameEdit = (frameId: string, value: string) => {
    const updatedFrames = frames.map((frame) =>
      frame.id === frameId ? { ...frame, userEdit: value } : frame
    )
    setFrames(updatedFrames) // Updates local UI and Document Preview dynamically

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(async () => {
      await fetch(`/api/frames/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameId,
          userEdit: value,
        }),
      })
    }, 600) // 600ms debounce
  }

  const handleTranslate = async () => {
    if (!generatedDoc) {
      alert('Please generate the document first')
      return
    }

    setIsTranslating(true)
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: generatedDoc,
          sourceLocale: 'en',
          targetLocale: selectedLanguage,
        }),
      })

      if (!res.ok) {
        throw new Error('Translation failed')
      }

      const { translated } = await res.json()
      setTranslatedDoc(translated)

      await fetch(`/api/translate/${video.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locale: selectedLanguage,
          content: translated,
        }),
      })
    } catch (error) {
      console.error('Translation failed:', error)
      alert('Failed to translate document')
    } finally {
      setIsTranslating(false)
    }
  }

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
  const [activeTab, setActiveTab] = useState<'editor' | 'document'>('editor')

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Video Player (Always Visible) */}
      <div className="bg-[#050505] border border-border rounded-none overflow-hidden shadow-[4px_4px_0px_#2F2F2F]">
        <div className="aspect-video bg-black relative border-b border-border">
          <video
            src={video.secureUrl}
            className="w-full h-full"
            controls
          />
        </div>

        {frames.length === 0 ? (
          <div className="p-12 text-center border-t border-border bg-[#0A0A0A]">
            <div className="w-16 h-16 mx-auto mb-6 border border-border bg-[#050505] shadow-[6px_6px_0px_#2F2F2F] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-accent" />
            </div>
            <h3 className="font-display font-bold uppercase tracking-wide text-2xl mb-4 text-white">Extract Steps Automatically</h3>
            <p className="text-zinc-400 font-sans text-sm mb-10 max-w-lg mx-auto leading-relaxed">
              Let AI watch your video file and natively understand the audio and visual actions. We will automatically generate a step-by-step tutorial with precise timestamps and instructions.
            </p>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="inline-flex items-center justify-center gap-3 bg-accent text-black px-10 py-5 font-sans font-bold uppercase tracking-wider hover:bg-white transition-all shadow-[8px_8px_0px_white] hover:shadow-[2px_2px_0px_white] hover:translate-x-[6px] hover:translate-y-[6px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <Loader2 className="w-6 h-6 animate-spin text-black" />
              ) : (
                <Zap className="w-6 h-6 text-black" />
              )}
              {isAnalyzing ? 'Analyzing Entire Video...' : 'Analyze Video with AI'}
            </button>
          </div>
        ) : null}
      </div>

      {frames.length > 0 && (
        <div className="space-y-6">
          {/* Tabs Row */}
          <div className="flex bg-[#050505] border border-border p-2 shadow-[4px_4px_0px_#2F2F2F] gap-2">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex-1 py-3 font-sans font-bold uppercase tracking-wider text-sm transition-all ${activeTab === 'editor'
                ? 'bg-accent text-black shadow-[2px_2px_0px_white] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-[#0A0A0A] text-zinc-400 border border-transparent hover:border-border hover:text-white'
                }`}
            >
              Step Editor
            </button>
            <button
              onClick={() => setActiveTab('document')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 font-sans font-bold uppercase tracking-wider text-sm transition-all ${activeTab === 'document'
                ? 'bg-accent text-black shadow-[2px_2px_0px_white] translate-x-[-1px] translate-y-[-1px]'
                : 'bg-[#0A0A0A] text-zinc-400 border border-transparent hover:border-border hover:text-white'
                }`}
            >
              <Download className="w-4 h-4" />
              Full Document
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'editor' ? (
            <div className="space-y-6">
              {/* Timeline Reel */}
              <div className="bg-[#050505] border border-border rounded-none p-5 shadow-[4px_4px_0px_#2F2F2F]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display font-bold uppercase tracking-tight text-xl">Timeline</h2>
                    <span className="font-sans font-bold text-xs uppercase tracking-wider text-zinc-500">{frames.length} frames</span>
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="group flex items-center justify-center gap-2 bg-[#0A0A0A] border border-border text-white px-5 py-2.5 font-sans font-bold uppercase tracking-wider hover:bg-accent hover:text-black transition-all shadow-[4px_4px_0px_#2F2F2F] hover:shadow-[2px_2px_0px_var(--accent)] hover:translate-x-[2px] hover:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {isAnalyzing ? 'Re-Analyzing...' : 'Re-Analyze'}
                  </button>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                  {frames.map((frame, index) => (
                    <button
                      key={frame.id}
                      onClick={() => setCurrentFrameIndex(index)}
                      className={`group flex-shrink-0 w-32 rounded-none overflow-hidden border transition-all ${index === currentFrameIndex
                        ? 'border-accent shadow-[4px_4px_0px_var(--accent)] translate-x-[-2px] translate-y-[-2px]'
                        : 'border-border hover:border-zinc-400 opacity-70 hover:opacity-100'
                        }`}
                    >
                      <img
                        src={frame.imageUrl}
                        alt={`Frame at ${formatTimestamp(frame.timestamp)}`}
                        className="w-full h-20 object-cover border-b border-border"
                      />
                      <div className={`text-xs px-2 py-1.5 font-sans font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1 ${index === currentFrameIndex
                        ? 'bg-[#0A0A0A] text-accent'
                        : 'bg-[#050505] text-zinc-500'
                        }`}>
                        {frame.stepNumber !== null && (
                          <span className="w-4 h-4 rounded-none border border-current opacity-80 text-[10px] flex items-center justify-center">{frame.stepNumber}</span>
                        )}
                        {formatTimestamp(frame.timestamp)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimal Description Editor */}
              {currentFrame && (
                <div className="bg-[#050505] border border-border rounded-none p-6 shadow-[4px_4px_0px_#2F2F2F]">
                  <label className="flex items-center justify-between font-sans font-bold text-xs uppercase tracking-wider text-zinc-400 mb-3">
                    <div className="flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-accent" />
                      Step {currentFrame.stepNumber || currentFrameIndex + 1} Description
                    </div>
                    <span>{formatTimestamp(currentFrame.timestamp)}</span>
                  </label>
                  <textarea
                    value={currentFrame.userEdit ?? currentFrame.aiSuggestion ?? ''}
                    onChange={(e) => handleFrameEdit(currentFrame.id, e.target.value)}
                    placeholder="Describe what's happening in this step..."
                    className="w-full h-32 p-4 bg-[#0A0A0A] border border-border rounded-none resize-none focus:ring-0 focus:outline-none focus:border-accent text-white placeholder-zinc-600 font-sans shadow-[4px_4px_0px_#2F2F2F] transition-colors text-lg leading-relaxed"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#050505] border border-border rounded-none shadow-[4px_4px_0px_#2F2F2F] min-h-[500px] overflow-hidden">
              {/* Document header */}
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="font-display font-bold uppercase tracking-tight text-xl flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent" />
                  How to {generatedTitle}
                </h2>
                <div className="flex items-center gap-2">
                  {/* Edit / Preview Toggle */}
                  <div className="flex border border-border bg-[#0A0A0A]">
                    <button
                      onClick={() => setMarkdownMode('preview')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 font-sans text-xs uppercase font-bold tracking-wider transition-all ${markdownMode === 'preview'
                        ? 'bg-accent text-black'
                        : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>
                    <button
                      onClick={() => {
                        if (markdownMode === 'preview') {
                          // First time switching to edit: populate with current generated content
                          if (customMarkdown === null) setCustomMarkdown(activeMarkdown)
                          setMarkdownMode('edit')
                        } else {
                          setMarkdownMode('preview')
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 font-sans text-xs uppercase font-bold tracking-wider transition-all ${markdownMode === 'edit'
                        ? 'bg-accent text-black'
                        : 'text-zinc-400 hover:text-white'
                        }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      const blob = new Blob([displayDoc], { type: 'text/markdown' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${generatedTitle || 'document'}.md`
                      a.click()
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-zinc-400 hover:border-accent hover:text-accent transition-colors font-sans text-xs uppercase font-bold tracking-wider"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export
                  </button>
                </div>
              </div>

              {/* Translate row */}
              <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-[#0A0A0A]">
                <label className="font-sans font-bold text-xs uppercase tracking-wider text-zinc-500 whitespace-nowrap">Translate to</label>
                <div className="flex gap-2">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="bg-[#050505] border border-border rounded-none px-3 py-1.5 font-sans text-sm text-white focus:outline-none focus:border-accent"
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

              {/* Main content area */}
              {markdownMode === 'edit' ? (
                <textarea
                  value={customMarkdown ?? activeMarkdown}
                  onChange={(e) => setCustomMarkdown(e.target.value)}
                  className="w-full min-h-[600px] p-6 bg-[#050505] focus:outline-none text-zinc-200 font-mono text-sm leading-relaxed resize-none border-none"
                  placeholder="Your markdown document..."
                  spellCheck={false}
                />
              ) : (
                <div className="p-8 max-w-3xl">
                  <MarkdownRenderer content={displayDoc} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

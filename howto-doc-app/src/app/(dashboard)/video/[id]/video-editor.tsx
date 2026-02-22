'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Check, Globe, Download, Edit3, Zap } from 'lucide-react'
import { analyzeFrame, generateDocumentTitle } from '@/lib/gemini'

interface Frame {
  id: string
  timestamp: number
  imageUrl: string
  aiSuggestion: string | null
  userEdit: string | null
  stepNumber: number | null
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
  const [frames, setFrames] = useState<Frame[]>(video.frames)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [generatedDoc, setGeneratedDoc] = useState('')
  const [translatedDoc, setTranslatedDoc] = useState('')

  const currentFrame = frames[currentFrameIndex]

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const frameDescriptions = await Promise.all(
        frames.map(async (frame) => {
          const description = await analyzeFrame(frame.imageUrl)
          return description
        })
      )

      const updatedFrames = frames.map((frame, index) => ({
        ...frame,
        aiSuggestion: frameDescriptions[index],
        stepNumber: index + 1,
      }))

      setFrames(updatedFrames)

      await Promise.all(
        updatedFrames.map((frame) =>
          fetch(`/api/frames/${video.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              frameId: frame.id,
              aiSuggestion: frame.aiSuggestion,
              stepNumber: frame.stepNumber,
            }),
          })
        )
      )

      const title = await generateDocumentTitle(frameDescriptions)
      
      const docContent = generateMarkdown(updatedFrames, title)
      setGeneratedDoc(docContent)

      await fetch(`/api/analyze/${video.id}`, {
        method: 'POST',
      })
    } catch (error) {
      console.error('Analysis failed:', error)
      alert('Failed to analyze frames')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFrameEdit = async (frameId: string, value: string) => {
    const updatedFrames = frames.map((frame) =>
      frame.id === frameId ? { ...frame, userEdit: value } : frame
    )
    setFrames(updatedFrames)

    await fetch(`/api/frames/${video.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frameId,
        userEdit: value,
      }),
    })
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

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const generateMarkdown = (frames: Frame[], title: string) => {
    const steps = frames
      .filter((f) => f.stepNumber)
      .map((frame) => {
        const description = frame.userEdit || frame.aiSuggestion || 'No description'
        return `### Step ${frame.stepNumber}: ${formatTimestamp(frame.timestamp)}

![Frame at ${formatTimestamp(frame.timestamp)}](${frame.imageUrl})

${description}
`
      })
      .join('\n')

    return `# How to ${title}

## Overview
This guide will walk you through the steps shown in the tutorial video.

## Steps

${steps}

---
*Generated with HowToDoX*
`
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
  const displayDoc = translatedDoc || generatedDoc

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Video Player */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="aspect-video bg-black relative">
            <video
              src={video.secureUrl}
              className="w-full h-full"
              controls
            />
          </div>

          <div className="p-5 border-t border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-semibold">Timeline</h2>
                <span className="text-xs text-zinc-500">{frames.length} frames</span>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="group flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white px-5 py-2.5 rounded-xl font-medium hover:from-orange-400 hover:to-amber-500 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {isAnalyzing ? 'Analyzing...' : 'AI Analyze'}
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2">
              {frames.map((frame, index) => (
                <button
                  key={frame.id}
                  onClick={() => setCurrentFrameIndex(index)}
                  className={`group flex-shrink-0 w-28 rounded-xl overflow-hidden border-2 transition-all ${
                    index === currentFrameIndex
                      ? 'border-orange-500 shadow-lg shadow-orange-500/20'
                      : 'border-transparent hover:border-white/20'
                  }`}
                >
                  <img
                    src={frame.imageUrl}
                    alt={`Frame at ${formatTimestamp(frame.timestamp)}`}
                    className="w-full h-16 object-cover"
                  />
                  <div className={`text-xs px-2 py-1.5 text-center flex items-center justify-center gap-1 ${
                    index === currentFrameIndex
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'bg-zinc-900 text-zinc-400'
                  }`}>
                    {frame.stepNumber && (
                      <span className="w-4 h-4 rounded-full bg-orange-500/30 text-[10px] flex items-center justify-center">{frame.stepNumber}</span>
                    )}
                    {formatTimestamp(frame.timestamp)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Frame Editor */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold">
                  Step {currentFrame?.stepNumber || currentFrameIndex + 1}
                </h2>
                <span className="text-sm text-zinc-500">
                  {currentFrame && formatTimestamp(currentFrame.timestamp)}
                </span>
              </div>
            </div>
          </div>

          {currentFrame && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <img
                  src={currentFrame.imageUrl}
                  alt={`Frame at ${formatTimestamp(currentFrame.timestamp)}`}
                  className="w-full rounded-xl border border-white/10"
                />
              </div>
              <div className="space-y-4">
                {currentFrame.aiSuggestion && (
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-zinc-400 mb-2">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      AI Suggestion
                    </label>
                    <div className="p-4 bg-orange-500/10 rounded-xl text-sm text-zinc-300 border border-orange-500/20">
                      {currentFrame.aiSuggestion}
                    </div>
                  </div>
                )}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-400 mb-2">
                    <Edit3 className="w-4 h-4" />
                    Your Description
                  </label>
                  <textarea
                    value={currentFrame.userEdit || ''}
                    onChange={(e) => handleFrameEdit(currentFrame.id, e.target.value)}
                    placeholder="Describe what's happening in this step..."
                    className="w-full h-40 p-4 bg-white/5 border border-white/10 rounded-xl resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-zinc-600"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Document Preview */}
      <div className="space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 sticky top-24">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-orange-500" />
            Document Preview
          </h2>
          
          {!generatedDoc ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-zinc-600" />
              </div>
              <p className="text-zinc-500 text-sm">
                Click "AI Analyze" to generate your how-to document
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-400">Document Generated</span>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-400">Translate to</label>
                <div className="flex gap-2">
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white"
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
                    className="flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
                  >
                    {isTranslating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {translatedDoc && (
                <div className="flex items-center gap-2 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                  <Check className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-400">
                    Translated to {languages.find(l => l.code === selectedLanguage)?.name}
                  </span>
                </div>
              )}

              <div className="border-t border-white/10 pt-4">
                <pre className="text-sm whitespace-pre-wrap text-zinc-400 max-h-80 overflow-y-auto font-mono">
                  {displayDoc}
                </pre>
              </div>

              <button
                onClick={() => {
                  const blob = new Blob([displayDoc], { type: 'text/markdown' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${video.title}.md`
                  a.click()
                }}
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-3 rounded-xl font-medium hover:from-orange-400 hover:to-amber-500 transition-all shadow-lg shadow-orange-500/20"
              >
                <Download className="w-4 h-4" />
                Download Markdown
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

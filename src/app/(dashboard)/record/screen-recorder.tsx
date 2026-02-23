'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
    Circle, Square, Upload, RotateCcw, Loader2,
    Monitor, Camera, CameraOff, Sparkles, Mic, MicOff,
    GripHorizontal, Info,
} from 'lucide-react'

type Phase = 'idle' | 'recording' | 'preview' | 'uploading'

function formatDuration(s: number) {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

// ─── Draggable Webcam PiP ──────────────────────────────────────────────────────
function DraggableWebcamPip({ streamRef }: { streamRef: React.RefObject<MediaStream | null> }) {
    const pipRef = useRef<HTMLDivElement>(null)
    const drag = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 })
    const [pos, setPos] = useState(() => {
        if (typeof window === 'undefined') {
            return { x: 20, y: 20 }
        }
        return { x: window.innerWidth - 220, y: window.innerHeight - 200 }
    })

    // Callback ref — fires the INSTANT the <video> element is inserted into the DOM.
    // This avoids the bug where useRef+useEffect can't find the element because the
    // component returned null during its very first render.
    const videoCallbackRef = useCallback((video: HTMLVideoElement | null) => {
        if (!video || !streamRef.current) return
        video.srcObject = streamRef.current
        video.play().catch(() => { /* autoplay policy — browser will let user resume */ })
    }, [streamRef])

    // Drag logic
    const onMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        drag.current = { active: true, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y }

        const onMove = (ev: MouseEvent) => {
            if (!drag.current.active) return
            setPos({
                x: Math.max(0, Math.min(window.innerWidth - 192, drag.current.origX + ev.clientX - drag.current.startX)),
                y: Math.max(0, Math.min(window.innerHeight - 140, drag.current.origY + ev.clientY - drag.current.startY)),
            })
        }
        const onUp = () => {
            drag.current.active = false
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('mouseup', onUp)
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
    }, [pos])

    return createPortal(
        <div
            ref={pipRef}
            style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999, userSelect: 'none' }}
            className="w-48 border-2 border-red-500 shadow-[4px_4px_0px_#7f1d1d] overflow-hidden"
        >
            {/* Drag handle */}
            <div
                onMouseDown={onMouseDown}
                className="bg-[#0A0A0A] border-b border-red-500/60 px-3 py-1 flex items-center gap-1.5 cursor-grab active:cursor-grabbing"
            >
                <GripHorizontal className="w-3 h-3 text-red-400" />
                <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-red-400">Drag to move</span>
            </div>

            <video
                ref={videoCallbackRef}
                muted
                playsInline
                className="w-full aspect-video object-cover bg-black"
            />

            <div className="bg-[#050505] px-3 py-1 text-xs font-sans font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                Camera Live
            </div>
        </div>,
        document.body
    )
}



// ─── Main Component ────────────────────────────────────────────────────────────
export function ScreenRecorder() {
    const router = useRouter()

    const [phase, setPhase] = useState<Phase>('idle')
    const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
    const [elapsed, setElapsed] = useState(0)
    const [useWebcam, setUseWebcam] = useState(false)
    const [useMic, setUseMic] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const screenStreamRef = useRef<MediaStream | null>(null)
    const webcamStreamRef = useRef<MediaStream | null>(null)
    const micStreamRef = useRef<MediaStream | null>(null)
    const previewRef = useRef<HTMLVideoElement>(null)

    // Canvas compositing refs (used when webcam is ON)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const hiddenScreenVidRef = useRef<HTMLVideoElement | null>(null)
    const hiddenCamVidRef = useRef<HTMLVideoElement | null>(null)
    const animFrameRef = useRef<number | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopAllStreams()
            if (recordedUrl) URL.revokeObjectURL(recordedUrl)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const stopAllStreams = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
        if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null }

        screenStreamRef.current?.getTracks().forEach(t => t.stop())
        screenStreamRef.current = null
        webcamStreamRef.current?.getTracks().forEach(t => t.stop())
        webcamStreamRef.current = null
        micStreamRef.current?.getTracks().forEach(t => t.stop())
        micStreamRef.current = null
        audioDestinationRef.current = null
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => { /* no-op */ })
            audioContextRef.current = null
        }

        // Release hidden video elements
        if (hiddenScreenVidRef.current) { hiddenScreenVidRef.current.srcObject = null }
        if (hiddenCamVidRef.current) { hiddenCamVidRef.current.srcObject = null }
    }, [])

    /**
     * Canvas compositing: merges screen stream + webcam stream into one canvas stream.
     * This avoids the MediaRecorder multi-track problem (only 1 video track per recorder).
     */
    const buildCompositeStream = useCallback((
        screenStream: MediaStream,
        camStream: MediaStream | null,
    ): MediaStream => {
        const screenTrack = screenStream.getVideoTracks()[0]
        const settings = screenTrack.getSettings()
        const W = settings.width || 1920
        const H = settings.height || 1080

        const canvas = document.createElement('canvas')
        canvas.width = W
        canvas.height = H
        canvasRef.current = canvas
        const ctx = canvas.getContext('2d')!

        // Hidden video sources
        const screenVid = document.createElement('video')
        screenVid.srcObject = screenStream
        screenVid.muted = true
        screenVid.play()
        hiddenScreenVidRef.current = screenVid

        let camVid: HTMLVideoElement | null = null
        if (camStream) {
            camVid = document.createElement('video')
            camVid.srcObject = camStream
            camVid.muted = true
            camVid.play()
            hiddenCamVidRef.current = camVid
        }

        const draw = () => {
            // Draw full screen frame
            if (screenVid.readyState >= 2) {
                ctx.drawImage(screenVid, 0, 0, W, H)
            }
            // Overlay webcam at bottom-right (20% width)
            if (camVid && camVid.readyState >= 2) {
                const camW = Math.round(W * 0.22)
                const camH = Math.round(camW * (9 / 16))
                const margin = 24
                // Rounded rect clip
                ctx.save()
                ctx.beginPath()
                ctx.roundRect(W - camW - margin, H - camH - margin, camW, camH, 12)
                ctx.clip()
                ctx.drawImage(camVid, W - camW - margin, H - camH - margin, camW, camH)
                ctx.restore()
                // Border
                ctx.strokeStyle = '#ef4444'
                ctx.lineWidth = 3
                ctx.beginPath()
                ctx.roundRect(W - camW - margin, H - camH - margin, camW, camH, 12)
                ctx.stroke()
            }
            animFrameRef.current = requestAnimationFrame(draw)
        }
        draw()

        return canvas.captureStream(30)
    }, [])

    const buildMixedAudioTrack = useCallback((
        screenStream: MediaStream,
        micStream: MediaStream | null,
    ): MediaStreamTrack | null => {
        const screenAudioTracks = screenStream.getAudioTracks()
        const micAudioTracks = micStream?.getAudioTracks() ?? []

        if (screenAudioTracks.length === 0 && micAudioTracks.length === 0) {
            return null
        }

        const audioContext = new AudioContext()
        audioContextRef.current = audioContext
        const destination = audioContext.createMediaStreamDestination()
        audioDestinationRef.current = destination

        if (screenAudioTracks.length > 0) {
            const screenSource = audioContext.createMediaStreamSource(new MediaStream(screenAudioTracks))
            const screenGain = audioContext.createGain()
            screenGain.gain.value = 1
            screenSource.connect(screenGain).connect(destination)
        }

        if (micAudioTracks.length > 0) {
            const micSource = audioContext.createMediaStreamSource(new MediaStream(micAudioTracks))
            const micGain = audioContext.createGain()
            micGain.gain.value = 1
            micSource.connect(micGain).connect(destination)
        }

        return destination.stream.getAudioTracks()[0] ?? null
    }, [])

    const startRecording = useCallback(async () => {
        setError(null)
        chunksRef.current = []

        try {
            // 1. Screen / window / tab capture
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { frameRate: 30 },
                audio: useMic,
            })
            screenStreamRef.current = screenStream

            // 2. Optional mic capture (explicit permission prompt)
            let micStream: MediaStream | null = null
            if (useMic) {
                try {
                    micStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true,
                        },
                        video: false,
                    })
                    micStreamRef.current = micStream
                } catch (micErr) {
                    console.warn('Microphone access denied/unavailable:', micErr)
                    setError('Microphone permission denied. Recording will continue without mic audio.')
                }
            }

            // 3. Optional webcam
            let camStream: MediaStream | null = null
            if (useWebcam) {
                try {
                    camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                    webcamStreamRef.current = camStream
                } catch {
                    // Permission denied — continue screen only
                }
            }

            // 4. Build the stream to record
            //    - With webcam: composite screen + cam into canvas (SINGLE video track — fixes blank output)
            //    - Without webcam: record screenStream directly (fastest, highest quality)
            const videoStream = camStream
                ? buildCompositeStream(screenStream, camStream)
                : screenStream

            const recordingStream = new MediaStream()
            const videoTrack = videoStream.getVideoTracks()[0]
            if (!videoTrack) {
                throw new Error('No video track found for recording')
            }
            recordingStream.addTrack(videoTrack)

            if (useMic) {
                const mixedAudioTrack = buildMixedAudioTrack(screenStream, micStream)
                if (mixedAudioTrack) {
                    recordingStream.addTrack(mixedAudioTrack)
                }
            }

            // 5. MIME type negotiation
            const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
                ? 'video/webm;codecs=vp9'
                : MediaRecorder.isTypeSupported('video/webm')
                    ? 'video/webm'
                    : 'video/mp4'

            const recorder = new MediaRecorder(recordingStream, { mimeType })
            mediaRecorderRef.current = recorder

            recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }

            recorder.onstop = () => {
                stopAllStreams()
                const blob = new Blob(chunksRef.current, { type: mimeType })
                setRecordedBlob(blob)
                setRecordedUrl(URL.createObjectURL(blob))
                setPhase('preview')
            }

            // Auto-stop if user clicks "Stop sharing" in the native browser bar
            screenStream.getVideoTracks()[0].addEventListener('ended', () => {
                if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
            })

            recorder.start(250)
            setElapsed(0)
            setPhase('recording')

            timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000)
        } catch (err) {
            stopAllStreams()
            if ((err as Error).name !== 'NotAllowedError') {
                setError('Could not start recording. Please try again.')
            }
        }
    }, [useWebcam, useMic, stopAllStreams, buildCompositeStream, buildMixedAudioTrack])

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop()
    }, [])

    const handleReRecord = useCallback(() => {
        if (recordedUrl) URL.revokeObjectURL(recordedUrl)
        setRecordedUrl(null); setRecordedBlob(null); setElapsed(0); setPhase('idle')
    }, [recordedUrl])

    const handleUpload = useCallback(async () => {
        if (!recordedBlob) return
        setPhase('uploading')
        try {
            const ext = recordedBlob.type.includes('mp4') ? 'mp4' : 'webm'
            const file = new File([recordedBlob], `screen-recording-${Date.now()}.${ext}`, { type: recordedBlob.type })
            const form = new FormData()
            form.append('file', file)

            const res = await fetch('/api/videos', { method: 'POST', body: form })
            if (res.ok) {
                router.push(`/video/${(await res.json()).id}`)
            } else {
                throw new Error((await res.json()).message || 'Upload failed')
            }
        } catch (err) {
            console.error(err)
            setError('Upload failed. Please try again.')
            setPhase('preview')
        }
    }, [recordedBlob, router])

    // ─── IDLE ──────────────────────────────────────────────────────────────────
    if (phase === 'idle') {
        return (
            <div className="animate-slide-up max-w-3xl mx-auto">
                <div className="mb-8 pb-4 border-b border-border">
                    <h1 className="text-4xl font-display font-bold mb-2 uppercase tracking-tight">Record Screen</h1>
                    <p className="text-zinc-400 font-sans">Record your screen and we&apos;ll generate a step-by-step guide.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 border border-red-500/50 bg-red-500/10 text-red-400 font-sans text-sm uppercase tracking-wide font-bold">{error}</div>
                )}

                <div className="border-2 border-dashed border-border p-16 text-center transition-all shadow-[8px_8px_0px_#2F2F2F] bg-background hover:border-accent hover:bg-[#050505]">
                    <div className="relative w-20 h-20 mx-auto mb-6 bg-[#050505] border border-border flex items-center justify-center">
                        <Monitor className="w-8 h-8 text-zinc-500" />
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-[#050505]" />
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-3 uppercase tracking-wide">Ready to Record</h3>
                    <p className="text-zinc-500 font-sans text-sm uppercase font-bold tracking-wider mb-10">Screen · Window · Browser Tab</p>
                    <button
                        onClick={startRecording}
                        className="inline-flex items-center justify-center gap-3 bg-accent text-black px-8 py-4 font-sans font-bold text-lg uppercase tracking-wider cursor-pointer hover:bg-white transition-all shadow-[4px_4px_0px_white] hover:shadow-[2px_2px_0px_white] hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                        <Circle className="w-5 h-5 fill-red-500 text-red-500" />
                        Start Recording
                    </button>
                </div>

                {/* Options */}
                <div className="mt-6 bg-background border border-border p-6 shadow-[4px_4px_0px_#2F2F2F] flex flex-col gap-5">
                    <h4 className="font-display font-bold uppercase tracking-wide text-sm">Options</h4>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 border border-border bg-[#050505] flex items-center justify-center">
                                {useWebcam ? <Camera className="w-4 h-4 text-accent" /> : <CameraOff className="w-4 h-4 text-zinc-500" />}
                            </div>
                            <div>
                                <span className="font-sans font-bold text-sm uppercase tracking-wide block">Webcam Overlay</span>
                                <span className="font-sans text-xs text-zinc-500">Baked into the recording · Draggable live preview</span>
                            </div>
                        </div>
                        <button
                            role="switch" aria-checked={useWebcam}
                            onClick={() => setUseWebcam(v => !v)}
                            className={`relative w-12 h-6 border transition-colors ${useWebcam ? 'bg-accent border-accent' : 'bg-[#050505] border-border'}`}
                        >
                            <span className={`absolute top-0.5 w-5 h-5 bg-black transition-all ${useWebcam ? 'left-6' : 'left-0.5'}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 border border-border bg-[#050505] flex items-center justify-center">
                                {useMic ? <Mic className="w-4 h-4 text-accent" /> : <MicOff className="w-4 h-4 text-zinc-500" />}
                            </div>
                            <div>
                                <span className="font-sans font-bold text-sm uppercase tracking-wide block">Mic + Tab Audio</span>
                                <span className="font-sans text-xs text-zinc-500">Requests mic permission and records shared tab/system sound</span>
                            </div>
                        </div>
                        <button
                            role="switch" aria-checked={useMic}
                            onClick={() => setUseMic(v => !v)}
                            className={`relative w-12 h-6 border transition-colors ${useMic ? 'bg-accent border-accent' : 'bg-[#050505] border-border'}`}
                        >
                            <span className={`absolute top-0.5 w-5 h-5 bg-black transition-all ${useMic ? 'left-6' : 'left-0.5'}`} />
                        </button>
                    </div>

                    {/* Cross-tab note */}
                    {useWebcam && (
                        <div className="flex gap-3 p-3 border border-zinc-700 bg-zinc-900/50">
                            <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                            <p className="font-sans text-xs text-zinc-500 leading-relaxed">
                                The webcam preview is a <strong className="text-zinc-300">draggable floating panel</strong> visible on this tab. It is also <strong className="text-zinc-300">composited directly into the recorded video</strong> so viewers will see it. Cross-tab overlays require a browser extension and are outside the scope of a web app.
                            </p>
                        </div>
                    )}
                </div>

                <div className="mt-6 bg-background border border-border p-6 flex gap-4 items-start shadow-[4px_4px_0px_#2F2F2F]">
                    <div className="w-10 h-10 bg-[#050505] border border-border flex shrink-0 items-center justify-center">
                        <Sparkles className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                        <h4 className="font-display font-bold uppercase tracking-wide mb-1">Tips for best results</h4>
                        <p className="text-zinc-400 font-sans text-sm leading-relaxed">
                            Keep recordings under 5 minutes. Pause briefly between actions so AI identifies distinct steps cleanly.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    // ─── RECORDING ─────────────────────────────────────────────────────────────
    if (phase === 'recording') {
        return (
            <div className="animate-slide-up max-w-3xl mx-auto">
                <div className="mb-8 pb-4 border-b border-border">
                    <h1 className="text-4xl font-display font-bold mb-2 uppercase tracking-tight">Record Screen</h1>
                </div>

                <div className="border-2 border-dashed border-red-500 p-16 text-center shadow-[8px_8px_0px_#7f1d1d] bg-[#0A0A0A]">
                    <div className="relative w-20 h-20 mx-auto mb-6">
                        <div className="absolute inset-0 bg-red-500/20 animate-ping rounded-full" />
                        <div className="relative w-20 h-20 bg-[#050505] border border-red-500 flex items-center justify-center">
                            <Circle className="w-8 h-8 fill-red-500 text-red-500" />
                        </div>
                    </div>
                    <h3 className="text-2xl font-display font-bold mb-1 uppercase tracking-wide text-red-400">Recording</h3>
                    <p className="font-mono text-4xl font-bold text-white mb-10 tabular-nums">{formatDuration(elapsed)}</p>
                    <button
                        onClick={stopRecording}
                        className="inline-flex items-center justify-center gap-3 bg-red-500 text-white px-8 py-4 font-sans font-bold text-lg uppercase tracking-wider hover:bg-red-400 transition-all shadow-[4px_4px_0px_#7f1d1d] hover:shadow-[2px_2px_0px_#7f1d1d] hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                        <Square className="w-5 h-5 fill-white" />
                        Stop Recording
                    </button>
                </div>

                {useWebcam && <DraggableWebcamPip streamRef={webcamStreamRef} />}

                <p className="mt-8 text-center text-zinc-600 font-sans text-xs uppercase tracking-widest font-bold">
                    Recording your screen — do not close this tab
                </p>
            </div>
        )
    }

    // ─── PREVIEW ───────────────────────────────────────────────────────────────
    if (phase === 'preview') {
        return (
            <div className="animate-slide-up max-w-3xl mx-auto">
                <div className="mb-8 pb-4 border-b border-border flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-display font-bold mb-2 uppercase tracking-tight">Review Recording</h1>
                        <p className="text-zinc-400 font-sans">Happy with the recording? Upload it to generate your docs.</p>
                    </div>
                    <span className="font-mono text-zinc-500 font-bold text-sm border border-border px-3 py-1">{formatDuration(elapsed)}</span>
                </div>

                {error && (
                    <div className="mb-6 p-4 border border-red-500/50 bg-red-500/10 text-red-400 font-sans text-sm uppercase tracking-wide font-bold">{error}</div>
                )}

                <div className="bg-[#050505] border border-border overflow-hidden shadow-[8px_8px_0px_#2F2F2F] mb-6">
                    <div className="aspect-video bg-black">
                        <video ref={previewRef} src={recordedUrl ?? undefined} className="w-full h-full" controls autoPlay />
                    </div>
                    <div className="px-4 py-2 border-t border-border bg-[#0A0A0A] flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="font-sans text-xs font-bold uppercase tracking-wider text-zinc-400">Preview — not yet uploaded</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handleReRecord}
                        className="flex items-center gap-2 px-6 py-3 border border-border bg-[#050505] text-zinc-400 font-sans font-bold uppercase tracking-wider text-sm hover:border-zinc-400 hover:text-white transition-all shadow-[4px_4px_0px_#2F2F2F]"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Re-record
                    </button>
                    <button
                        onClick={handleUpload}
                        className="flex-1 flex items-center justify-center gap-3 bg-accent text-black px-8 py-3 font-sans font-bold uppercase tracking-wider hover:bg-white transition-all shadow-[4px_4px_0px_white] hover:shadow-[2px_2px_0px_white] hover:translate-x-[2px] hover:translate-y-[2px]"
                    >
                        <Upload className="w-5 h-5" />
                        Upload &amp; Generate Docs
                    </button>
                </div>
            </div>
        )
    }

    // ─── UPLOADING ─────────────────────────────────────────────────────────────
    return (
        <div className="animate-slide-up max-w-3xl mx-auto">
            <div className="mb-8 pb-4 border-b border-border">
                <h1 className="text-4xl font-display font-bold mb-2 uppercase tracking-tight">Record Screen</h1>
            </div>
            <div className="border-2 border-dashed border-accent p-16 text-center shadow-[8px_8px_0px_#2F2F2F] bg-[#050505]">
                <div className="w-20 h-20 mx-auto mb-6 bg-[#050505] border border-accent flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-accent/20 animate-pulse" />
                    <Loader2 className="w-8 h-8 animate-spin text-accent relative z-10" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-2 uppercase tracking-wide text-foreground">Uploading...</h3>
                <p className="text-zinc-500 font-sans tracking-wide uppercase font-bold text-sm">Please do not close this window</p>
            </div>
        </div>
    )
}

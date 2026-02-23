import Link from 'next/link'
import { Video, Sparkles, Globe, ArrowRight, Play, Upload, FileText } from 'lucide-react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/30 selection:text-white relative">
      {/* Dynamic Grid Background overlay - matched to text layout */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #2F2F2F 1px, transparent 1px),
            linear-gradient(to bottom, #2F2F2F 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Noise overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02] z-50 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── NAVBAR ── */}
      <header className="relative z-40 border-b border-border bg-background sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <span className="font-display font-medium text-2xl tracking-tight">HowToDo<span className="text-accent font-bold">X.</span></span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-zinc-400 hover:text-accent font-sans text-xs font-medium transition-colors uppercase tracking-[0.2em]">Features</a>
            <a href="#how-it-works" className="text-zinc-400 hover:text-accent font-sans text-xs font-medium transition-colors uppercase tracking-[0.2em]">How It Works</a>
          </nav>

          <div className="flex items-center gap-6">
            <Link href="/sign-in" className="font-sans text-zinc-400 border border-border px-5 py-2 hover:bg-border hover:text-foreground font-medium text-xs transition-colors uppercase tracking-[0.1em]">
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="bg-accent text-black px-6 py-2 border border-accent font-sans font-bold text-xs hover:bg-transparent hover:text-accent transition-colors uppercase tracking-[0.1em]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">

        {/* ── HERO ── */}
        <section className="relative overflow-hidden border-b border-border pt-32 pb-40">

          <div className="relative z-10 max-w-7xl mx-auto px-6 flex items-center">

            {/* The ghost oversized letter matching the reference image */}
            {/* The ghost oversized letter matching the reference image */}
            <div className="absolute left-[-2rem] md:left-0 top-1/2 -translate-y-1/2 select-none pointer-events-none z-0 flex items-center justify-center">

              <div className="relative w-[280px] h-[360px] md:w-[350px] md:h-[450px]">
                {/* Clean SVG X without internal overlapping stroke lines */}
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
                  <defs>
                    <linearGradient id="splitGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="50%" stopColor="var(--accent)" />
                      <stop offset="50%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points="0,0 25,0 50,33.3 75,0 100,0 62.5,50 100,100 75,100 50,66.7 25,100 0,100 37.5,50"
                    fill="url(#splitGradient)"
                    stroke="#2F2F2F"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                {/* Left Play Icon */}
                <div className="absolute left-[5%] top-1/2 -translate-y-1/2 text-[#2F2F2F] z-10 w-16 h-16 md:w-24 md:h-24">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" strokeLinejoin="miter" className="w-full h-full object-contain">
                    <polygon points="6 4 18 12 6 20 6 4" />
                  </svg>
                </div>

                {/* Right Document Icon */}
                <div className="absolute right-[5%] top-1/2 -translate-y-1/2 text-[#2F2F2F] z-10 w-16 h-16 md:w-24 md:h-24">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="square" strokeLinejoin="miter" className="w-full h-full object-contain">
                    <path d="M4 6h10v14H4z" />
                    <path d="M8 2h7l5 5v11H8z" fill="var(--background)" stroke="currentColor" strokeWidth="1" />
                    <path d="M15 2v5h5" fill="none" stroke="currentColor" strokeWidth="1" />
                    <line x1="11" y1="10" x2="17" y2="10" />
                    <line x1="11" y1="13" x2="17" y2="13" />
                    <line x1="11" y1="16" x2="14" y2="16" />
                  </svg>
                </div>
              </div>

            </div>

            {/* Hero content - shifted right to overlap gracefully */}
            <div className="relative z-10 ml-auto w-full md:w-[75%] lg:w-[65%] pt-8">
              {/* Tagline */}
              <p className="font-sans text-xs uppercase tracking-[0.1em] text-zinc-500 mb-8 border-l-2 border-accent pl-4 font-bold">
                The Last Documentation Tool You Need
              </p>

              {/* Headline - Restored font styling matching the Unbounded aesthetic */}
              <h1 className="font-display font-bold uppercase leading-[0.95] mb-8 animate-slide-up">
                <span className="block text-5xl md:text-6xl lg:text-7xl text-foreground">Turn Any Video</span>
                <span className="block text-5xl md:text-6xl lg:text-7xl text-foreground mb-2">Into A <span className="text-accent underline decoration-accent decoration-4 underline-offset-8">Step-By-Step</span></span>
                <span className="block text-5xl md:text-6xl lg:text-7xl text-foreground mt-4">Guide</span>
              </h1>

              {/* Subtext */}
              <p className="font-sans text-[#71717A] text-sm leading-relaxed mb-10 max-w-xl animate-slide-up-delay-1">
                Instantly convert video recordings into clear, concise, and shareable step-by-step guides with screenshots and text instructions using advanced AI technology. No more manual documentation.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 animate-slide-up-delay-2">
                <Link
                  href="/sign-up"
                  className="group inline-flex items-center justify-center gap-3 bg-accent border border-accent text-black px-8 py-4 font-sans font-bold text-xs hover:bg-[#D4E600] transition-colors uppercase tracking-[0.1em]"
                >
                  Start Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-3 bg-transparent border border-[#2F2F2F] text-zinc-300 px-8 py-4 font-sans font-medium text-xs hover:bg-[#2F2F2F]/50 hover:text-white transition-colors uppercase tracking-[0.1em]"
                >
                  See Examples
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="bg-[#050505] border-b border-border">
          <div className="max-w-7xl mx-auto py-24 px-6 relative z-10">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Video,
                  title: 'Frame Extraction',
                  desc: 'Automatically pulls key frames and high-quality screenshots from any video source.',
                },
                {
                  icon: Sparkles,
                  title: 'AI Analysis',
                  desc: 'Uses machine learning to understand video content and generate accurate descriptive text.',
                },
                {
                  icon: Globe,
                  title: 'Multilingual Output',
                  desc: 'Translate your guides into over 50 languages with a single click for global accessibility.',
                },
              ].map((feature, i) => (
                <div key={i} className="bg-[#050505] border border-border p-8 hover:border-accent transition-colors shadow-[4px_4px_0px_#2F2F2F] group">
                  <div className="w-16 h-16 border border-accent flex items-center justify-center mb-8">
                    <feature.icon className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-4 uppercase tracking-tighter leading-tight w-2/3">{feature.title}</h3>
                  <p className="font-sans text-[#71717A] leading-relaxed text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="border-b border-border bg-background relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border">
            {[
              { num: '01', title: 'Upload', desc: 'Drop your tutorial video. Any format, any length.' },
              { num: '02', title: 'Analyze', desc: 'AI extracts and describes each key frame.' },
              { num: '03', title: 'Refine', desc: 'Edit descriptions, reorder steps, tweak the guide.' },
              { num: '04', title: 'Translate', desc: 'Publish in any of 12+ languages instantly.' },
            ].map((item) => (
              <div key={item.num} className="group relative bg-[#0A0A0A] p-10 hover:bg-[#050505] transition-colors">
                <span className="font-display text-4xl font-black text-[#2F2F2F] mb-6 block group-hover:text-accent transition-colors">
                  {item.num}
                </span>
                <h3 className="font-display text-lg font-bold mb-3 uppercase tracking-wide">{item.title}</h3>
                <p className="font-sans text-sm text-[#71717A] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-32 px-6 bg-accent text-black relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-12">
              <div>
                <p className="font-sans text-black/50 text-sm uppercase tracking-widest font-bold mb-4">Get Started Today</p>
                <h2 className="font-display text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
                  Ready to<br />Transform<br />Your Videos?
                </h2>
              </div>
              <div className="flex flex-col items-start lg:items-end gap-6">
                <p className="font-sans text-black/70 text-base max-w-xs leading-relaxed text-left lg:text-right">
                  Join creators turning video tutorials into accessible, searchable documents.
                </p>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center gap-3 bg-black text-accent px-10 py-5 font-sans font-bold text-sm uppercase tracking-[0.1em] hover:bg-neutral-900 shadow-[8px_8px_0px_rgba(0,0,0,0.1)] hover:translate-y-1 hover:shadow-[4px_4px_0px_rgba(0,0,0,0.1)] transition-all"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border bg-[#050505] py-12 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <Link href="/" className="flex items-center group">
            <span className="font-display font-medium text-xl tracking-tight">HowToDo<span className="text-accent font-bold">X.</span></span>
          </Link>
          <div className="flex items-center gap-8">
            <a href="#features" className="font-sans text-[#71717A] text-xs uppercase tracking-wider font-bold hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="font-sans text-[#71717A] text-xs uppercase tracking-wider font-bold hover:text-white transition-colors">How it Works</a>
            <Link href="/sign-up" className="font-sans text-[#71717A] text-xs uppercase tracking-wider font-bold hover:text-accent transition-colors">Sign Up</Link>
          </div>
          <p className="font-sans text-[#71717A] text-xs uppercase tracking-[0.1em]">
            © 2024 HowToDoX
          </p>
        </div>
      </footer>
    </div>
  )
}

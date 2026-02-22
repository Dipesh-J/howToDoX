import Link from 'next/link'
import { Video, Sparkles, Globe, ArrowRight, Play, SquareTerminal } from 'lucide-react'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dashboard')
  }
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent/30 selection:text-white">
      {/* Noise overlay for texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-50 mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }}
      />

      <header className="relative z-40 border-b border-border bg-background sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 border border-border bg-background flex items-center justify-center group-hover:bg-accent group-hover:border-accent transition-colors">
              <SquareTerminal className="w-5 h-5 text-foreground group-hover:text-background transition-colors" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight uppercase">HowToDoX</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-zinc-500 hover:text-accent font-sans text-sm font-medium transition-colors uppercase tracking-wider">Features</a>
            <a href="#how-it-works" className="text-zinc-500 hover:text-accent font-sans text-sm font-medium transition-colors uppercase tracking-wider">How It Works</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="font-sans text-zinc-400 hover:text-foreground font-medium text-sm transition-colors uppercase tracking-wider"
            >
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="bg-accent text-black px-6 py-2.5 font-sans font-bold text-sm hover:bg-white transition-colors uppercase tracking-wider"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="relative py-32 px-6 overflow-hidden">
          <div className="max-w-5xl mx-auto text-center border border-border bg-[#050505] p-12 md:p-24 relative shadow-[8px_8px_0px_#2F2F2F]">

            <h1 className="font-display text-5xl md:text-[5rem] font-bold tracking-tighter mb-8 leading-[1] animate-slide-up uppercase">
              Turn Videos Into
              <br />
              <span className="text-accent inline-block mt-2">
                Step-By-Step Guides
              </span>
            </h1>

            <p className="font-sans text-lg md:text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-up-delay-1">
              Upload any tutorial video. Our AI analyzes every frame,
              creates actionable steps, and generates pristine how-to documents in 12+ languages.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-slide-up-delay-2">
              <Link
                href="/sign-up"
                className="group inline-flex items-center justify-center gap-3 bg-accent text-black px-8 py-4 font-sans font-bold text-lg hover:bg-white transition-colors uppercase tracking-wider shadow-[4px_4px_0px_white] hover:shadow-[2px_2px_0px_white] hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                Start Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-3 bg-transparent border border-border text-foreground px-8 py-4 font-sans font-bold text-lg hover:bg-border transition-colors uppercase tracking-wider"
              >
                <Play className="w-5 h-5" />
                See How It Works
              </a>
            </div>
          </div>

          {/* Hero visual */}
          <div className="mt-24 max-w-5xl mx-auto animate-fade-in-up">
            <div className="border border-border bg-background p-2 shadow-[8px_8px_0px_#2F2F2F]">
              <div className="bg-[#050505] p-8 aspect-video flex items-center justify-center relative overflow-hidden border border-border">
                {/* Grid Pattern */}
                <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#2F2F2F 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                <div className="grid grid-cols-3 gap-6 w-full h-full relative z-10">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-background border border-border flex items-center justify-center group hover:border-accent hover:bg-[#0A0A0A] transition-colors">
                      <Video className="w-8 h-8 text-zinc-700 group-hover:text-accent transition-colors" />
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <div className="w-24 h-24 bg-accent flex items-center justify-center shadow-[4px_4px_0px_white]">
                    <Play className="w-10 h-10 text-black fill-black ml-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 px-6 border-t border-border bg-[#050505]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 uppercase tracking-tight">
                Everything You Need
              </h2>
              <p className="font-sans text-zinc-400 text-lg max-w-xl mx-auto">
                Powerful tools to automate documentation from video. Built for speed and accuracy.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Video,
                  title: "Video Upload",
                  desc: "Drag and drop any tutorial video. We handle storage, processing, and frame extraction automatically.",
                  delay: "animate-slide-up-delay-1"
                },
                {
                  icon: Sparkles,
                  title: "AI Analysis",
                  desc: "Google Gemini Vision analyzes each frame to describe what's happening with actionable steps.",
                  delay: "animate-slide-up-delay-2"
                },
                {
                  icon: Globe,
                  title: "Multilingual",
                  desc: "Translate your how-to guides into 12+ languages instantly using Lingo.dev AI.",
                  delay: "animate-slide-up-delay-3"
                }
              ].map((feature, i) => (
                <div key={i} className={`group bg-background border border-border p-10 hover:border-accent transition-colors relative shadow-[4px_4px_0px_#2F2F2F] hover:shadow-[4px_4px_0px_#EBFF00] ${feature.delay}`}>
                  <div className={`w-14 h-14 bg-[#050505] border border-border flex items-center justify-center mb-8 group-hover:border-accent transition-colors`}>
                    <feature.icon className="w-6 h-6 text-foreground group-hover:text-accent transition-colors" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-4 uppercase tracking-wide">{feature.title}</h3>
                  <p className="font-sans text-zinc-400 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-32 px-6 border-t border-border">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 uppercase tracking-tight">
                How It Works
              </h2>
              <p className="font-sans text-zinc-400 text-lg max-w-xl mx-auto">
                From video to document in four brutal consecutive steps.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-0 border border-border">
              {[
                { step: '01', title: 'Upload', desc: 'Drag and drop your tutorial video' },
                { step: '02', title: 'Analyze', desc: 'AI extracts and describes each frame' },
                { step: '03', title: 'Refine', desc: 'Edit and improve AI suggestions' },
                { step: '04', title: 'Translate', desc: 'Publish in any language' }
              ].map((item, i) => (
                <div key={i} className="relative bg-background border-b md:border-b-0 md:border-r border-border p-10 text-left hover:bg-[#050505] transition-colors last:border-0">
                  <span className="font-display text-4xl font-black text-border mb-6 block group-hover:text-accent transition-colors">{item.step}</span>
                  <h3 className="font-display text-lg font-bold mb-3 uppercase tracking-wide">{item.title}</h3>
                  <p className="font-sans text-sm text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6 border-t border-border bg-accent text-black">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-display text-5xl md:text-7xl font-black mb-8 uppercase tracking-tighter leading-none">
              Ready to Transform Your Videos?
            </h2>
            <p className="font-sans text-black/70 font-semibold text-xl mb-12 max-w-2xl mx-auto">
              Join thousands of creators turning video tutorials into accessible documents.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-3 bg-black text-accent px-10 py-5 font-sans font-bold text-xl uppercase tracking-widest shadow-[8px_8px_0px_white] hover:shadow-[4px_4px_0px_white] hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
            >
              Get Started Free
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-[#050505] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-background border border-border flex items-center justify-center">
              <SquareTerminal className="w-5 h-5 text-accent" />
            </div>
            <span className="font-display font-bold uppercase tracking-widest">HowToDoX</span>
          </div>
          <p className="font-sans text-zinc-600 text-sm uppercase tracking-wider font-semibold">
            Transform video tutorials into accessible documents
          </p>
        </div>
      </footer>
    </div>
  )
}

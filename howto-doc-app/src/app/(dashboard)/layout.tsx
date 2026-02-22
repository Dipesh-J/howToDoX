'use client'

import { useUser, UserButton } from '@clerk/nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { SquareTerminal, Video, Upload as UploadIcon, Search } from 'lucide-react'
import { dark } from '@clerk/themes'
import { AuthProvider } from './auth-provider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  )
}

function DashboardContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-accent rounded-none animate-spin" />
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  const navItems = [
    { name: 'My Videos', path: '/dashboard', icon: Video },
    { name: 'Upload', path: '/upload', icon: UploadIcon },
    { name: 'Search', path: '/search', icon: Search },
  ]

  return (
    <div className="min-h-screen bg-[#050505] flex selection:bg-accent/30 selection:text-white">
      {/* Grid Pattern Background */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0" style={{ backgroundImage: 'radial-gradient(#2F2F2F 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-background fixed inset-y-0 left-0 z-40 flex flex-col shadow-[4px_0_0_#2F2F2F]">
        <div className="p-6 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 border border-border bg-background flex items-center justify-center group-hover:bg-accent group-hover:border-accent transition-colors shadow-[2px_2px_0px_#2F2F2F] group-hover:shadow-[2px_2px_0px_black]">
              <SquareTerminal className="w-5 h-5 text-foreground group-hover:text-black transition-colors" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight uppercase">HowToDoX</span>
          </Link>
        </div>

        <nav className="flex-1 p-6 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 border transition-colors font-sans uppercase font-bold text-sm tracking-wide ${isActive
                  ? 'border-accent bg-accent/5 text-accent shadow-[2px_2px_0px_var(--accent)]'
                  : 'border-transparent text-zinc-400 hover:border-border hover:bg-white/5 hover:text-foreground'
                  }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-6 border-t border-border flex items-center gap-3">
          <div className="flex-1">
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                baseTheme: dark,
                elements: {
                  userButtonAvatarBox: "rounded-none border-2 border-border hover:border-accent transition-colors",
                  userButtonPopoverCard: "bg-[#0A0A0A] rounded-none border border-[#2F2F2F] shadow-[8px_8px_0px_#2F2F2F]",
                  userPreviewMainIdentifier: "text-foreground font-display font-bold uppercase",
                  userPreviewSecondaryIdentifier: "text-zinc-400 font-sans",
                  userButtonPopoverActionButton: "hover:bg-[#2F2F2F] rounded-none text-foreground font-sans",
                  userButtonPopoverActionButtonText: "text-foreground font-sans",
                  userButtonPopoverActionButtonIcon: "text-foreground",
                  userButtonPopoverFooter: "hidden",
                },
                variables: {
                  colorPrimary: "#EBFF00",
                  colorTextOnPrimaryBackground: "#000000",
                  colorBackground: "#0A0A0A",
                  colorText: "#F5F5F5",
                  colorInputBackground: "#050505",
                  colorInputText: "#F5F5F5",
                  borderRadius: "0px",
                }
              }}
            />
          </div>
          <span className="text-xs font-sans text-zinc-500 uppercase tracking-wider font-bold">Profile</span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 relative z-10 w-full overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

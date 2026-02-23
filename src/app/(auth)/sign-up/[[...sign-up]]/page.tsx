import { SignUp } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 z-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#2F2F2F 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <div className="relative z-10 animate-slide-up">
        <SignUp
          afterSignUpUrl="/dashboard"
          appearance={{
            baseTheme: dark,
            elements: {
              card: "bg-[#0A0A0A] border border-[#2F2F2F] rounded-none shadow-[8px_8px_0px_#2F2F2F]",
              headerTitle: "font-display text-foreground font-bold uppercase",
              headerSubtitle: "text-zinc-400 font-sans",
              socialButtonsBlockButton: "rounded-none border border-[#2F2F2F] bg-[#050505] hover:bg-[#2F2F2F] text-foreground font-sans",
              socialButtonsBlockButtonText: "font-bold text-foreground",
              dividerLine: "bg-[#2F2F2F]",
              dividerText: "text-zinc-500 font-sans",
              formFieldLabel: "text-foreground font-sans uppercase font-bold text-xs tracking-wider",
              formFieldInput: "bg-[#050505] border border-[#2F2F2F] rounded-none text-foreground font-sans focus:border-accent focus:ring-accent",
              formButtonPrimary: "bg-[#EBFF00] text-black hover:bg-white rounded-none font-bold uppercase font-sans tracking-wide shadow-[4px_4px_0px_white] hover:shadow-[2px_2px_0px_white] hover:translate-x-[2px] hover:translate-y-[2px] transition-all",
              footerActionText: "text-zinc-400 font-sans",
              footerActionLink: "text-[#EBFF00] hover:text-white font-sans font-bold",
              identityPreviewText: "text-foreground font-sans",
              identityPreviewEditButton: "text-[#EBFF00] hover:text-white font-sans",
              formFieldInputShowPasswordButton: "text-zinc-400 hover:text-white",
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
    </div>
  )
}

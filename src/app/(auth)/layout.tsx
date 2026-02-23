'use client'

import { AuthLayoutProvider } from './auth-provider'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthLayoutProvider>{children}</AuthLayoutProvider>
}

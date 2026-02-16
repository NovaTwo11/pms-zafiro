import type React from "react"
import { AppShell } from "@/components/app-shell"
import { Analytics } from "@vercel/analytics/next"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}

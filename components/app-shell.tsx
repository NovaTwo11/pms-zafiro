"use client"

import type React from "react"

import { useEffect } from "react"
import { Sidebar } from "./sidebar"
import { Topbar } from "./topbar"
import { useSidebarStore, useSessionStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const { isCollapsed, setCollapsed } = useSidebarStore()
  const { setUser, openShift } = useSessionStore()
  const isMobile = useIsMobile()

  // Auto-collapse sidebar on mobile/tablet
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true)
    }
  }, [isMobile, setCollapsed])

  // Simulate logged in user and open shift for demo
  useEffect(() => {
    setUser({
      id: "1",
      name: "Juan Díaz",
      role: "Recepcionista",
    })
    openShift()
  }, [setUser, openShift])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Topbar />
      <main className={cn("min-h-screen pt-16 transition-all duration-300", isCollapsed ? "pl-[70px]" : "pl-[240px]")}>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSidebarStore } from "@/lib/store"
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  ShoppingCart,
  Users,
  BedDouble,
  Package,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cronograma", label: "Cronograma", icon: CalendarDays },
  { href: "/folios", label: "Folios", icon: FileText },
  { href: "/pos", label: "POS", icon: ShoppingCart },
  { href: "/huespedes", label: "Huéspedes", icon: Users },
  { href: "/habitaciones", label: "Habitaciones", icon: BedDouble },
  { href: "/inventario", label: "Inventario", icon: Package },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/settings", label: "Configuración", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggleCollapsed } = useSidebarStore()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-[#333333] bg-[#1A1A1A] transition-all duration-300",
          isCollapsed ? "w-[70px]" : "w-[240px]",
        )}
      >
        {/* Logo - Updated to Outfit font */}
        <div className="flex h-16 items-center justify-between border-b border-[#333333] px-4">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[#D4AF37] flex items-center justify-center">
                <span className="font-[family-name:var(--font-logo)] text-sm font-extrabold text-[#0F0F0F]">Z</span>
              </div>
              <span className="font-[family-name:var(--font-heading)] text-lg font-bold text-[#E5E5E5]">
                Hotel Zafiro
              </span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/dashboard" className="mx-auto">
              <div className="h-8 w-8 rounded-full bg-[#D4AF37] flex items-center justify-center">
                <span className="font-[family-name:var(--font-logo)] text-sm font-extrabold text-[#0F0F0F]">Z</span>
              </div>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            const Icon = item.icon

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-300",
                  isActive
                    ? "bg-[#D4AF37]/10 text-[#D4AF37]"
                    : "text-[#A3A3A3] hover:bg-[#252525] hover:text-[#E5E5E5]",
                  isCollapsed && "justify-center px-2",
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0 transition-colors duration-300", isActive && "text-[#D4AF37]")} />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            )

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.href}>{linkContent}</div>
          })}
        </nav>

        {/* Collapse Button */}
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className={cn(
              "w-full text-[#A3A3A3] hover:bg-[#252525] hover:text-[#E5E5E5] transition-all duration-300",
              isCollapsed && "justify-center",
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Colapsar
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}

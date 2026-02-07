"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BedDouble,
  FileText,
  CreditCard,
  BarChart3,
  Package,
  Settings,
  Menu,
  X,
  Hotel,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebarStore } from "@/lib/store"
import { ScrollArea } from "@/components/ui/scroll-area"

// Definición de las rutas del menú
const routes = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
  },
  {
    label: "Cronograma",
    icon: CalendarDays,
    href: "/cronograma",
    color: "text-violet-500",
  },
  {
    label: "Folios",
    icon: FileText,
    href: "/folios",
    color: "text-pink-700",
  },
  {
    label: "Huéspedes",
    icon: Users,
    href: "/huespedes",
    color: "text-orange-700",
  },
  {
    label: "Habitaciones",
    icon: BedDouble,
    href: "/habitaciones",
    color: "text-emerald-500",
  },
  {
    label: "Punto de Venta",
    icon: CreditCard,
    href: "/pos",
    color: "text-green-700",
  },
  {
    label: "Inventario",
    icon: Package,
    href: "/inventario",
    color: "text-blue-700",
  },
  {
    label: "Reportes",
    icon: BarChart3,
    href: "/reportes",
    color: "text-indigo-700",
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggleSidebar } = useSidebarStore()

  return (
      <div
          className={cn(
              // CAMBIO: bg-[#1A1A1A] -> bg-sidebar, border-[#333333] -> border-sidebar-border
              "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300",
              isCollapsed ? "w-[70px]" : "w-[240px]",
          )}
      >
        {/* Logo Header */}
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
          {isCollapsed ? (
              <Hotel className="h-8 w-8 text-primary animate-pulse" />
          ) : (
              <Link href="/dashboard" className="flex items-center gap-2">
                <Hotel className="h-8 w-8 text-primary" />
                <span className="font-[family-name:var(--font-logo)] text-xl font-bold text-sidebar-foreground">
              ZAFIRO
            </span>
              </Link>
          )}
        </div>

        {/* Toggle Button (Mobile/Desktop) */}
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md hover:bg-sidebar-accent"
        >
          {isCollapsed ? <Menu className="h-3 w-3" /> : <X className="h-3 w-3" />}
        </Button>

        {/* Navigation Links */}
        <ScrollArea className="h-[calc(100vh-4rem)] py-4">
          <div className="space-y-1 px-2">
            {routes.map((route) => (
                <Link
                    key={route.href}
                    href={route.href}
                    className={cn(
                        "group flex w-full justify-start cursor-pointer rounded-lg p-3 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        pathname === route.href
                            ? "bg-sidebar-accent text-sidebar-primary" // Activo
                            : "text-sidebar-foreground/70", // Inactivo
                        isCollapsed && "justify-center px-2",
                    )}
                >
                  <div className="flex items-center flex-1">
                    <route.icon
                        className={cn(
                            "h-5 w-5",
                            route.color,
                            isCollapsed ? "mr-0" : "mr-3",
                            pathname === route.href ? "text-sidebar-primary" : "text-sidebar-foreground/70",
                        )}
                    />
                    {!isCollapsed && <span>{route.label}</span>}
                  </div>
                </Link>
            ))}
          </div>

          {/* Settings Link at Bottom */}
          <div className="absolute bottom-4 w-full px-2">
            <Link
                href="/settings"
                className={cn(
                    "group flex w-full justify-start cursor-pointer rounded-lg p-3 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    pathname === "/settings"
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70",
                    isCollapsed && "justify-center px-2",
                )}
            >
              <Settings className={cn("h-5 w-5 mr-3", isCollapsed && "mr-0")} />
              {!isCollapsed && <span>Configuración</span>}
            </Link>
          </div>
        </ScrollArea>
      </div>
  )
}
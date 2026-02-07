"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  BedDouble,
  ShoppingBasket,
  FileText,
  Settings,
  ChevronLeft,
  Menu,
  Package,
  ClipboardList,
  BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { useSidebarStore } from "@/lib/store"
import { cn } from "@/lib/utils"

// Lista completa de accesos según la estructura de carpetas
const sidebarItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: CalendarDays, label: "Cronograma", href: "/cronograma" },
  { icon: BedDouble, label: "Habitaciones", href: "/habitaciones" },
  { icon: Users, label: "Huéspedes", href: "/huespedes" },
  { icon: Package, label: "Inventario", href: "/inventario" },
  { icon: ShoppingBasket, label: "Punto de Venta", href: "/pos" },
  { icon: FileText, label: "Folios / Caja", href: "/folios" },
  { icon: BarChart3, label: "Reportes", href: "/reportes" },
  { icon: Settings, label: "Configuración", href: "/settings" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isCollapsed, toggleSidebar } = useSidebarStore()

  return (
      <aside
          className={cn(
              "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-card/50 backdrop-blur-xl transition-all duration-300 ease-in-out",
              isCollapsed ? "w-[80px]" : "w-[280px]"
          )}
      >
        {/* Header del Sidebar */}
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {!isCollapsed && (
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent truncate pl-2">
              Hotel Zafiro
            </span>
          )}
          <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className={cn("ml-auto", isCollapsed && "mx-auto")}
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navegación */}
        <ScrollArea className="flex-1 py-4">
          <nav className="grid gap-1 px-2">
            <TooltipProvider delayDuration={0}>
              {sidebarItems.map((item, index) => {
                const isActive = pathname.startsWith(item.href)
                return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <Link
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground",
                                isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground",
                                isCollapsed && "justify-center px-2"
                            )}
                        >
                          <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                          {!isCollapsed && <span>{item.label}</span>}
                        </Link>
                      </TooltipTrigger>
                      {isCollapsed && (
                          <TooltipContent side="right" className="font-medium">
                            {item.label}
                          </TooltipContent>
                      )}
                    </Tooltip>
                )
              })}
            </TooltipProvider>
          </nav>
        </ScrollArea>

        {/* Footer del Sidebar */}
        {!isCollapsed && (
            <div className="p-4 border-t text-xs text-muted-foreground text-center bg-background/50">
              v0.1.0 • Zafiro PMS
            </div>
        )}
      </aside>
  )
}
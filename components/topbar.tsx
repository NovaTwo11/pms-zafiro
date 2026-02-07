"use client"

import { useState, useEffect } from "react"
import { Plus, User, LogOut, Settings, Sun, Moon } from "lucide-react" // Importar Sun y Moon
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useSidebarStore, useSessionStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes" // Importar useTheme

const quickActions = [
  { label: "Nueva Reserva", href: "/cronograma?action=new" },
  { label: "Check-in Rápido", href: "/folios?action=checkin" },
  { label: "Venta POS", href: "/pos" },
  { label: "Nuevo Huésped", href: "/huespedes?action=new" },
]

export function Topbar() {
  const { isCollapsed } = useSidebarStore()
  const { isShiftOpen } = useSessionStore()
  const router = useRouter()
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const { theme, setTheme } = useTheme() // Hook del tema
  const [mounted, setMounted] = useState(false)

  // Evitar error de hidratación renderizando el icono solo en cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    router.push("/login")
  }

  return (
      <header
          className={cn(
              // CAMBIO: Usar bg-background/80 y border-border en lugar de hex codes fijos
              "fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6 transition-all duration-300",
              isCollapsed ? "left-[70px]" : "left-[240px]",
          )}
      >
        {/* Left side */}
        <div />

        {/* Right side */}
        <div className="flex items-center gap-4">

          {/* Theme Toggle Button */}
          {mounted && (
              <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                ) : (
                    <Moon className="h-5 w-5" />
                )}
                <span className="sr-only">Cambiar tema</span>
              </Button>
          )}

          {/* Quick Action Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button size="icon" className="h-9 w-9 rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            {/* CAMBIO: Usar clases semánticas para el Dialog */}
            <DialogContent className="bg-card border-border text-card-foreground">
              <DialogHeader>
                <DialogTitle className="font-[family-name:var(--font-heading)] text-xl text-foreground">
                  Acción Rápida
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 pt-4">
                {quickActions.map((action) => (
                    <Link key={action.href} href={action.href}>
                      <Button
                          variant="outline"
                          // CAMBIO: Adaptar colores al tema
                          className="w-full h-20 border-border bg-background text-foreground hover:bg-accent hover:border-primary hover:text-primary"
                      >
                        {action.label}
                      </Button>
                    </Link>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Shift Indicator */}
          <div className="flex items-center gap-2 text-sm">
            <span className={cn("h-2 w-2 rounded-full", isShiftOpen ? "bg-success animate-pulse" : "bg-destructive")} />
            <span className="text-muted-foreground">{isShiftOpen ? "Turno Abierto" : "Sin Turno"}</span>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9 border border-border">
                  <AvatarFallback className="bg-accent text-foreground">JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-popover border-border text-popover-foreground" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-foreground">Juan Díaz</p>
                  <p className="text-xs text-muted-foreground">Recepcionista</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                  onClick={() => setProfileModalOpen(true)}
                  className="focus:bg-accent focus:text-accent-foreground cursor-pointer"
              >
                <User className="h-4 w-4 mr-2" />
                Mi Perfil
              </DropdownMenuItem>
              <Link href="/settings">
                <DropdownMenuItem className="focus:bg-accent focus:text-accent-foreground cursor-pointer">
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
          <DialogContent className="sm:max-w-[400px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-heading)] text-xl text-foreground">
                Mi Perfil
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary">
                  <AvatarFallback className="bg-accent text-foreground text-xl">JD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">Juan Díaz</p>
                  <p className="text-sm text-muted-foreground">Recepcionista</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <Input
                      value="juan.diaz@hotelzafiro.com"
                      readOnly
                      className="bg-background border-input text-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Teléfono</Label>
                  <Input value="+57 300 123 4567" readOnly className="bg-background border-input text-foreground" />
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Rol</Label>
                  <Input value="Recepcionista" readOnly className="bg-background border-input text-foreground" />
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Turno Actual</Label>
                  <Input
                      value={isShiftOpen ? "Turno Abierto - 06:00 AM" : "Sin Turno"}
                      readOnly
                      className="bg-background border-input text-foreground"
                  />
                </div>
              </div>

              <Button
                  variant="outline"
                  onClick={() => setProfileModalOpen(false)}
                  className="w-full border-border text-foreground hover:bg-accent bg-transparent"
              >
                Cerrar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>
  )
}
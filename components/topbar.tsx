"use client"

import { useState } from "react"
import { Plus, User, LogOut, Settings } from "lucide-react"
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

  const handleLogout = () => {
    router.push("/login")
  }

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-[#333333] bg-[#0F0F0F]/80 backdrop-blur-sm px-6 transition-all duration-300",
        isCollapsed ? "left-[70px]" : "left-[240px]",
      )}
    >
      {/* Left side */}
      <div />

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Quick Action Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button size="icon" className="h-9 w-9 rounded-full bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90">
              <Plus className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]">
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-heading)] text-xl text-[#E5E5E5]">
                Acción Rápida
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 pt-4">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <Button
                    variant="outline"
                    className="w-full h-20 border-[#333333] bg-[#0F0F0F] text-[#E5E5E5] hover:bg-[#252525] hover:border-[#D4AF37] hover:text-[#D4AF37]"
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
          <span className={cn("h-2 w-2 rounded-full", isShiftOpen ? "bg-[#059669] animate-pulse" : "bg-[#CF6679]")} />
          <span className="text-[#A3A3A3]">{isShiftOpen ? "Turno Abierto" : "Sin Turno"}</span>
        </div>

        {/* User Menu - Added profile modal and logout functionality */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9 border border-[#333333]">
                <AvatarFallback className="bg-[#252525] text-[#E5E5E5]">JD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium text-[#E5E5E5]">Juan Díaz</p>
                <p className="text-xs text-[#A3A3A3]">Recepcionista</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#333333]" />
            <DropdownMenuItem
              onClick={() => setProfileModalOpen(true)}
              className="text-[#E5E5E5] focus:bg-[#252525] focus:text-[#E5E5E5] cursor-pointer"
            >
              <User className="h-4 w-4 mr-2" />
              Mi Perfil
            </DropdownMenuItem>
            <Link href="/settings">
              <DropdownMenuItem className="text-[#E5E5E5] focus:bg-[#252525] focus:text-[#E5E5E5] cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                Configuración
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator className="bg-[#333333]" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-[#CF6679] focus:bg-[#252525] focus:text-[#CF6679] cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#1A1A1A] border-[#333333]">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-heading)] text-xl text-[#E5E5E5]">
              Mi Perfil
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-[#D4AF37]">
                <AvatarFallback className="bg-[#252525] text-[#E5E5E5] text-xl">JD</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-[#E5E5E5]">Juan Díaz</p>
                <p className="text-sm text-[#A3A3A3]">Recepcionista</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-[#A3A3A3] text-xs">Email</Label>
                <Input
                  value="juan.diaz@hotelzafiro.com"
                  readOnly
                  className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[#A3A3A3] text-xs">Teléfono</Label>
                <Input value="+57 300 123 4567" readOnly className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[#A3A3A3] text-xs">Rol</Label>
                <Input value="Recepcionista" readOnly className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]" />
              </div>
              <div className="space-y-1">
                <Label className="text-[#A3A3A3] text-xs">Turno Actual</Label>
                <Input
                  value={isShiftOpen ? "Turno Abierto - 06:00 AM" : "Sin Turno"}
                  readOnly
                  className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
                />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setProfileModalOpen(false)}
              className="w-full border-[#333333] text-[#E5E5E5] hover:bg-[#252525] bg-transparent"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}

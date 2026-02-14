"use client"

import * as React from "react"
import { Bell, Search, LogOut, Moon, Sun, Clock, Banknote } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useSessionStore, useSidebarStore, useCashierStore } from "@/lib/store"
import { cn } from "@/lib/utils"
import { CashierManagementModal } from "@/components/cashier-management-modal"
import { logout } from "@/lib/api" // <--- Importamos la función de logout real

// Datos de prueba para las notificaciones
const notifications = [
  {
    id: 1,
    title: "Nueva Reserva #1205",
    message: "Juan Pérez ha reservado la Suite 101.",
    time: "Hace 5 min",
    unread: true,
  },
  {
    id: 2,
    title: "Limpieza Requerida",
    message: "Habitación 204 marcada como 'Sucia'.",
    time: "Hace 20 min",
    unread: true,
  },
  {
    id: 3,
    title: "Stock Bajo",
    message: "El inventario de 'Agua Mineral' es crítico.",
    time: "Hace 1 hora",
    unread: false,
  },
  {
    id: 4,
    title: "Turno Cerrado",
    message: "El reporte de ayer se generó correctamente.",
    time: "Hace 12 horas",
    unread: false,
  },
]

export function Topbar() {
  const { user } = useSessionStore()
  const { isCollapsed } = useSidebarStore()

  // Integración Store de Caja
  const { isShiftOpen, checkStatus } = useCashierStore()
  const [showCashierModal, setShowCashierModal] = React.useState(false)

  const { setTheme, theme } = useTheme()

  // Verificar estado de caja al montar el componente
  React.useEffect(() => {
    checkStatus()
  }, [checkStatus])

  // Función de cierre de sesión real
  const handleLogout = () => {
    logout() // Llama a la función centralizada que borra cookies y redirige
  }

  // Calculamos si hay no leídas para mostrar el punto rojo en la campana
  const hasUnread = notifications.some((n) => n.unread)

  return (
      <header
          className={cn(
              "fixed top-0 right-0 z-40 flex h-16 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur-md transition-all duration-300 ease-in-out",
              isCollapsed ? "left-[80px]" : "left-[280px]"
          )}
      >
        {/* Barra de búsqueda global */}
        <div className="flex flex-1 items-center gap-4 md:gap-8">
          <div className="relative flex-1 md:w-full md:max-w-[300px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                type="search"
                placeholder="Buscar reserva, huésped..."
                className="w-full rounded-full bg-muted/50 pl-9 md:w-[300px] lg:w-[400px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">

          {/* --- INTEGRACIÓN BOTÓN DE CAJA --- */}
          <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCashierModal(true)}
              className={cn(
                  "mr-2 border-dashed border-2 hidden md:flex transition-colors duration-300",
                  isShiftOpen
                      ? "border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                      : "border-red-400 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              )}
          >
            <Banknote className="mr-2 h-4 w-4" />
            {isShiftOpen ? "Caja Abierta" : "Caja Cerrada"}
          </Button>

          {/* Modal de Gestión de Caja */}
          <CashierManagementModal
              isOpen={showCashierModal}
              onClose={() => setShowCashierModal(false)}
          />
          {/* ---------------------------------- */}

          {/* Toggle Modo Oscuro */}
          <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-foreground"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Alternar tema</span>
          </Button>

          {/* Notificaciones Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                {hasUnread && (
                    <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between pb-2">
                <span>Notificaciones</span>
                <span className="text-xs font-normal text-muted-foreground cursor-pointer hover:text-primary">
                Marcar leídas
              </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <ScrollArea className="h-[300px]">
                <div className="flex flex-col gap-1 p-1">
                  {notifications.map((notification) => (
                      <div
                          key={notification.id}
                          className={cn(
                              "flex flex-col gap-1 rounded-md p-3 text-sm transition-colors hover:bg-accent cursor-pointer",
                              notification.unread ? "bg-accent/50" : "bg-transparent"
                          )}
                      >
                        <div className="flex items-center justify-between">
                          <p className={cn("font-medium", notification.unread && "text-primary")}>
                            {notification.title}
                          </p>
                          {notification.unread && (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          {notification.time}
                        </div>
                      </div>
                  ))}
                </div>
              </ScrollArea>
              <DropdownMenuSeparator />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Menú de Usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full ml-2">
                <Avatar className="h-10 w-10 border-2 border-primary/20">
                  <AvatarImage src="/placeholder-user.jpg" alt={user?.name || "Admin"} />
                  <AvatarFallback className="bg-primary/10 text-primary">AD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || "Administrador"}</p>
                  <p className="text-xs leading-none text-muted-foreground">admin@hotelzafiro.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
  )
}
"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Plus, Search, Filter, MoreHorizontal, FileText, ShieldOff, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GuestFormDrawer } from "./guest-form-drawer"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"

// Interface del backend adaptada al front
interface Guest {
  id: string
  firstName: string
  lastName: string
  fullName?: string // a veces viene del back concatenado
  email: string
  phone: string
  nationality: string
  documentType: string
  documentNumber: string
  dateOfBirth?: Date // Importante para el formulario
  totalStays: number
  lastStay?: Date
  status: "in-house" | "previous"
}

export function HuespedesContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)

  // Estado para el drawer
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Cargar datos
  const fetchGuests = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/guests')

      const mappedGuests: Guest[] = data.map((g: any) => {
        // Asegurar que firstName y lastName existan si viene solo fullName
        const nameParts = g.fullName ? g.fullName.split(' ') : ["", ""]

        return {
          id: g.id,
          firstName: g.firstName || nameParts[0],
          lastName: g.lastName || nameParts.slice(1).join(' '),
          email: g.email,
          phone: g.phone,
          nationality: g.nationality,
          documentType: g.documentType,
          documentNumber: g.documentNumber,
          dateOfBirth: g.birthDate ? new Date(g.birthDate) : undefined,
          totalStays: g.totalStays || 0,
          lastStay: g.lastStayDate ? new Date(g.lastStayDate) : undefined,
          status: g.currentStatus || "previous"
        }
      })

      setGuests(mappedGuests)
    } catch (error) {
      console.error(error)
      toast.error("Error conectando con el servidor")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGuests()
  }, [])

  // Filtrado local
  const filteredGuests = guests.filter(
      (g) =>
          g.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.documentNumber?.includes(searchQuery),
  )

  // MANEJADORES DE ACCIONES

  const handleNewGuest = () => {
    setSelectedGuest(null) // Limpiar selección para modo "Crear"
    setDrawerOpen(true)
  }

  const handleEditGuest = (guest: Guest) => {
    setSelectedGuest(guest) // Pasar datos para modo "Editar"
    setDrawerOpen(true)
  }

  const handleFilterClick = () => {
    // Funcionalidad básica: Limpiar filtros o recargar
    if (searchQuery) {
      setSearchQuery("")
      toast.info("Filtros de búsqueda limpiados")
    } else {
      toast.info("Próximamente: Filtros avanzados por fecha y estado")
    }
  }

  return (
      <>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-foreground">Huéspedes</h1>
              <p className="text-muted-foreground">Gestión de perfiles y datos legales</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nombre o documento..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[280px] pl-9 bg-card border-border text-foreground placeholder:text-[#666666] focus:border-[#D4AF37]"
                />
              </div>

              <Button
                  variant="outline"
                  size="icon"
                  onClick={handleFilterClick}
                  className="border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                  title="Limpiar filtros / Opciones avanzadas"
              >
                {searchQuery ? <RotateCcw className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
              </Button>

              <Button onClick={handleNewGuest} className="bg-primary text-[#0F0F0F] hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Huésped
              </Button>
            </div>
          </div>

          {/* Guests Table */}
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
                </div>
            ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                    <tr className="border-b border-border bg-background">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Huésped</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Documento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nacionalidad</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Contacto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estadías</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredGuests.map((guest) => (
                        <tr
                            key={guest.id}
                            className="border-b border-border last:border-0 hover:bg-accent transition-colors cursor-pointer"
                            onClick={() => handleEditGuest(guest)} // AQUÍ SE ACTIVA LA EDICIÓN
                        >
                          <td className="px-4 py-4">
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {guest.firstName} {guest.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">{guest.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-foreground">{guest.documentNumber}</p>
                            <p className="text-xs text-muted-foreground">{guest.documentType}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-foreground">{guest.nationality || "N/A"}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-foreground">{guest.phone}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-foreground">{guest.totalStays} visitas</p>
                            {guest.lastStay && (
                                <p className="text-xs text-muted-foreground">
                                  Última: {format(guest.lastStay, "dd MMM yyyy", { locale: es })}
                                </p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                        <span className={cn(
                            "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                            guest.status === "in-house"
                                ? "bg-[#3B82F6]/10 text-[#3B82F6]"
                                : "bg-[#A3A3A3]/10 text-muted-foreground",
                        )}>
                          {guest.status === "in-house" ? "En casa" : "Anterior"}
                        </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-[#333333]">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-card border-border" align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditGuest(guest); }}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-[#CF6679]">
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
            )}
          </div>
        </div>

        {/* Guest Form Drawer CON LA PROPIEDAD CORRECTA */}
        <GuestFormDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            onGuestSaved={() => {
              fetchGuests(); // Recargar lista al guardar
            }}
            guestToEdit={selectedGuest} // Pasar el huésped seleccionado
        />
      </>
  )
}
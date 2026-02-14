"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Plus, Search, Filter, MoreHorizontal, Loader2, RotateCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { GuestFormDrawer, GuestDetailDto } from "./guest-form-drawer"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"

// Interface del backend (Lectura)
interface Guest {
  id: string
  firstName: string
  lastName: string
  fullName?: string
  email: string
  phone: string
  nationality: string
  cityOfOrigin?: string // <--- AGREGADO: Necesario para leer la ciudad
  documentType: string
  documentNumber: string
  dateOfBirth?: string | Date
  totalStays: number
  lastStay?: string | Date
  status: "in-house" | "previous"
}

export function HuespedesContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [guests, setGuests] = useState<Guest[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedGuestDto, setSelectedGuestDto] = useState<GuestDetailDto | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Cargar datos
  const fetchGuests = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/guests')

      const mappedGuests: Guest[] = data.map((g: any) => {
        const nameParts = g.fullName ? g.fullName.split(' ') : ["", ""]
        return {
          id: g.id,
          firstName: g.firstName || nameParts[0],
          lastName: g.lastName || nameParts.slice(1).join(' '),
          email: g.email,
          phone: g.phone,
          nationality: g.nationality,
          cityOfOrigin: g.cityOfOrigin, // <--- MAPEO: Recibir del backend
          documentType: g.documentType,
          documentNumber: g.documentNumber,
          dateOfBirth: g.birthDate, // Dejarlo crudo aquí, lo procesamos en el adaptador
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

  const filteredGuests = guests.filter(
      (g) =>
          g.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          g.documentNumber?.includes(searchQuery),
  )

  // --- ADAPTADOR: Guest (Tabla) -> GuestDetailDto (Formulario) ---
  const adaptGuestToForm = (guest: Guest): GuestDetailDto => {
    const nameParts = guest.firstName ? guest.firstName.trim().split(' ') : [""];
    const lastNameParts = guest.lastName ? guest.lastName.trim().split(' ') : [""];

    // FIX FECHA VISUAL (-1 DÍA):
    // Si viene "2004-12-11", JS lo toma como UTC 00:00 -> Colombia 7PM día anterior.
    // Solución: Le pegamos "T12:00:00" para forzar mediodía y que caiga en el mismo día.
    let safeDateStr = undefined;
    if (guest.dateOfBirth) {
      const rawDate = guest.dateOfBirth.toString();
      // Si es solo YYYY-MM-DD, le agregamos la hora segura
      if (!rawDate.includes('T')) {
        safeDateStr = `${rawDate}T12:00:00`;
      } else {
        safeDateStr = rawDate;
      }
    }

    return {
      id: guest.id,
      primerNombre: nameParts[0] || "",
      segundoNombre: nameParts.length > 1 ? nameParts.slice(1).join(' ') : "",
      primerApellido: lastNameParts[0] || "",
      segundoApellido: lastNameParts.length > 1 ? lastNameParts.slice(1).join(' ') : "",
      correo: guest.email,
      telefono: guest.phone,
      nacionalidad: guest.nationality,
      tipoId: guest.documentType,
      numeroId: guest.documentNumber,

      // Pasamos el string seguro al formulario
      fechaNacimiento: safeDateStr,

      esTitular: false,
      ciudadOrigen: guest.cityOfOrigin || "" // <--- MAPEO: Pasar al form
    };
  }

  const handleNewGuest = () => {
    setSelectedGuestDto(null)
    setDrawerOpen(true)
  }

  const handleEditGuest = (guest: Guest) => {
    const dto = adaptGuestToForm(guest);
    setSelectedGuestDto(dto)
    setDrawerOpen(true)
  }

  const handleDeleteGuest = async (id: string) => {
    if(!confirm("¿Estás seguro de eliminar este perfil?")) return;
    try {
      await api.delete(`/guests/${id}`);
      toast.success("Huésped eliminado");
      fetchGuests();
    } catch (e) {
      toast.error("No se pudo eliminar");
    }
  }

  const handleFilterClick = () => {
    if (searchQuery) {
      setSearchQuery("")
      toast.info("Filtros limpiados")
    } else {
      toast.info("Próximamente: Filtros avanzados")
    }
  }

  // --- LÓGICA DE GUARDADO (CRUD) ---
  const handleGuestSaved = async (formData: any) => {
    try {
      // Formatear fecha a YYYY-MM-DD simple para enviar al backend (sin hora)
      // El backend leerá esto con DateOnly.TryParseExact
      let formattedDate = null;
      if (formData.fechaNacimiento) {
        // Si viene del componente Calendar, puede ser un string largo ISO
        // Cortamos en la T para quedarnos con YYYY-MM-DD
        formattedDate = formData.fechaNacimiento.toString().split('T')[0];
      }

      // CASO 1: EDICIÓN (PUT)
      if (formData.id) {
        await api.put(`/guests/${formData.id}`, {
          primerNombre: formData.primerNombre,
          segundoNombre: formData.segundoNombre,
          primerApellido: formData.primerApellido,
          segundoApellido: formData.segundoApellido,
          tipoId: formData.tipoId,
          numeroId: formData.numeroId,
          nacionalidad: formData.nacionalidad,
          telefono: formData.telefono,
          correo: formData.correo,
          fechaNacimiento: formattedDate, // Enviar formato simple
          ciudadOrigen: formData.ciudadOrigen // Enviar ciudad
        });
        toast.success("Huésped actualizado");
      }
      // CASO 2: CREACIÓN (POST)
      else {
        await api.post('/guests', {
          firstName: formData.primerNombre,
          secondName: formData.segundoNombre,
          lastName: formData.primerApellido,
          secondLastName: formData.segundoApellido,
          documentType: formData.tipoId,
          documentNumber: formData.numeroId,
          email: formData.correo,
          phone: formData.telefono,
          nationality: formData.nacionalidad,
          cityOrigin: formData.ciudadOrigen, // Enviar ciudad
          birthDate: formattedDate // Enviar formato simple
        });
        toast.success("Huésped creado");
      }

      setDrawerOpen(false);
      await fetchGuests();

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Error al guardar huésped";
      toast.error(msg);
    }
  }

  return (
      <>
        <div className="space-y-6 h-full flex flex-col">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
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
                  title="Limpiar filtros"
              >
                {searchQuery ? <RotateCcw className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
              </Button>

              <Button onClick={handleNewGuest} className="bg-primary text-[#0F0F0F] hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Huésped
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card overflow-hidden flex-1 flex flex-col">
            {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37]" />
                </div>
            ) : (
                <div className="overflow-auto custom-scrollbar flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                    <tr className="border-b border-border">
                      <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Huésped</th>
                      <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Documento</th>
                      <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Nacionalidad</th>
                      <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contacto</th>
                      <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estadías</th>
                      <th className="px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Acciones</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                    {filteredGuests.length > 0 ? filteredGuests.map((guest) => (
                        <tr
                            key={guest.id}
                            className="hover:bg-muted/30 transition-colors group cursor-pointer"
                            onClick={() => handleEditGuest(guest)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {guest.firstName[0]}{guest.lastName[0]}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">
                                  {guest.firstName} {guest.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">{guest.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">{guest.documentNumber}</span>
                              <span className="text-[10px] uppercase text-muted-foreground">{guest.documentType}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-foreground">{guest.nationality || "N/A"}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-foreground font-mono text-xs">{guest.phone || "--"}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">{guest.totalStays} visitas</span>
                              {guest.lastStay && (
                                  <span className="text-[10px] text-muted-foreground">
                                      Últ: {format(new Date(guest.lastStay), "dd/MM/yy", { locale: es })}
                                    </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium border",
                                guest.status === "in-house"
                                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                                    : "bg-muted text-muted-foreground border-border",
                            )}>
                              {guest.status === "in-house" ? "Hospedado" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-card border-border" align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditGuest(guest); }}>
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border"/>
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteGuest(guest.id); }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4"/> Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                    )) : (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-muted-foreground">
                            No se encontraron huéspedes que coincidan con la búsqueda.
                          </td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>
            )}
          </div>
        </div>

        <GuestFormDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            onGuestSaved={handleGuestSaved}
            guestToEdit={selectedGuestDto}
        />
      </>
  )
}
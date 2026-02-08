"use client"

import { useEffect, useState, useMemo } from "react"
import {
  CheckCircle2,
  AlertCircle,
  Paintbrush,
  SprayCan,
  Lock,
  User,
  CalendarClock,
  Filter,
  Wrench
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { format, isSameDay, isWithinInterval, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import api from "@/lib/api"
import { toast } from "sonner"

// --- TYPES ---
import {
  Room,
  ReservationDto,
  BackendRoomStatus,
  VisualReservationStatus
} from "@/types"

// --- CONFIGURACIÓN VISUAL ACTUALIZADA ---
const housekeepingConfig: Record<string, any> = {
  // 0: Limpia
  Available: {
    label: "Limpia",
    color: "text-emerald-500",
    icon: CheckCircle2,
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20"
  },
  // 2: Sucia
  Dirty: {
    label: "Sucia",
    color: "text-red-500",
    icon: AlertCircle,
    bg: "bg-red-500/10",
    border: "border-red-500/20"
  },
  // 3: Mantenimiento (Aviso Operativo)
  Maintenance: {
    label: "Mantenimiento",
    color: "text-blue-500",
    icon: Wrench,
    bg: "bg-blue-500/10",
    border: "border-blue-500/20"
  },
  // 4: Retoque
  TouchUp: {
    label: "Retoque",
    color: "text-amber-500",
    icon: Paintbrush,
    bg: "bg-amber-500/10",
    border: "border-amber-500/20"
  },
  // 5: Bloqueada (Solo calendario)
  Blocked: {
    label: "Bloqueada",
    color: "text-gray-400",
    icon: Lock,
    bg: "bg-gray-400/10",
    border: "border-gray-400/20"
  },
  // 1: Ocupada
  Occupied: {
    label: "Ocupada",
    color: "text-purple-500",
    icon: User,
    bg: "bg-purple-500/10",
    border: "border-purple-500/20"
  },
}

const reservationStatusConfig: Record<string, any> = {
  check_in_paid: { label: "En Casa", color: "bg-green-600", border: "border-green-700" },
  check_in_debt: { label: "En Casa (Deuda)", color: "bg-red-600", border: "border-red-700" },
  confirmed_deposit: { label: "Reserva", color: "bg-blue-600", border: "border-blue-700" },
  confirmed_no_deposit: { label: "Reserva", color: "bg-orange-600", border: "border-orange-700" },
  blocked: { label: "Bloqueada", color: "bg-gray-600", border: "border-gray-700" },
  available: { label: "Disponible", color: "bg-card", border: "border-border" }
}

export function HabitacionesContent() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [reservations, setReservations] = useState<ReservationDto[]>([])
  const [loading, setLoading] = useState(true)

  const [filterHousekeeping, setFilterHousekeeping] = useState<string>("all")
  const [filterOccupancy, setFilterOccupancy] = useState<"all" | "occupied" | "available" | "blocked">("all")

  const today = new Date()

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [roomsRes, resRes] = await Promise.all([
          api.get<Room[]>('/rooms'),
          api.get<ReservationDto[]>('/reservations')
        ])

        // Ordenar habitaciones numéricamente
        const sortedRooms = roomsRes.data.sort((a, b) => a.number.localeCompare(b.number))
        setRooms(sortedRooms)
        setReservations(resRes.data)

      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Error al cargar datos del hotel")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // --- LÓGICA DE ESTADO VISUAL ---

  const getRoomVisuals = (room: Room) => {
    const reservation = reservations.find(r =>
        r.roomId === room.id &&
        isWithinInterval(today, { start: parseISO(r.startDate), end: parseISO(r.endDate) })
    )

    const isCheckInToday = reservation && isSameDay(today, parseISO(reservation.startDate))
    const isCheckOutToday = reservation && isSameDay(today, parseISO(reservation.endDate))

    let visualStatus: VisualReservationStatus = "available"

    if (reservation) {
      if (reservation.status === "CheckedIn") {
        visualStatus = "check_in_debt"
      } else if (reservation.status === "Confirmed") {
        visualStatus = "confirmed_deposit"
      } else if (reservation.status === "Pending") {
        visualStatus = "confirmed_no_deposit"
      }
    }
        // OJO: "Blocked" viene de calendario. "Maintenance" ya NO bloquea visualmente aquí,
    // se maneja como un estado de limpieza (housekeeping)
    else if (room.status === "Blocked") {
      visualStatus = "blocked"
    }

    // Alerta de venta: Disponible en sistema (sin reserva) pero sucia/mantenimiento/retoque
    const isSalesAlert = visualStatus === "available" &&
        (room.status === "Dirty" || room.status === "Maintenance" || room.status === "TouchUp")

    return { reservation, visualStatus, isCheckInToday, isCheckOutToday, isSalesAlert }
  }

  // --- FILTRADO ---
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const { visualStatus } = getRoomVisuals(room)

      if (filterHousekeeping !== "all" && room.status !== filterHousekeeping) return false

      if (filterOccupancy === "available" && visualStatus !== "available") return false
      if (filterOccupancy === "occupied" && (visualStatus === "available" || visualStatus === "blocked")) return false
      if (filterOccupancy === "blocked" && visualStatus !== "blocked") return false

      return true
    })
  }, [rooms, reservations, filterHousekeeping, filterOccupancy])

  // --- HANDLER DE CAMBIO DE ESTADO ---
  const handleStatusChange = async (roomId: string, newStatus: string) => {
    const previousRooms = [...rooms]
    // Actualización optimista
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus as any } : r))

    try {
      // Mapeo Enum Frontend -> Backend (Debe coincidir con Enums.cs)
      // Available=0, Occupied=1, Dirty=2, Maintenance=3, TouchUp=4, Blocked=5
      const statusMap: Record<string, number> = {
        "Available": 0,
        "Dirty": 2,
        "Maintenance": 3,
        "TouchUp": 4
      }
      const backendValue = statusMap[newStatus]

      if (backendValue === undefined) throw new Error("Estado no válido")

      await api.patch(`/rooms/${roomId}/status`, backendValue, {
        headers: { 'Content-Type': 'application/json' }
      })
      toast.success("Estado actualizado")
    } catch (error) {
      toast.error("Error al guardar estado")
      setRooms(previousRooms)
    }
  }

  const floors = [...new Set(rooms.map((r) => r.number.charAt(0)))].sort()

  if (loading) return <div className="p-10 text-center text-muted-foreground">Cargando Zafiro PMS...</div>

  return (
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-semibold text-3xl text-foreground">Control de Habitaciones</h1>
            <p className="text-muted-foreground">{format(today, "EEEE, d 'de' MMMM", { locale: es })}</p>
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">Sucias/Retoque</span>
              <span className="text-xl font-bold text-red-500">
                   {rooms.filter(r => r.status === 'Dirty' || r.status === 'TouchUp').length}
               </span>
            </div>
            <div className="h-10 w-px bg-border"></div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-muted-foreground">Disponibles (Límpias)</span>
              <span className="text-xl font-bold text-emerald-500">
                   {rooms.filter(r => r.status === 'Available').length}
               </span>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border bg-card">
          <Filter className="h-4 w-4 text-[#D4AF37] mr-2" />

          <Select value={filterOccupancy} onValueChange={(v: any) => setFilterOccupancy(v)}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Ocupación" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="available">Disponibles</SelectItem>
              <SelectItem value="occupied">Ocupadas</SelectItem>
              <SelectItem value="blocked">Bloqueadas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterHousekeeping} onValueChange={setFilterHousekeeping}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado Limpieza" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Available">Limpias</SelectItem>
              <SelectItem value="Dirty">Sucias</SelectItem>
              <SelectItem value="TouchUp">Retoque</SelectItem>
              <SelectItem value="Maintenance">Mantenimiento</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="ghost" onClick={() => {setFilterOccupancy("all"); setFilterHousekeeping("all")}}>
            Limpiar
          </Button>
        </div>

        {/* Grid */}
        {floors.map((floor) => {
          const floorRooms = filteredRooms.filter((r) => r.number.startsWith(floor))
          if (floorRooms.length === 0) return null

          return (
              <div key={floor} className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D4AF37] opacity-80 pl-1">
                  Piso {floor}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {floorRooms.map((room) => {
                    const { reservation, visualStatus, isCheckInToday, isCheckOutToday, isSalesAlert } = getRoomVisuals(room)

                    const hkConfig = housekeepingConfig[room.status] || housekeepingConfig.Available
                    const occConfig = reservationStatusConfig[visualStatus] || reservationStatusConfig.available
                    const HkIcon = hkConfig.icon

                    return (
                        <div key={room.id} className={cn(
                            "relative group rounded-xl border p-4 transition-all hover:shadow-lg flex flex-col justify-between min-h-[180px]",
                            isSalesAlert ? "border-red-500/50 bg-red-950/10" : "border-border bg-card hover:bg-accent/5"
                        )}>

                          {/* Top: Número y Estado Limpieza */}
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className="text-3xl font-bold tracking-tight">{room.number}</span>
                              <p className="text-xs text-muted-foreground mt-1">{room.category}</p>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className={cn("h-8 gap-2 border text-xs", hkConfig.color, hkConfig.bg, hkConfig.border)}>
                                  <HkIcon className="h-3.5 w-3.5" />
                                  {hkConfig.label}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuLabel>Cambiar estado</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleStatusChange(room.id, "Available")}>
                                  <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2" /> Limpia
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleStatusChange(room.id, "TouchUp")}>
                                  <div className="h-2 w-2 rounded-full bg-amber-500 mr-2" /> Retoque
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleStatusChange(room.id, "Dirty")}>
                                  <div className="h-2 w-2 rounded-full bg-red-500 mr-2" /> Sucia
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => handleStatusChange(room.id, "Maintenance")}>
                                  <div className="h-2 w-2 rounded-full bg-blue-500 mr-2" /> Mantenimiento
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Bottom: Estado Reserva */}
                          <div className="space-y-3">
                            {visualStatus === "available" ? (
                                <div className="p-3 rounded-lg border border-dashed flex items-center justify-center gap-2 text-muted-foreground">
                                  <CheckCircle2 className="h-4 w-4" /> <span className="text-sm">Disponible</span>
                                </div>
                            ) : (
                                <div className={cn("p-3 rounded-lg border text-white relative overflow-hidden", occConfig.color, occConfig.border)}>
                                  {isCheckInToday && <Badge className="absolute top-0 right-0 rounded-none bg-card text-foreground text-[9px]">LLEGADA</Badge>}
                                  {isCheckOutToday && <Badge className="absolute top-0 right-0 rounded-none bg-black/50 text-white text-[9px]">SALIDA</Badge>}

                                  <div className="flex items-center gap-2 mb-1">
                                    {visualStatus === "blocked" ? <Lock className="h-4 w-4"/> : <User className="h-4 w-4"/>}
                                    <span className="font-bold text-sm truncate">{reservation?.mainGuestName || "Bloqueada"}</span>
                                  </div>

                                  {reservation && (
                                      <div className="flex items-center gap-1 text-[10px] opacity-90 mt-2">
                                        <CalendarClock className="h-3 w-3" />
                                        <span>Salida: {format(parseISO(reservation.endDate), "dd MMM")}</span>
                                      </div>
                                  )}
                                </div>
                            )}

                            {isSalesAlert && (
                                <div className="flex items-center gap-2 text-red-500 text-xs font-medium animate-pulse">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>
                                      {room.status === "Maintenance" ? "Requiere Mantenimiento" : "Requiere Limpieza"}
                                  </span>
                                </div>
                            )}
                          </div>

                        </div>
                    )
                  })}
                </div>
              </div>
          )
        })}
      </div>
  )
}
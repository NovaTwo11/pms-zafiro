"use client"

import { useState, useMemo } from "react"
import {
  CheckCircle2,
  AlertCircle,
  Paintbrush,
  SprayCan,
  Lock,
  User,
  CalendarClock,
  LogOut,
  LogIn,
  MoreVertical,
  Filter
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
import { format, isSameDay, isWithinInterval } from "date-fns"
import { es } from "date-fns/locale"

// --- TYPES & DATA (Simulando conexión con DB/Cronograma) ---

type RoomCategory = "Estándar" | "Superior" | "Deluxe" | "Suite" | "Suite Junior" | "Suite Presidencial"

// Estado Secundario: Limpieza (Manual)
type HousekeepingStatus = "clean" | "dirty" | "touchup" | "pending"

// Estado de Reserva (Traído del Cronograma)
type ReservationStatus =
    | "check_in_paid"
    | "check_in_debt"
    | "confirmed_deposit"
    | "confirmed_no_deposit"
    | "blocked"

type Room = {
  id: string
  number: string
  floor: number
  category: RoomCategory
  housekeeping: HousekeepingStatus
}

// Datos de Habitaciones (Estructura Base)
const initialRooms: Room[] = [
  // Piso 1
  { id: "101", number: "101", floor: 1, category: "Estándar", housekeeping: "clean" },
  { id: "102", number: "102", floor: 1, category: "Estándar", housekeeping: "dirty" }, // Ocupada con deuda
  { id: "103", number: "103", floor: 1, category: "Superior", housekeeping: "clean" },
  { id: "104", number: "104", floor: 1, category: "Superior", housekeeping: "pending" }, // Bloqueada
  { id: "105", number: "105", floor: 1, category: "Suite", housekeeping: "clean" },
  // Piso 2
  { id: "201", number: "201", floor: 2, category: "Estándar", housekeeping: "touchup" },
  { id: "202", number: "202", floor: 2, category: "Estándar", housekeeping: "clean" },
  { id: "203", number: "203", floor: 2, category: "Superior", housekeeping: "dirty" },
  { id: "204", number: "204", floor: 2, category: "Superior", housekeeping: "clean" },
  { id: "205", number: "205", floor: 2, category: "Suite", housekeeping: "clean" },
  // Piso 3
  { id: "301", number: "301", floor: 3, category: "Estándar", housekeeping: "dirty" },
  { id: "302", number: "302", floor: 3, category: "Estándar", housekeeping: "clean" },
  { id: "303", number: "303", floor: 3, category: "Superior", housekeeping: "clean" },
  { id: "304", number: "304", floor: 3, category: "Suite Junior", housekeeping: "clean" },
  { id: "305", number: "305", floor: 3, category: "Suite Presidencial", housekeeping: "clean" },
]

// Datos de Reservas (Simulando conexión viva con el Cronograma)
const activeReservations = [
  {
    roomId: "101",
    guestName: "García",
    startDate: new Date(2026, 0, 3),
    endDate: new Date(2026, 0, 7),
    status: "check_in_paid" as ReservationStatus,
  },
  {
    roomId: "102",
    guestName: "Martínez",
    startDate: new Date(2026, 0, 5),
    endDate: new Date(2026, 0, 9),
    status: "check_in_debt" as ReservationStatus,
  },
  {
    roomId: "203",
    guestName: "Hernández", // Check-out hoy (ejemplo)
    startDate: new Date(2026, 0, 1),
    endDate: new Date(), // Simula que sale hoy
    status: "check_in_paid" as ReservationStatus,
  },
  {
    roomId: "104",
    guestName: "MANTENIMIENTO",
    startDate: new Date(2026, 0, 4),
    endDate: new Date(2026, 0, 8),
    status: "blocked" as ReservationStatus,
  },
  {
    roomId: "305",
    guestName: "Rodríguez", // Check-in hoy (ejemplo)
    startDate: new Date(), // Simula que entra hoy
    endDate: new Date(2026, 1, 10),
    status: "confirmed_deposit" as ReservationStatus,
  },
]

// --- CONFIGURACIÓN VISUAL ---

const housekeepingConfig = {
  clean: {
    label: "Limpia",
    color: "text-emerald-500",
    icon: CheckCircle2,
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20"
  },
  dirty: {
    label: "Sucia",
    color: "text-red-500",
    icon: AlertCircle,
    bg: "bg-red-500/10",
    border: "border-red-500/20"
  },
  touchup: {
    label: "Repaso",
    color: "text-amber-500",
    icon: Paintbrush, // <--- CAMBIO AQUÍ
    bg: "bg-amber-500/10",
    border: "border-amber-500/20"
  },
  pending: {
    label: "Pendiente",
    color: "text-blue-400",
    icon: SprayCan,
    bg: "bg-blue-400/10",
    border: "border-blue-400/20"
  },
}

const reservationStatusConfig = {
  check_in_paid: { label: "En Casa (Al día)", color: "bg-green-600", border: "border-green-700" },
  check_in_debt: { label: "En Casa (Deuda)", color: "bg-red-600", border: "border-red-700" },
  confirmed_deposit: { label: "Reserva (Abono)", color: "bg-blue-600", border: "border-blue-700" },
  confirmed_no_deposit: { label: "Reserva (Sin Abono)", color: "bg-orange-600", border: "border-orange-700" },
  blocked: { label: "Bloqueada", color: "bg-gray-600", border: "border-gray-700" },
  available: { label: "Disponible", color: "bg-[#1A1A1A]", border: "border-[#333333]" }
}

export function HabitacionesContent() {
  const [rooms, setRooms] = useState<Room[]>(initialRooms)
  const [filterHousekeeping, setFilterHousekeeping] = useState<HousekeepingStatus | "all">("all")
  const [filterOccupancy, setFilterOccupancy] = useState<"all" | "occupied" | "available" | "blocked">("all")

  // Fecha actual para simulación (Usar new Date() en prod)
  // Fijamos una fecha que coincida con los datos 'mock' para la demo, o usamos hoy.
  const today = new Date(2026, 0, 5) // Ajustado para coincidir con tus datos de ejemplo

  // --- LÓGICA DE ESTADO DERIVADO ---

  const getRoomState = (room: Room) => {
    // Buscar si hay reserva activa HOY
    const reservation = activeReservations.find(r =>
        r.roomId === room.id &&
        isWithinInterval(today, { start: r.startDate, end: r.endDate })
    )

    const isCheckInToday = reservation && isSameDay(today, reservation.startDate)
    const isCheckOutToday = reservation && isSameDay(today, reservation.endDate)

    // Determinar estado primario
    let primaryStatus: "available" | ReservationStatus = "available"

    if (reservation) {
      primaryStatus = reservation.status
    }

    // Alerta de venta: Disponible pero sucia
    const isSalesAlert = primaryStatus === "available" && (room.housekeeping === "dirty" || room.housekeeping === "touchup")

    return {
      reservation,
      primaryStatus,
      isCheckInToday,
      isCheckOutToday,
      isSalesAlert
    }
  }

  // --- FILTRADO ---

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const { primaryStatus } = getRoomState(room)

      // Filtro Limpieza
      if (filterHousekeeping !== "all" && room.housekeeping !== filterHousekeeping) return false

      // Filtro Ocupación (Simplificado)
      if (filterOccupancy === "occupied" && (primaryStatus === "available" || primaryStatus === "blocked")) return false
      if (filterOccupancy === "available" && primaryStatus !== "available") return false
      if (filterOccupancy === "blocked" && primaryStatus !== "blocked") return false

      return true
    })
  }, [rooms, filterHousekeeping, filterOccupancy])

  // --- HANDLERS ---

  const handleStatusChange = (roomId: string, newStatus: HousekeepingStatus) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, housekeeping: newStatus } : r))
  }

  const floors = [...new Set(initialRooms.map((r) => r.floor))].sort()

  return (
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-[#E5E5E5]">
              Control de Habitaciones
            </h1>
            <p className="text-[#A3A3A3]">
              {format(today, "EEEE, d 'de' MMMM", { locale: es })} — Vista operativa en tiempo real
            </p>
          </div>

          {/* KPI Rápidos */}
          <div className="flex gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs text-[#A3A3A3]">Sucias</span>
              <span className="text-xl font-bold text-red-500">{rooms.filter(r => r.housekeeping === 'dirty').length}</span>
            </div>
            <div className="h-10 w-px bg-[#333333]"></div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-[#A3A3A3]">Disponibles</span>
              <span className="text-xl font-bold text-emerald-500">
                    {rooms.filter(r => !activeReservations.some(res => res.roomId === r.id && isWithinInterval(today, { start: res.startDate, end: res.endDate }))).length}
                </span>
            </div>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-[#333333] bg-[#1A1A1A]">
          <Filter className="h-4 w-4 text-[#D4AF37] mr-2" />

          <Select value={filterOccupancy} onValueChange={(v: any) => setFilterOccupancy(v)}>
            <SelectTrigger className="w-[180px] bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]">
              <SelectValue placeholder="Estado Ocupación" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]">
              <SelectItem value="all">Todas las Ocupaciones</SelectItem>
              <SelectItem value="available">Disponibles</SelectItem>
              <SelectItem value="occupied">Ocupadas / Reservadas</SelectItem>
              <SelectItem value="blocked">Bloqueadas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterHousekeeping} onValueChange={(v: any) => setFilterHousekeeping(v)}>
            <SelectTrigger className="w-[180px] bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]">
              <SelectValue placeholder="Estado Limpieza" />
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]">
              <SelectItem value="all">Todas las Limpiezas</SelectItem>
              <SelectItem value="clean">Limpias</SelectItem>
              <SelectItem value="dirty">Sucias</SelectItem>
              <SelectItem value="touchup">Repaso</SelectItem>
            </SelectContent>
          </Select>

          <Button
              variant="ghost"
              className="ml-auto text-[#D4AF37] hover:bg-[#D4AF37]/10"
              onClick={() => {setFilterOccupancy("all"); setFilterHousekeeping("all")}}
          >
            Limpiar Filtros
          </Button>
        </div>

        {/* Grid de Habitaciones */}
        {floors.map((floor) => {
          const floorRooms = filteredRooms.filter((r) => r.floor === floor)
          if (floorRooms.length === 0) return null

          return (
              <div key={floor} className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D4AF37] opacity-80 pl-1">
                  Piso {floor}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {floorRooms.map((room) => {
                    const { reservation, primaryStatus, isCheckInToday, isCheckOutToday, isSalesAlert } = getRoomState(room)
                    const hkConfig = housekeepingConfig[room.housekeeping]
                    const occConfig = primaryStatus !== "available" ? reservationStatusConfig[primaryStatus] : reservationStatusConfig.available
                    const HkIcon = hkConfig.icon

                    return (
                        <div
                            key={room.id}
                            className={cn(
                                "relative group rounded-xl border p-4 transition-all duration-300 hover:shadow-lg flex flex-col justify-between min-h-[180px]",
                                isSalesAlert ? "border-red-500/50 bg-red-950/10" : "border-[#333333] bg-[#1A1A1A] hover:bg-[#202020]"
                            )}
                        >
                          {/* Header Tarjeta: Número y Estado Limpieza */}
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <span className="text-3xl font-bold text-[#E5E5E5] tracking-tight">{room.number}</span>
                              <p className="text-xs text-[#A3A3A3] font-medium mt-1">{room.category}</p>
                            </div>

                            {/* Control de Limpieza (Estado Secundario) */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        "h-8 gap-2 border text-xs font-medium transition-colors",
                                        hkConfig.bg, hkConfig.border, hkConfig.color
                                    )}
                                >
                                  <HkIcon className="h-3.5 w-3.5" />
                                  {hkConfig.label}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-[#1A1A1A] border-[#333333]">
                                <DropdownMenuLabel className="text-[#A3A3A3]">Cambiar estado limpieza</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-[#333333]" />
                                {(Object.keys(housekeepingConfig) as HousekeepingStatus[]).map((status) => (
                                    <DropdownMenuItem
                                        key={status}
                                        onClick={() => handleStatusChange(room.id, status)}
                                        className="text-[#E5E5E5] focus:bg-[#252525] cursor-pointer gap-2"
                                    >
                                      <div className={cn("h-2 w-2 rounded-full", housekeepingConfig[status].color.replace('text-', 'bg-'))} />
                                      {housekeepingConfig[status].label}
                                    </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Cuerpo: Estado Primario (Ocupación) */}
                          <div className="space-y-3">
                            {primaryStatus === "available" ? (
                                <div className="p-3 rounded-lg bg-[#0F0F0F] border border-[#333333] border-dashed flex items-center justify-center gap-2 text-[#666666]">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span className="text-sm">Disponible</span>
                                </div>
                            ) : (
                                <div className={cn(
                                    "p-3 rounded-lg border text-white relative overflow-hidden",
                                    occConfig.color, occConfig.border
                                )}>
                                  {/* Indicadores de Flujo */}
                                  {isCheckInToday && (
                                      <Badge className="absolute top-0 right-0 rounded-none rounded-bl-lg bg-white/90 text-black text-[9px] font-bold px-1.5 h-4 hover:bg-white">
                                        LLEGADA
                                      </Badge>
                                  )}
                                  {isCheckOutToday && (
                                      <Badge className="absolute top-0 right-0 rounded-none rounded-bl-lg bg-black/50 text-white text-[9px] font-bold px-1.5 h-4 hover:bg-black/70">
                                        SALIDA
                                      </Badge>
                                  )}

                                  <div className="flex items-center gap-2 mb-1">
                                    {primaryStatus === "blocked" ? <Lock className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                    <span className="font-bold text-sm truncate w-[90%]">
                                        {reservation?.guestName}
                                    </span>
                                  </div>

                                  {primaryStatus !== "blocked" && (
                                      <div className="flex items-center justify-between text-[10px] opacity-90 mt-2">
                                        <div className="flex items-center gap-1">
                                          <CalendarClock className="h-3 w-3" />
                                          <span>Salida: {reservation ? format(reservation.endDate, "dd MMM") : "-"}</span>
                                        </div>
                                      </div>
                                  )}
                                </div>
                            )}

                            {/* Alerta de Operatividad (Bonus) */}
                            {isSalesAlert && (
                                <div className="flex items-center gap-2 text-red-500 text-xs font-medium animate-pulse">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>No vender: Requiere limpieza</span>
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
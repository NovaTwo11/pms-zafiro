"use client"

import { useState, useRef, useMemo } from "react"
import { addDays, format, startOfWeek, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { es } from "date-fns/locale"
import { CheckinWizard } from "@/components/checkin-wizard"
import { ChevronLeft, ChevronRight, Plus, Lock, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ReservationPopover } from "./reservation-popover"
import { NewReservationModal } from "./new-reservation-modal"
import { RateModifierModal } from "./rate-modifier-modal"
import { cn } from "@/lib/utils"

// --- TYPES ---
type ViewMode = "day" | "week" | "month"
type RoomCategory = "Estándar" | "Superior" | "Deluxe" | "Suite" | "Suite Junior" | "Suite Presidencial"

type ReservationStatus =
    | "check_in_paid"
    | "check_in_debt"
    | "confirmed_deposit"
    | "confirmed_no_deposit"
    | "blocked"

export type ReservationSegment = {
  roomId: string
  startDate: Date
  endDate: Date
}

export type Reservation = {
  id: string
  guestName: string
  guestId?: string
  segments: ReservationSegment[]
  status: ReservationStatus
  totalValue: number
  paidAmount: number
  checkInTime?: Date
}

type Room = {
  id: string
  number: string
  category: RoomCategory
  basePrice: number
}

type Floor = {
  name: string
  rooms: Room[]
}

// --- DATA SIMULADA ROBUSTA (Contexto: Feb 2026) ---
const floors: Floor[] = [
  {
    name: "Piso 1",
    rooms: [
      { id: "101", number: "101", category: "Estándar", basePrice: 150000 },
      { id: "102", number: "102", category: "Estándar", basePrice: 150000 },
      { id: "103", number: "103", category: "Superior", basePrice: 220000 },
      { id: "104", number: "104", category: "Superior", basePrice: 220000 },
      { id: "105", number: "105", category: "Suite", basePrice: 350000 },
    ],
  },
  {
    name: "Piso 2",
    rooms: [
      { id: "201", number: "201", category: "Estándar", basePrice: 150000 },
      { id: "202", number: "202", category: "Estándar", basePrice: 150000 },
      { id: "203", number: "203", category: "Superior", basePrice: 220000 },
      { id: "204", number: "204", category: "Superior", basePrice: 220000 },
      { id: "205", number: "205", category: "Suite", basePrice: 350000 },
    ],
  },
  {
    name: "Piso 3",
    rooms: [
      { id: "301", number: "301", category: "Estándar", basePrice: 160000 },
      { id: "302", number: "302", category: "Estándar", basePrice: 160000 },
      { id: "303", number: "303", category: "Superior", basePrice: 240000 },
      { id: "304", number: "304", category: "Suite Junior", basePrice: 400000 },
      { id: "305", number: "305", category: "Suite Presidencial", basePrice: 800000 },
    ],
  },
]

// "Quemando" datos para Febrero 2026
const initialReservations: Reservation[] = [
  // --- PASADAS ---
  {
    id: "hist1",
    guestName: "Juan Pérez",
    segments: [{ roomId: "101", startDate: new Date(2026, 0, 28), endDate: new Date(2026, 1, 2) }],
    status: "check_in_paid",
    totalValue: 750000,
    paidAmount: 750000,
  },
  {
    id: "hist2",
    guestName: "Ana Solís",
    segments: [{ roomId: "203", startDate: new Date(2026, 1, 1), endDate: new Date(2026, 1, 4) }],
    status: "check_in_paid",
    totalValue: 660000,
    paidAmount: 660000,
  },
  // --- ACTUALES ---
  {
    id: "curr1",
    guestName: "Carlos Ruiz",
    segments: [{ roomId: "102", startDate: new Date(2026, 1, 5), endDate: new Date(2026, 1, 10) }],
    status: "check_in_debt",
    totalValue: 750000,
    paidAmount: 300000,
  },
  {
    id: "curr2",
    guestName: "Familia Gómez",
    segments: [{ roomId: "105", startDate: new Date(2026, 1, 6), endDate: new Date(2026, 1, 9) }],
    status: "check_in_paid",
    totalValue: 1050000,
    paidAmount: 1050000,
  },
  {
    id: "curr3",
    guestName: "Lucía Méndez",
    segments: [{ roomId: "201", startDate: new Date(2026, 1, 4), endDate: new Date(2026, 1, 8) }],
    status: "check_in_paid",
    totalValue: 600000,
    paidAmount: 600000,
  },
  {
    id: "curr4",
    guestName: "Grupo Empresarial",
    segments: [{ roomId: "304", startDate: new Date(2026, 1, 7), endDate: new Date(2026, 1, 12) }],
    status: "check_in_debt",
    totalValue: 2000000,
    paidAmount: 0,
  },
  // --- PRÓXIMAS ---
  {
    id: "fut1",
    guestName: "Roberto Díaz",
    segments: [{ roomId: "101", startDate: new Date(2026, 1, 12), endDate: new Date(2026, 1, 15) }],
    status: "confirmed_deposit",
    totalValue: 450000,
    paidAmount: 200000,
  },
  {
    id: "fut2",
    guestName: "María Torres",
    segments: [{ roomId: "103", startDate: new Date(2026, 1, 14), endDate: new Date(2026, 1, 18) }],
    status: "confirmed_no_deposit",
    totalValue: 880000,
    paidAmount: 0,
  },
  {
    id: "fut3",
    guestName: "Boda Martinez",
    segments: [
      { roomId: "305", startDate: new Date(2026, 1, 20), endDate: new Date(2026, 1, 25) }
    ],
    status: "confirmed_deposit",
    totalValue: 4000000,
    paidAmount: 1500000,
  },
  // --- BLOQUEOS ---
  {
    id: "blk1",
    guestName: "MANTENIMIENTO TV",
    segments: [{ roomId: "104", startDate: new Date(2026, 1, 6), endDate: new Date(2026, 1, 8) }],
    status: "blocked",
    totalValue: 0,
    paidAmount: 0,
  },
  {
    id: "blk2",
    guestName: "PINTURA",
    segments: [{ roomId: "202", startDate: new Date(2026, 1, 10), endDate: new Date(2026, 1, 15) }],
    status: "blocked",
    totalValue: 0,
    paidAmount: 0,
  },
]

// --- UTILIDADES VISUALES ---
const formatPriceShort = (price: number) => {
  if (price >= 1000000) return `${(price / 1000000).toFixed(1).replace(/\.0$/, '')}M`
  if (price >= 1000) return `${(price / 1000).toFixed(0)}k`
  return price.toString()
}

// CORREGIDO: Estilos adaptativos (Light/Dark)
const getStatusStyles = (status: ReservationStatus) => {
  switch (status) {
    case "check_in_paid":
      return "bg-emerald-100 text-emerald-800 border-l-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-100 dark:border-l-emerald-500 border-l-4 hover:bg-emerald-200 dark:hover:bg-emerald-500/25 ring-1 ring-emerald-500/20"
    case "check_in_debt":
      return "bg-rose-100 text-rose-800 border-l-rose-600 dark:bg-rose-500/15 dark:text-rose-100 dark:border-l-rose-500 border-l-4 hover:bg-rose-200 dark:hover:bg-rose-500/25 ring-1 ring-rose-500/20"
    case "confirmed_deposit":
      return "bg-blue-100 text-blue-800 border-l-blue-600 dark:bg-blue-500/15 dark:text-blue-100 dark:border-l-blue-500 border-l-4 hover:bg-blue-200 dark:hover:bg-blue-500/25 ring-1 ring-blue-500/20"
    case "confirmed_no_deposit":
      return "bg-orange-100 text-orange-800 border-l-orange-600 dark:bg-orange-500/15 dark:text-orange-100 dark:border-l-orange-500 border-l-4 hover:bg-orange-200 dark:hover:bg-orange-500/25 ring-1 ring-orange-500/20"
    case "blocked":
      return "bg-gray-200 text-gray-600 border-l-gray-500 dark:bg-gray-700/40 dark:text-gray-400 dark:border-l-gray-500 border-l-4 hover:bg-gray-300 dark:hover:bg-gray-600/50 grayscale pattern-diagonal-lines"
    default:
      return "bg-gray-500"
  }
}

// CORREGIDO: Colores de categoría legibles
const getCategoryColor = (category: RoomCategory) => {
  switch (category) {
    case "Estándar": return "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:border-blue-400/20 dark:bg-blue-400/5"
    case "Superior": return "text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:border-purple-400/20 dark:bg-purple-400/5"
    case "Deluxe": return "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:border-amber-400/20 dark:bg-amber-400/5"
    case "Suite":
    case "Suite Junior":
    case "Suite Presidencial": return "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:border-rose-400/20 dark:bg-rose-400/5"
    default: return "text-gray-400"
  }
}

export function CronogramaContent() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations)

  const [draggedSegment, setDraggedSegment] = useState<{
    reservationId: string
    segmentIndex: number
    originalRoomId: string
  } | null>(null)

  const [customPrices, setCustomPrices] = useState<Record<string, number>>({})
  const [checkinWizardData, setCheckinWizardData] = useState<{ isOpen: boolean; reservation: Reservation | null } | null>(null)
  const [newReservationModal, setNewReservationModal] = useState<{ isOpen: boolean; roomId: string; date: Date; type: "reservation" | "block" } | null>(null)
  const [rateModalOpen, setRateModalOpen] = useState(false)

  const gridRef = useRef<HTMLDivElement>(null)

  const getRoomPrice = (room: Room, date: Date) => {
    const key = `${room.id}-${format(date, "yyyy-MM-dd")}`
    return customPrices[key] || room.basePrice
  }

  const handleSaveRates = (scope: string, start: Date, end: Date, newPrice: number) => {
    const daysInterval = eachDayOfInterval({ start, end })
    const newCustomPrices = { ...customPrices }
    floors.forEach(floor => {
      floor.rooms.forEach(room => {
        if (scope === "ALL" || room.category === scope || room.id === scope) {
          daysInterval.forEach(day => {
            newCustomPrices[`${room.id}-${format(day, "yyyy-MM-dd")}`] = newPrice
          })
        }
      })
    })
    setCustomPrices(newCustomPrices)
  }

  const handleDragStart = (reservationId: string, segmentIndex: number, originalRoomId: string) => {
    setDraggedSegment({ reservationId, segmentIndex, originalRoomId })
  }

  const handleDrop = (targetRoomId: string) => {
    if (!draggedSegment) return
    setReservations((prev) =>
        prev.map((res) => {
          if (res.id === draggedSegment.reservationId) {
            const newSegments = [...res.segments]
            newSegments[draggedSegment.segmentIndex] = {
              ...newSegments[draggedSegment.segmentIndex],
              roomId: targetRoomId,
            }
            return { ...res, segments: newSegments }
          }
          return res
        })
    )
    setDraggedSegment(null)
  }

  const days = useMemo(() => {
    if (viewMode === "day") return [currentDate]
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      return Array.from({ length: 7 }, (_, i) => addDays(start, i))
    }
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }, [currentDate, viewMode])

  const navigatePrevious = () => setCurrentDate((d) => addDays(d, viewMode === "day" ? -1 : viewMode === "week" ? -7 : -30))
  const navigateNext = () => setCurrentDate((d) => addDays(d, viewMode === "day" ? 1 : viewMode === "week" ? 7 : 30))
  const goToToday = () => setCurrentDate(new Date())

  const getReservationStyle = (startDate: Date, endDate: Date) => {
    const startIndex = days.findIndex((d) => isSameDay(d, startDate))
    const endIndexRaw = days.findIndex((d) => isSameDay(d, endDate))
    const endIndex = endIndexRaw === -1 && endDate > days[days.length - 1] ? days.length : endIndexRaw

    if (endDate <= days[0] || startDate > days[days.length - 1]) return { width: 0, left: 0, isHidden: true }

    const actualStart = startIndex >= 0 ? startIndex : 0
    const actualEnd = endIndex >= 0 ? endIndex : days.length
    const width = Math.max(1, actualEnd - actualStart)

    return { width, left: actualStart, isHidden: false }
  }

  const handleCheckIn = (reservationId: string) => {
    const res = reservations.find(r => r.id === reservationId)
    if (res) {
      setCheckinWizardData({ isOpen: true, reservation: res })
      setSelectedReservation(null)
    }
  }

  const handleCompleteCheckIn = (data: any) => {
    if (!checkinWizardData?.reservation) return
    setReservations(prev => prev.map(r => r.id === checkinWizardData.reservation!.id ? { ...r, status: "check_in_paid", checkInTime: new Date() } : r))
    setCheckinWizardData(null)
  }

  return (
      // CORREGIDO: bg-background y text-foreground
      <div className="space-y-4 h-full flex flex-col bg-background text-foreground p-2">

        {/* HEADER PRINCIPAL */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Cronograma</h1>
            <p className="text-xs text-muted-foreground">Gestión de ocupación y tarifas</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                // CORREGIDO: colores de borde y hover
                className="border-input bg-background text-foreground hover:bg-accent hover:text-amber-600 dark:hover:text-[#D4AF37] transition-colors"
                onClick={() => setRateModalOpen(true)}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Tarifas
            </Button>

            <div className="flex items-center rounded-lg border border-input bg-card p-1">
              {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                  <Button
                      key={mode}
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode(mode)}
                      className={cn(
                          "h-7 px-3 text-xs capitalize transition-all",
                          viewMode === mode
                              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                      )}
                  >
                    {mode === "day" ? "Día" : mode === "week" ? "Semana" : "Mes"}
                  </Button>
              ))}
            </div>

            <Button
                size="sm"
                onClick={() => setNewReservationModal({ isOpen: true, roomId: "", date: currentDate, type: "reservation" })}
                // CORREGIDO: Hover dorado legible
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              <Plus className="h-4 w-4 mr-1" /> Crear
            </Button>
          </div>
        </div>

        {/* NAVEGACIÓN DE FECHAS */}
        {/* CORREGIDO: Clases semánticas */}
        <div className="flex items-center justify-between shrink-0 bg-card p-2 rounded-md border border-border">
          <Button variant="ghost" size="icon" onClick={navigatePrevious} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-bold text-foreground capitalize tracking-wide">
            {format(currentDate, "MMMM yyyy", { locale: es })}
        </span>
          <Button variant="ghost" size="icon" onClick={navigateNext} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="link" size="sm" onClick={goToToday} className="text-amber-600 dark:text-[#D4AF37] text-xs h-8 ml-2">
            Hoy
          </Button>
        </div>

        {/* GRID DE RESERVAS */}
        {/* CORREGIDO: bg-background y border-border */}
        <div className="rounded-lg border border-border bg-background flex-1 flex flex-col overflow-hidden shadow-sm relative">
          <div ref={gridRef} className="flex-1 overflow-auto custom-scrollbar">
            <div className="min-w-max">

              {/* HEADER DE DÍAS */}
              <div className="flex sticky top-0 z-20 bg-card shadow-sm border-b border-border">
                <div className="w-[180px] shrink-0 border-r border-border bg-card p-3 sticky left-0 z-30 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Habitación</span>
                  <span className="text-[10px] text-muted-foreground font-mono">Tarifa Hoy</span>
                </div>
                <div className="flex">
                  {days.map((day, idx) => {
                    const isCurrent = isToday(day)
                    return (
                        <div
                            key={idx}
                            className={cn(
                                "min-w-[48px] w-12 border-r border-border/60 py-2 text-center flex flex-col justify-center relative group",
                                isCurrent && "bg-primary/5"
                            )}
                        >
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">{format(day, "EEE", { locale: es })}</span>
                          <span className={cn("text-sm font-bold", isCurrent ? "text-amber-600 dark:text-[#D4AF37]" : "text-foreground")}>
                        {format(day, "d")}
                      </span>
                          <div className="mt-1 h-[2px] w-3 mx-auto bg-border group-hover:bg-primary transition-colors rounded-full" />
                        </div>
                    )
                  })}
                </div>
              </div>

              {/* FILAS DE HABITACIONES */}
              <div className="pb-4">
                {floors.map((floor) => (
                    <div key={floor.name}>
                      {/* Nombre Piso */}
                      <div className="sticky left-0 w-full bg-secondary/80 dark:bg-muted/50 backdrop-blur-sm border-y border-border px-4 py-1 z-10">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-[#D4AF37]">{floor.name}</span>
                      </div>

                      {floor.rooms.map((room) => {
                        const todayPrice = getRoomPrice(room, new Date())

                        const roomSegments = reservations.flatMap(res =>
                            res.segments.map((seg, idx) => ({ reservation: res, segment: seg, idx })).filter(item => item.segment.roomId === room.id)
                        )

                        return (
                            <div
                                key={room.id}
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("bg-primary/10") }}
                                onDragLeave={(e) => { e.currentTarget.classList.remove("bg-primary/10") }}
                                onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("bg-primary/10"); handleDrop(room.id) }}
                                // CORREGIDO: Bordes y Hover
                                className="flex border-b border-border/50 h-[72px] relative hover:bg-accent/30 group transition-colors"
                            >

                              {/* COLUMNA INFO HABITACIÓN */}
                              <div className="w-[180px] shrink-0 border-r border-border px-4 flex flex-col justify-center sticky left-0 z-10 bg-background group-hover:bg-card transition-colors">
                                <div className="flex items-center justify-between w-full mb-1">
                                  <span className="text-xl font-bold text-foreground">{room.number}</span>
                                  <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 rounded-sm", getCategoryColor(room.category))}>
                                    {room.category}
                                  </Badge>
                                </div>
                                <div
                                    className="flex items-center gap-1.5 cursor-pointer hover:bg-accent rounded px-1 -ml-1 py-0.5 transition-colors w-fit"
                                    onClick={() => alert(`Gestionar tarifa habitación ${room.number}`)}
                                >
                                  <span className="text-[10px] text-muted-foreground">Hoy:</span>
                                  <span className="text-xs font-medium text-amber-600 dark:text-[#D4AF37]">${formatPriceShort(todayPrice)}</span>
                                </div>
                              </div>

                              {/* CELDAS */}
                              <div className="flex relative">
                                {days.map((day, idx) => (
                                    <div
                                        key={idx}
                                        title={`Precio: $${getRoomPrice(room, day)}`}
                                        onClick={() => setNewReservationModal({ isOpen: true, roomId: room.id, date: day, type: "reservation" })}
                                        className={cn(
                                            "min-w-[48px] w-12 border-r border-border/30 cursor-pointer transition-all hover:bg-accent/50 flex items-end justify-center pb-1",
                                            isToday(day) && "bg-primary/5"
                                        )}
                                    >
                                <span className="text-[8px] text-muted-foreground opacity-0 group-hover:opacity-100 select-none transition-opacity">
                                    {formatPriceShort(getRoomPrice(room, day))}
                                </span>
                                    </div>
                                ))}

                                {/* BARRAS DE RESERVA */}
                                {roomSegments.map(({ reservation, segment, idx }) => {
                                  const style = getReservationStyle(segment.startDate, segment.endDate)
                                  if (style.isHidden) return null;

                                  return (
                                      <ReservationPopover
                                          key={`${reservation.id}-${idx}`}
                                          reservation={reservation}
                                          segment={segment}
                                          segmentIndex={idx}
                                          isOpen={selectedReservation === `${reservation.id}-${idx}`}
                                          onOpenChange={(open) => setSelectedReservation(open ? `${reservation.id}-${idx}` : null)}
                                          onCheckIn={() => handleCheckIn(reservation.id)}
                                          onCheckOut={() => {}}
                                          onCancel={() => {}}
                                      >
                                        <div
                                            draggable
                                            onDragStart={() => handleDragStart(reservation.id, idx, segment.roomId)}
                                            className={cn(
                                                "absolute top-0 bottom-0 m-auto h-[90%] rounded-md shadow-sm text-[10px] font-medium flex flex-col justify-center px-2 cursor-grab active:cursor-grabbing transition-all z-10 hover:z-20 hover:scale-[1.02] hover:shadow-md backdrop-blur-sm overflow-hidden whitespace-nowrap",
                                                getStatusStyles(reservation.status)
                                            )}
                                            style={{
                                              left: `${style.left * 48}px`,
                                              width: `${style.width * 48}px`,
                                            }}
                                        >
                                          <div className="flex items-center gap-1.5 font-bold tracking-tight opacity-95">
                                            {reservation.status === "blocked" ? (
                                                <><Lock className="h-3 w-3" /> <span>BLOQUEO</span></>
                                            ) : (
                                                <span>{reservation.guestName}</span>
                                            )}
                                          </div>

                                          {style.width > 1 && reservation.status !== "blocked" && (
                                              <div className="flex items-center justify-between opacity-85 mt-0.5 text-[9px] font-normal">
                                      <span>
                                        {reservation.paidAmount >= reservation.totalValue
                                            ? "Pagado"
                                            : `Deb: $${formatPriceShort(reservation.totalValue - reservation.paidAmount)}`}
                                      </span>
                                              </div>
                                          )}
                                        </div>
                                      </ReservationPopover>
                                  )
                                })}
                              </div>
                            </div>
                        )
                      })}
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* LEYENDA */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs bg-card py-3 px-6 rounded-full border border-border w-fit mx-auto shadow-sm">
          {[
            { color: "bg-emerald-500", label: "Al día" },
            { color: "bg-rose-500", label: "Deuda" },
            { color: "bg-blue-500", label: "Abono" },
            { color: "bg-orange-500", label: "Sin Abono" },
            { color: "bg-gray-500", label: "Bloqueado" },
          ].map((status) => (
              <div key={status.label} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${status.color}`}></div>
                <span className="text-muted-foreground font-medium">{status.label}</span>
              </div>
          ))}
        </div>

        <RateModifierModal
            isOpen={rateModalOpen}
            onClose={() => setRateModalOpen(false)}
            onSave={handleSaveRates}
            roomCategories={Array.from(new Set(floors.flatMap(f => f.rooms.map(r => r.category))))}
        />

        {newReservationModal && (
            <NewReservationModal
                isOpen={newReservationModal.isOpen}
                onClose={() => setNewReservationModal(null)}
                initialRoomId={newReservationModal.roomId}
                initialDate={newReservationModal.date}
                type={newReservationModal.type as any}
                rooms={floors.flatMap((f) => f.rooms)}
            />
        )}

        {checkinWizardData && checkinWizardData.reservation && (
            <CheckinWizard
                isOpen={checkinWizardData.isOpen}
                onClose={() => setCheckinWizardData(null)}
                reservation={{
                  id: checkinWizardData.reservation.id,
                  guestName: checkinWizardData.reservation.guestName,
                  roomNumber: checkinWizardData.reservation.segments[0].roomId,
                  checkIn: checkinWizardData.reservation.segments[0].startDate,
                  checkOut: checkinWizardData.reservation.segments[0].endDate,
                  totalAmount: checkinWizardData.reservation.totalValue,
                  paidAmount: checkinWizardData.reservation.paidAmount
                }}
                onComplete={handleCompleteCheckIn}
            />
        )}
      </div>
  )
}
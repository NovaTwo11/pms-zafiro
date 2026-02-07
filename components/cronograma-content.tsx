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
  // --- PASADAS (Finales de Enero / Principios de Febrero) ---
  {
    id: "hist1",
    guestName: "Juan Pérez",
    segments: [{ roomId: "101", startDate: new Date(2026, 0, 28), endDate: new Date(2026, 1, 2) }],
    status: "check_in_paid", // Ya salió (en historial sería checked_out, pero visualmente verde está bien)
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

  // --- ACTUALES (Huéspedes en casa alrededor del 7 de Feb) ---
  {
    id: "curr1",
    guestName: "Carlos Ruiz",
    segments: [{ roomId: "102", startDate: new Date(2026, 1, 5), endDate: new Date(2026, 1, 10) }],
    status: "check_in_debt", // Rojo: Debe dinero
    totalValue: 750000,
    paidAmount: 300000, // Abonó parcial
  },
  {
    id: "curr2",
    guestName: "Familia Gómez",
    segments: [{ roomId: "105", startDate: new Date(2026, 1, 6), endDate: new Date(2026, 1, 9) }],
    status: "check_in_paid", // Verde: Todo pago
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
    status: "check_in_debt", // Acaban de llegar
    totalValue: 2000000,
    paidAmount: 0,
  },

  // --- PRÓXIMAS (Futuras en Febrero) ---
  {
    id: "fut1",
    guestName: "Roberto Díaz",
    segments: [{ roomId: "101", startDate: new Date(2026, 1, 12), endDate: new Date(2026, 1, 15) }],
    status: "confirmed_deposit", // Azul
    totalValue: 450000,
    paidAmount: 200000,
  },
  {
    id: "fut2",
    guestName: "María Torres",
    segments: [{ roomId: "103", startDate: new Date(2026, 1, 14), endDate: new Date(2026, 1, 18) }],
    status: "confirmed_no_deposit", // Naranja
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
    status: "blocked", // Gris
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

const getStatusStyles = (status: ReservationStatus) => {
  switch (status) {
    case "check_in_paid":
      return "bg-emerald-500/15 border-l-4 border-l-emerald-500 text-emerald-100 hover:bg-emerald-500/25 ring-1 ring-emerald-500/20"
    case "check_in_debt":
      return "bg-rose-500/15 border-l-4 border-l-rose-500 text-rose-100 hover:bg-rose-500/25 ring-1 ring-rose-500/20"
    case "confirmed_deposit":
      return "bg-blue-500/15 border-l-4 border-l-blue-500 text-blue-100 hover:bg-blue-500/25 ring-1 ring-blue-500/20"
    case "confirmed_no_deposit":
      return "bg-orange-500/15 border-l-4 border-l-orange-500 text-orange-100 hover:bg-orange-500/25 ring-1 ring-orange-500/20"
    case "blocked":
      return "bg-gray-700/40 border-l-4 border-l-gray-500 text-gray-400 hover:bg-gray-600/50 grayscale pattern-diagonal-lines"
    default:
      return "bg-gray-500"
  }
}

const getCategoryColor = (category: RoomCategory) => {
  switch (category) {
    case "Estándar": return "text-blue-400 border-blue-400/20 bg-blue-400/5"
    case "Superior": return "text-purple-400 border-purple-400/20 bg-purple-400/5"
    case "Deluxe": return "text-amber-400 border-amber-400/20 bg-amber-400/5"
    case "Suite":
    case "Suite Junior":
    case "Suite Presidencial": return "text-rose-400 border-rose-400/20 bg-rose-400/5"
    default: return "text-gray-400"
  }
}

export function CronogramaContent() {
  // Estado inicial: Fecha actual (Feb 7, 2026 según contexto)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations)

  // DRAG AND DROP STATE
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

  // --- LÓGICA DE PRECIOS ---
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

  // --- LÓGICA DRAG & DROP ---
  const handleDragStart = (reservationId: string, segmentIndex: number, originalRoomId: string) => {
    setDraggedSegment({ reservationId, segmentIndex, originalRoomId })
  }

  const handleDrop = (targetRoomId: string) => {
    if (!draggedSegment) return

    setReservations((prev) =>
        prev.map((res) => {
          if (res.id === draggedSegment.reservationId) {
            // Creamos una copia profunda de los segmentos para no mutar el estado directamente
            const newSegments = [...res.segments]
            // Actualizamos solo el roomId del segmento arrastrado
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

  // --- NAVEGACIÓN ---
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

  // --- POSICIONAMIENTO ---
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

  // --- HANDLERS BASICOS ---
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
      <div className="space-y-4 h-full flex flex-col bg-[#09090b] text-[#E5E5E5] p-2">

        {/* HEADER PRINCIPAL */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-[#E5E5E5] tracking-tight">Cronograma</h1>
            <p className="text-xs text-[#A3A3A3]">Gestión de ocupación y tarifas</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                className="border-[#333] bg-[#1A1A1A] text-[#E5E5E5] hover:bg-[#252525] hover:text-[#D4AF37] transition-colors"
                onClick={() => setRateModalOpen(true)}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Tarifas
            </Button>

            <div className="flex items-center rounded-lg border border-[#333] bg-[#1A1A1A] p-1">
              {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                  <Button
                      key={mode}
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode(mode)}
                      className={cn(
                          "h-7 px-3 text-xs capitalize transition-all",
                          viewMode === mode ? "bg-[#D4AF37] text-black font-semibold shadow-sm" : "text-[#A3A3A3] hover:text-white"
                      )}
                  >
                    {mode === "day" ? "Día" : mode === "week" ? "Semana" : "Mes"}
                  </Button>
              ))}
            </div>

            <Button
                size="sm"
                onClick={() => setNewReservationModal({ isOpen: true, roomId: "", date: currentDate, type: "reservation" })}
                className="bg-[#D4AF37] text-black hover:bg-[#c4a02e] font-medium"
            >
              <Plus className="h-4 w-4 mr-1" /> Crear
            </Button>
          </div>
        </div>

        {/* NAVEGACIÓN DE FECHAS */}
        <div className="flex items-center justify-between shrink-0 bg-[#1A1A1A] p-2 rounded-md border border-[#333]">
          <Button variant="ghost" size="icon" onClick={navigatePrevious} className="h-8 w-8 text-[#A3A3A3] hover:text-white hover:bg-[#333]">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-bold text-[#E5E5E5] capitalize tracking-wide">
            {format(currentDate, "MMMM yyyy", { locale: es })}
        </span>
          <Button variant="ghost" size="icon" onClick={navigateNext} className="h-8 w-8 text-[#A3A3A3] hover:text-white hover:bg-[#333]">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="link" size="sm" onClick={goToToday} className="text-[#D4AF37] text-xs h-8 ml-2">
            Hoy
          </Button>
        </div>

        {/* GRID DE RESERVAS */}
        <div className="rounded-lg border border-[#333] bg-[#0F0F0F] flex-1 flex flex-col overflow-hidden shadow-2xl relative">
          <div ref={gridRef} className="flex-1 overflow-auto custom-scrollbar">
            <div className="min-w-max">

              {/* HEADER DE DÍAS */}
              <div className="flex sticky top-0 z-20 bg-[#1A1A1A] shadow-md border-b border-[#333]">
                <div className="w-[180px] shrink-0 border-r border-[#333] bg-[#1A1A1A] p-3 sticky left-0 z-30 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#A3A3A3]">Habitación</span>
                  <span className="text-[10px] text-[#525252] font-mono">Tarifa Hoy</span>
                </div>
                <div className="flex">
                  {days.map((day, idx) => {
                    const isCurrent = isToday(day)
                    return (
                        <div
                            key={idx}
                            className={cn(
                                "min-w-[48px] w-12 border-r border-[#333] py-2 text-center flex flex-col justify-center relative group",
                                isCurrent && "bg-[#D4AF37]/5"
                            )}
                        >
                          <span className="text-[10px] text-[#737373] uppercase font-medium">{format(day, "EEE", { locale: es })}</span>
                          <span className={cn("text-sm font-bold", isCurrent ? "text-[#D4AF37]" : "text-[#E5E5E5]")}>
                        {format(day, "d")}
                      </span>
                          <div className="mt-1 h-[2px] w-3 mx-auto bg-[#333] group-hover:bg-[#D4AF37] transition-colors rounded-full" />
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
                      <div className="sticky left-0 w-full bg-[#151515] border-y border-[#333] px-4 py-1 z-10">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37]">{floor.name}</span>
                      </div>

                      {floor.rooms.map((room) => {
                        const todayPrice = getRoomPrice(room, new Date())

                        const roomSegments = reservations.flatMap(res =>
                            res.segments.map((seg, idx) => ({ reservation: res, segment: seg, idx })).filter(item => item.segment.roomId === room.id)
                        )

                        return (
                            <div
                                key={room.id}
                                // --- DROP ZONE LOGIC ---
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("bg-[#D4AF37]/10") }}
                                onDragLeave={(e) => { e.currentTarget.classList.remove("bg-[#D4AF37]/10") }}
                                onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("bg-[#D4AF37]/10"); handleDrop(room.id) }}
                                className="flex border-b border-[#333]/50 h-[72px] relative hover:bg-[#252525]/30 group transition-colors"
                            >

                              {/* COLUMNA INFO HABITACIÓN */}
                              <div className="w-[180px] shrink-0 border-r border-[#333] px-4 flex flex-col justify-center sticky left-0 z-10 bg-[#0F0F0F] group-hover:bg-[#1A1A1A] transition-colors border-r-2 border-r-[#222]">
                                <div className="flex items-center justify-between w-full mb-1">
                                  <span className="text-xl font-bold text-[#E5E5E5]">{room.number}</span>
                                  <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 rounded-sm border-0", getCategoryColor(room.category))}>
                                    {room.category}
                                  </Badge>
                                </div>
                                <div
                                    className="flex items-center gap-1.5 cursor-pointer hover:bg-[#333] rounded px-1 -ml-1 py-0.5 transition-colors w-fit"
                                    onClick={() => alert(`Gestionar tarifa habitación ${room.number}`)}
                                >
                                  <span className="text-[10px] text-[#A3A3A3]">Hoy:</span>
                                  <span className="text-xs font-medium text-[#D4AF37]">${formatPriceShort(todayPrice)}</span>
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
                                            "min-w-[48px] w-12 border-r border-[#333]/30 cursor-pointer transition-all hover:bg-[#333]/40 flex items-end justify-center pb-1",
                                            isToday(day) && "bg-[#D4AF37]/5"
                                        )}
                                    >
                                <span className="text-[8px] text-[#555] opacity-0 group-hover:opacity-100 select-none transition-opacity">
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
                                            // --- DRAG HANDLE LOGIC ---
                                            draggable
                                            onDragStart={() => handleDragStart(reservation.id, idx, segment.roomId)}
                                            // -------------------------
                                            className={cn(
                                                "absolute top-0 bottom-0 m-auto h-[90%] rounded-md shadow-md text-[10px] font-medium flex flex-col justify-center px-2 cursor-grab active:cursor-grabbing transition-all z-10 hover:z-20 hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm overflow-hidden whitespace-nowrap",
                                                getStatusStyles(reservation.status)
                                            )}
                                            style={{
                                              left: `${style.left * 48}px`,
                                              width: `${style.width * 48}px`,
                                            }}
                                        >
                                          <div className="flex items-center gap-1.5 font-bold tracking-tight text-white/90">
                                            {reservation.status === "blocked" ? (
                                                <><Lock className="h-3 w-3" /> <span>BLOQUEO</span></>
                                            ) : (
                                                <span>{reservation.guestName}</span>
                                            )}
                                          </div>

                                          {style.width > 1 && reservation.status !== "blocked" && (
                                              <div className="flex items-center justify-between opacity-80 mt-0.5 text-[9px] font-normal">
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
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs bg-[#1A1A1A] py-3 px-6 rounded-full border border-[#333] w-fit mx-auto shadow-lg">
          {[
            { color: "bg-emerald-500", label: "Al día" },
            { color: "bg-rose-500", label: "Deuda" },
            { color: "bg-blue-500", label: "Abono" },
            { color: "bg-orange-500", label: "Sin Abono" },
            { color: "bg-gray-500", label: "Bloqueado" },
          ].map((status) => (
              <div key={status.label} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${status.color} shadow-[0_0_8px_rgba(0,0,0,0.5)]`}></div>
                <span className="text-[#A3A3A3] font-medium">{status.label}</span>
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
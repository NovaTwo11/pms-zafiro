"use client"

import { useState, useRef, useMemo } from "react"
import { addDays, format, startOfWeek, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { es } from "date-fns/locale"
import { CheckinWizard } from "@/components/checkin-wizard"
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Calendar, CalendarRange, Lock, DollarSign, MousePointerClick } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ReservationBlock } from "./reservation-block"
import { ReservationPopover } from "./reservation-popover"
import { NewReservationModal } from "./new-reservation-modal"
import { cn } from "@/lib/utils"

// --- TYPES (Actualizados para Punto 17 y 18) ---
type ViewMode = "day" | "week" | "month"

// Categorías de habitación (Punto 8)
type RoomCategory = "Estándar" | "Superior" | "Deluxe" | "Suite" | "Suite Junior" | "Suite Presidencial"

// Estados estrictos (Punto 10)
type ReservationStatus =
    | "check_in_paid"       // Verde (En casa y al día)
    | "check_in_debt"       // Rojo (En casa y deuda)
    | "confirmed_deposit"   // Azul (Confirmada con abono)
    | "confirmed_no_deposit"// Naranja (Confirmada sin abono)
    | "blocked"             // Gris (Bloqueada)

export type ReservationSegment = {
  roomId: string
  startDate: Date
  endDate: Date
}

export type Reservation = {
  id: string
  guestName: string
  guestId?: string // Aquí iría la referencia al objeto Guest completo (Punto 17)
  segments: ReservationSegment[]
  status: ReservationStatus
  totalValue: number
  paidAmount: number // Para calcular si tiene deuda
  checkInTime?: Date
}

// Estructura de Habitación mejorada (Punto 8)
type Room = {
  id: string
  number: string
  category: RoomCategory
  basePrice: number // Precio base para mostrar (ej: 300000)
}

type Floor = {
  name: string
  rooms: Room[]
}

// --- DATA SIMULADA (Actualizada) ---
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

// Reservas con los nuevos estados (Punto 10)
const initialReservations: Reservation[] = [
  {
    id: "r1",
    guestName: "García (Al día)",
    guestId: "g1",
    segments: [{ roomId: "101", startDate: new Date(2026, 0, 3), endDate: new Date(2026, 0, 7) }],
    status: "check_in_paid", // VERDE
    totalValue: 720000,
    paidAmount: 720000,
  },
  {
    id: "r2",
    guestName: "Martínez (Deuda)",
    guestId: "g2",
    segments: [{ roomId: "102", startDate: new Date(2026, 0, 5), endDate: new Date(2026, 0, 9) }],
    status: "check_in_debt", // ROJO
    totalValue: 640000,
    paidAmount: 320000,
  },
  {
    id: "r3",
    guestName: "López (Abono)",
    guestId: "g3",
    segments: [{ roomId: "103", startDate: new Date(2026, 0, 4), endDate: new Date(2026, 0, 6) }],
    status: "confirmed_deposit", // AZUL
    totalValue: 400000,
    paidAmount: 200000,
  },
  {
    id: "r4",
    guestName: "Rodríguez (Sin Abono)",
    guestId: "g4",
    segments: [{ roomId: "201", startDate: new Date(2026, 0, 2), endDate: new Date(2026, 0, 8) }],
    status: "confirmed_no_deposit", // NARANJA
    totalValue: 960000,
    paidAmount: 0,
  },
  // Bloqueo como reserva (Punto 9: Eliminar estado "Mantenimiento", usar Bloqueado)
  {
    id: "b1",
    guestName: "BLOQUEADO",
    segments: [{ roomId: "104", startDate: new Date(2026, 0, 4), endDate: new Date(2026, 0, 8) }],
    status: "blocked", // GRIS
    totalValue: 0,
    paidAmount: 0,
  },
]

// --- UTILIDADES VISUALES ---

// Punto 8: Formato de precio tipo 300k, 195.5k
const formatPriceShort = (price: number) => {
  if (price >= 1000000) return `${(price / 1000000).toFixed(1).replace(/\.0$/, '')}M`
  if (price >= 1000) return `${(price / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return price.toString()
}

// Punto 10: Colores estrictos
const getStatusColor = (status: ReservationStatus) => {
  switch (status) {
    case "check_in_paid": return "bg-green-600 border-green-700 hover:bg-green-500" // Verde
    case "check_in_debt": return "bg-red-600 border-red-700 hover:bg-red-500" // Rojo
    case "confirmed_deposit": return "bg-blue-600 border-blue-700 hover:bg-blue-500" // Azul
    case "confirmed_no_deposit": return "bg-orange-600 border-orange-700 hover:bg-orange-500" // Naranja
    case "blocked": return "bg-gray-600 border-gray-700 hover:bg-gray-500" // Gris
    default: return "bg-gray-500"
  }
}

// Colores para categorías de habitación (Punto 8)
const getCategoryColor = (category: RoomCategory) => {
  switch (category) {
    case "Estándar": return "text-blue-400 border-blue-400/30"
    case "Superior": return "text-purple-400 border-purple-400/30"
    case "Deluxe": return "text-yellow-400 border-yellow-400/30"
    case "Suite":
    case "Suite Junior":
    case "Suite Presidencial": return "text-rose-400 border-rose-400/30"
    default: return "text-gray-400"
  }
}

export function CronogramaContent() {
  // Punto 6: Vista predeterminada mensual
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 5))
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations)

  const [checkinWizardData, setCheckinWizardData] = useState<{
    isOpen: boolean
    reservation: Reservation | null
  } | null>(null)

  const [newReservationModal, setNewReservationModal] = useState<{
    isOpen: boolean
    roomId: string
    date: Date
    type: "reservation" | "maintenance"
  } | null>(null)

  const [draggedSegment, setDraggedSegment] = useState<{
    reservationId: string
    segmentIndex: number
    originalRoomId: string
  } | null>(null)

  const gridRef = useRef<HTMLDivElement>(null)

  // Generar días según la vista
  const days = useMemo(() => {
    if (viewMode === "day") return [currentDate]
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      return Array.from({ length: 7 }, (_, i) => addDays(start, i))
    }
    // Month view: Mostrar el mes completo de la fecha actual
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }, [currentDate, viewMode])

  const navigatePrevious = () => {
    if (viewMode === "day") setCurrentDate((d) => addDays(d, -1))
    else if (viewMode === "week") setCurrentDate((d) => addDays(d, -7))
    else setCurrentDate((d) => addDays(d, -30)) // Navegación por mes aproximado
  }

  const navigateNext = () => {
    if (viewMode === "day") setCurrentDate((d) => addDays(d, 1))
    else if (viewMode === "week") setCurrentDate((d) => addDays(d, 7))
    else setCurrentDate((d) => addDays(d, 30))
  }

  const goToToday = () => setCurrentDate(new Date())

  // Estilos y cálculos de posición
  const getReservationStyle = (startDate: Date, endDate: Date) => {
    const startIndex = days.findIndex((d) => isSameDay(d, startDate))
    // Si el fin es después del último día visible, limitarlo
    const endIndexRaw = days.findIndex((d) => isSameDay(d, endDate))
    const endIndex = endIndexRaw === -1 && endDate > days[days.length -1]
        ? days.length
        : endIndexRaw

    // Si la reserva empieza antes de la vista actual
    const actualStart = startIndex >= 0 ? startIndex : 0
    // Si la reserva termina antes de empezar la vista (no debería renderizarse, pero por seguridad)
    if (endDate < days[0]) return { width: 0, left: 0, isPartialStart: false, isPartialEnd: false, isHidden: true }
    // Si la reserva empieza después de terminar la vista
    if (startDate > days[days.length - 1]) return { width: 0, left: 0, isPartialStart: false, isPartialEnd: false, isHidden: true }

    const actualEnd = endIndex >= 0 ? endIndex : days.length
    const width = Math.max(1, actualEnd - actualStart)

    return {
      width,
      left: actualStart,
      isPartialStart: startIndex < 0,
      isPartialEnd: endIndexRaw < 0,
      isHidden: false
    }
  }

  // Manejadores (Handlers)
  const handleCellClick = (roomId: string, day: Date) => {
    // Validar si existe reserva
    const hasReservation = reservations.some((r) =>
        r.segments.some((seg) => seg.roomId === roomId && day >= seg.startDate && day < seg.endDate),
    )
    if (!hasReservation) {
      setNewReservationModal({
        isOpen: true,
        roomId,
        date: day,
        type: "reservation",
      })
    }
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
        }),
    )
    setDraggedSegment(null)
  }

  const handleCheckIn = (reservationId: string) => {
    const res = reservations.find(r => r.id === reservationId)
    if (!res) return

    // Abrimos el Wizard pasándole la reserva completa
    setCheckinWizardData({
      isOpen: true,
      reservation: res
    })

    // Cerramos el popover pequeño
    setSelectedReservation(null)
  }

  // Nueva función para cuando el Wizard termina exitosamente
  const handleCompleteCheckIn = (data: any) => {
    if (!checkinWizardData?.reservation) return

    console.log("Datos de Check-in completados:", data)
    // Aquí guardarías los datos del huésped y firma en tu Backend

    // Actualizamos el estado de la reserva localmente a "Verde" (Ya pagó y está en casa)
    setReservations(prev => prev.map(r => {
      if (r.id === checkinWizardData.reservation!.id) {
        return { ...r, status: "check_in_paid", checkInTime: new Date() }
      }
      return r
    }))

    // Cerrar Wizard
    setCheckinWizardData(null)
    alert("Check-in realizado con éxito. Firma guardada.")
  }

  const handleCheckOut = (reservationId: string) => {
    // Lógica de checkout...
    setSelectedReservation(null)
  }

  const handleCancelReservation = (reservationId: string) => {
    if (confirm("¿Está seguro de cancelar esta reserva?")) {
      setReservations((prev) => prev.filter((res) => res.id !== reservationId))
      setSelectedReservation(null)
    }
  }

  // Punto 11: Modificar precio de habitación específica
  const handleRoomPriceClick = (roomId: string, price: number) => {
    // Aquí abriremos el modal para editar precio (Punto 11 y 7)
    alert(`Modificar precio para habitación ${roomId}. Precio actual: $${price}`)
  }

  return (
      <div className="space-y-4 h-full flex flex-col">
        {/* Header y Filtros */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div>
            <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-[#E5E5E5]">Cronograma</h1>
            <p className="text-xs text-[#A3A3A3]">Gestión de reservas y ocupación</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Punto 7: Botón para modificar precios por rango */}
            <Button
                variant="outline"
                size="sm"
                className="border-[#333333] bg-[#1A1A1A] text-[#E5E5E5] hover:bg-[#252525]"
                onClick={() => alert("Abrir modal de gestión masiva de tarifas")}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Tarifas
            </Button>

            <div className="flex items-center rounded-lg border border-[#333333] bg-[#1A1A1A] p-1">
              <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("day")}
                  className={cn("h-7 px-2 text-xs", viewMode === "day" && "bg-[#D4AF37]/10 text-[#D4AF37]")}
              >
                Día
              </Button>
              <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("week")}
                  className={cn("h-7 px-2 text-xs", viewMode === "week" && "bg-[#D4AF37]/10 text-[#D4AF37]")}
              >
                Semana
              </Button>
              <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("month")}
                  className={cn("h-7 px-2 text-xs", viewMode === "month" && "bg-[#D4AF37]/10 text-[#D4AF37]")}
              >
                Mes
              </Button>
            </div>

            <Button
                size="sm"
                onClick={() => setNewReservationModal({ isOpen: true, roomId: "", date: currentDate, type: "reservation" })}
                className="bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90"
            >
              <Plus className="h-4 w-4 mr-1" /> Nueva
            </Button>
          </div>
        </div>

        {/* Navegación de Fechas */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={navigatePrevious} className="h-8 w-8 text-[#A3A3A3]">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-[#E5E5E5] w-32 text-center">
            {format(currentDate, "MMMM yyyy", { locale: es })}
          </span>
            <Button variant="ghost" size="icon" onClick={navigateNext} className="h-8 w-8 text-[#A3A3A3]">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="link" size="sm" onClick={goToToday} className="text-[#D4AF37] text-xs h-8">
              Hoy
            </Button>
          </div>
        </div>

        {/* GRID PRINCIPAL */}
        <div
            className={cn(
                "rounded-lg border border-[#333333] bg-[#1A1A1A] flex-1 flex flex-col overflow-hidden",
            )}
        >
          <div ref={gridRef} className="flex-1 overflow-auto">
            <div className="min-w-max">

              {/* Header de Días */}
              <div className="flex sticky top-0 z-20 bg-[#1A1A1A] border-b border-[#333333]">
                <div className="w-[180px] shrink-0 border-r border-[#333333] bg-[#1A1A1A] p-3 sticky left-0 z-30 flex items-end pb-2">
                  <span className="text-xs font-semibold text-[#A3A3A3]">Habitación</span>
                </div>
                <div className="flex">
                  {days.map((day, idx) => (
                      <div
                          key={idx}
                          className={cn(
                              "min-w-[44px] w-11 border-r border-[#333333] last:border-r-0 py-2 text-center flex flex-col justify-center",
                              isToday(day) && "bg-[#D4AF37]/10",
                          )}
                      >
                        <span className="text-[10px] text-[#A3A3A3] uppercase mb-1">{format(day, "EEE", { locale: es })}</span>
                        <span className={cn("text-xs font-bold", isToday(day) ? "text-[#D4AF37]" : "text-[#E5E5E5]")}>
                      {format(day, "d")}
                    </span>
                      </div>
                  ))}
                </div>
              </div>

              {/* Filas de Habitaciones */}
              <div className="pb-4">
                {floors.map((floor) => (
                    <div key={floor.name}>
                      {/* Separador de Piso */}
                      <div className="sticky left-0 w-full bg-[#0F0F0F] border-b border-[#333333] px-4 py-1 z-10">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37]">{floor.name}</span>
                      </div>

                      {floor.rooms.map((room) => {
                        // Filtrar segmentos para esta habitación
                        const roomSegments: { reservation: Reservation; segment: ReservationSegment; segmentIndex: number }[] = []
                        reservations.forEach((res) => {
                          res.segments.forEach((seg, idx) => {
                            if (seg.roomId === room.id) roomSegments.push({ reservation: res, segment: seg, segmentIndex: idx })
                          })
                        })

                        return (
                            <div
                                key={room.id}
                                className="flex border-b border-[#333333] last:border-b-0 h-[70px] relative hover:bg-[#252525]/30 group"
                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("bg-[#D4AF37]/5") }}
                                onDragLeave={(e) => { e.currentTarget.classList.remove("bg-[#D4AF37]/5") }}
                                onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove("bg-[#D4AF37]/5"); handleDrop(room.id) }}
                            >
                              {/* Columna Info Habitación (Punto 8 y 11) */}
                              <div className="w-[180px] shrink-0 border-r border-[#333333] px-3 flex flex-col justify-center sticky left-0 z-10 bg-[#1A1A1A] group-hover:bg-[#1f1f1f] transition-colors">
                                <div className="flex items-center justify-between w-full mb-1">
                                  <span className="text-lg font-bold text-[#E5E5E5]">{room.number}</span>
                                  <Badge variant="outline" className={cn("text-[9px] px-1 py-0 h-4 border bg-transparent", getCategoryColor(room.category))}>
                                    {room.category}
                                  </Badge>
                                </div>
                                {/* Precio clickable (Punto 11) */}
                                <div
                                    className="flex items-center gap-1 cursor-pointer hover:bg-[#333333] rounded px-1 -ml-1 py-0.5 transition-colors w-fit"
                                    onClick={() => handleRoomPriceClick(room.id, room.basePrice)}
                                >
                             <span className={cn("text-xs font-medium", getCategoryColor(room.category).split(" ")[0])}>
                               ${formatPriceShort(room.basePrice)}
                             </span>
                                  <MousePointerClick className="h-3 w-3 text-[#525252] opacity-0 group-hover:opacity-100" />
                                </div>
                              </div>

                              {/* Celdas del Grid */}
                              <div className="flex relative">
                                {/* Fondo de celdas */}
                                {days.map((day, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => handleCellClick(room.id, day)}
                                        className={cn(
                                            "min-w-[44px] w-11 border-r border-[#333333]/40 last:border-r-0 cursor-pointer transition-all duration-300 hover:bg-[#333333]/50",
                                            isToday(day) && "bg-[#D4AF37]/5",
                                        )}
                                    />
                                ))}

                                {/* Renderizado de Reservas (Overlay) */}
                                {roomSegments.map(({ reservation, segment, segmentIndex }) => {
                                  const style = getReservationStyle(segment.startDate, segment.endDate)
                                  if (style.isHidden) return null;
                                  const isSplitReservation = reservation.segments.length > 1

                                  return (
                                      <ReservationPopover
                                          key={`${reservation.id}-${segmentIndex}`}
                                          reservation={reservation}
                                          segment={segment}
                                          segmentIndex={segmentIndex}
                                          isOpen={selectedReservation === `${reservation.id}-${segmentIndex}`}
                                          onOpenChange={(open) => setSelectedReservation(open ? `${reservation.id}-${segmentIndex}` : null)}
                                          onCheckIn={() => handleCheckIn(reservation.id)}
                                          onCheckOut={() => handleCheckOut(reservation.id)}
                                          onCancel={() => handleCancelReservation(reservation.id)}
                                      >
                                        <div
                                            draggable
                                            onDragStart={() => handleDragStart(reservation.id, segmentIndex, segment.roomId)}
                                            className={cn(
                                                "absolute top-1 bottom-1 m-auto h-[80%] rounded-md shadow-sm border text-[10px] font-medium flex flex-col justify-center px-2 cursor-grab active:cursor-grabbing overflow-hidden whitespace-nowrap text-white z-0 hover:z-10 hover:brightness-110 transition-all",
                                                getStatusColor(reservation.status) // Aplicando colores estrictos (Punto 10)
                                            )}
                                            style={{
                                              left: `${style.left * 44}px`, // 44px es el ancho fijo de la celda
                                              width: `${style.width * 44}px`,
                                            }}
                                        >
                                          <div className="flex items-center gap-1 font-bold">
                                            {reservation.status === "blocked" && <Lock className="h-3 w-3" />}
                                            {reservation.guestName}
                                          </div>
                                          {/* Mostrar saldo si cabe */}
                                          {style.width > 1 && reservation.status !== "blocked" && (
                                              <div className="opacity-90 text-[9px]">
                                                {reservation.paidAmount >= reservation.totalValue ? "Pagado" : `Deb: $${formatPriceShort(reservation.totalValue - reservation.paidAmount)}`}
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

        {/* Instructivo / Leyenda (Punto 10) */}
        <div className="flex flex-wrap items-center gap-4 text-xs bg-[#1A1A1A] p-2 rounded-lg border border-[#333333]">
          <span className="font-semibold text-[#A3A3A3]">Estados:</span>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600 border border-green-700"></div> <span className="text-[#E5E5E5]">En Casa (Al día)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600 border border-red-700"></div> <span className="text-[#E5E5E5]">En Casa (Deuda)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600 border border-blue-700"></div> <span className="text-[#E5E5E5]">Confirmada (Abono)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-600 border border-orange-700"></div> <span className="text-[#E5E5E5]">Confirmada (Sin Abono)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-600 border border-gray-700"></div> <span className="text-[#E5E5E5]">Bloqueada</span>
          </div>
        </div>

        {/* Modales */}
        {newReservationModal && (
            <NewReservationModal
                isOpen={newReservationModal.isOpen}
                onClose={() => setNewReservationModal(null)}
                initialRoomId={newReservationModal.roomId}
                initialDate={newReservationModal.date}
                type={newReservationModal.type}
                rooms={floors.flatMap((f) => f.rooms)}
            />
        )}
        {/* Renderizar el Wizard si está abierto */}
        {checkinWizardData && checkinWizardData.reservation && (
            <CheckinWizard
                isOpen={checkinWizardData.isOpen}
                onClose={() => setCheckinWizardData(null)}
                reservation={{
                  id: checkinWizardData.reservation.id,
                  guestName: checkinWizardData.reservation.guestName,
                  roomNumber: checkinWizardData.reservation.segments[0].roomId, // Simplificado, idealmente busca el número
                  checkIn: checkinWizardData.reservation.segments[0].startDate,
                  checkOut: checkinWizardData.reservation.segments[0].endDate,
                  totalAmount: checkinWizardData.reservation.totalValue, // IMPORTANTE
                  paidAmount: checkinWizardData.reservation.paidAmount   // IMPORTANTE
                }}
                onComplete={handleCompleteCheckIn}
            />
        )}
      </div>
  )
}
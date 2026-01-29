"use client"

import { useState, useRef } from "react"
import { addDays, format, startOfWeek, isSameDay, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Calendar, CalendarRange, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ReservationBlock } from "./reservation-block"
import { ReservationPopover } from "./reservation-popover"
import { NewReservationModal } from "./new-reservation-modal"
import { cn } from "@/lib/utils"

type ViewMode = "day" | "week" | "month"

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
  status: "confirmed" | "in-house" | "checked-out" | "cancelled"
  isPaid: boolean
  totalValue: number
  balance: number
  checkInTime?: Date
}

const floors = [
  {
    name: "Piso 1",
    rooms: [
      { id: "101", number: "101", type: "Estándar" },
      { id: "102", number: "102", type: "Estándar" },
      { id: "103", number: "103", type: "Superior" },
      { id: "104", number: "104", type: "Superior" },
      { id: "105", number: "105", type: "Suite" },
    ],
  },
  {
    name: "Piso 2",
    rooms: [
      { id: "201", number: "201", type: "Estándar" },
      { id: "202", number: "202", type: "Estándar" },
      { id: "203", number: "203", type: "Superior" },
      { id: "204", number: "204", type: "Superior" },
      { id: "205", number: "205", type: "Suite" },
    ],
  },
  {
    name: "Piso 3",
    rooms: [
      { id: "301", number: "301", type: "Estándar" },
      { id: "302", number: "302", type: "Estándar" },
      { id: "303", number: "303", type: "Superior" },
      { id: "304", number: "304", type: "Suite Junior" },
      { id: "305", number: "305", type: "Suite Presidencial" },
    ],
  },
]

const initialReservations: Reservation[] = [
  {
    id: "r1",
    guestName: "García",
    guestId: "g1",
    segments: [{ roomId: "101", startDate: new Date(2026, 0, 3), endDate: new Date(2026, 0, 7) }],
    status: "confirmed",
    isPaid: true,
    totalValue: 720000,
    balance: 0,
  },
  {
    id: "r2",
    guestName: "Martínez",
    guestId: "g2",
    segments: [{ roomId: "102", startDate: new Date(2026, 0, 5), endDate: new Date(2026, 0, 9) }],
    status: "in-house",
    isPaid: false,
    totalValue: 640000,
    balance: 320000,
  },
  {
    id: "r3",
    guestName: "López",
    guestId: "g3",
    segments: [{ roomId: "103", startDate: new Date(2026, 0, 4), endDate: new Date(2026, 0, 6) }],
    status: "confirmed",
    isPaid: true,
    totalValue: 400000,
    balance: 0,
  },
  {
    id: "r4",
    guestName: "Rodríguez",
    guestId: "g4",
    segments: [{ roomId: "201", startDate: new Date(2026, 0, 2), endDate: new Date(2026, 0, 8) }],
    status: "in-house",
    isPaid: true,
    totalValue: 960000,
    balance: 0,
  },
  {
    id: "r5",
    guestName: "Sánchez",
    guestId: "g5",
    segments: [
      { roomId: "203", startDate: new Date(2026, 0, 6), endDate: new Date(2026, 0, 8) },
      { roomId: "205", startDate: new Date(2026, 0, 8), endDate: new Date(2026, 0, 10) },
    ],
    status: "confirmed",
    isPaid: false,
    totalValue: 800000,
    balance: 400000,
  },
  {
    id: "r6",
    guestName: "Pérez",
    guestId: "g6",
    segments: [{ roomId: "205", startDate: new Date(2026, 0, 1), endDate: new Date(2026, 0, 5) }],
    status: "checked-out",
    isPaid: true,
    totalValue: 1200000,
    balance: 0,
  },
  {
    id: "r7",
    guestName: "Hernández",
    guestId: "g7",
    segments: [{ roomId: "301", startDate: new Date(2026, 0, 5), endDate: new Date(2026, 0, 12) }],
    status: "confirmed",
    isPaid: true,
    totalValue: 1120000,
    balance: 0,
  },
  {
    id: "r8",
    guestName: "Díaz",
    guestId: "g8",
    segments: [{ roomId: "304", startDate: new Date(2026, 0, 3), endDate: new Date(2026, 0, 6) }],
    status: "in-house",
    isPaid: true,
    totalValue: 750000,
    balance: 0,
  },
]

// Blocked rooms (maintenance)
const blockedRooms = [
  {
    id: "b1",
    roomId: "104",
    startDate: new Date(2026, 0, 4),
    endDate: new Date(2026, 0, 8),
    reason: "Mantenimiento",
  },
  {
    id: "b2",
    roomId: "303",
    startDate: new Date(2026, 0, 1),
    endDate: new Date(2026, 0, 6),
    reason: "Reparación AC",
  },
]

export function CronogramaContent() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 5))
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>(initialReservations)

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

  // Generate days for the view
  const getDaysForView = () => {
    if (viewMode === "day") {
      return [currentDate]
    }
    if (viewMode === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      return Array.from({ length: 7 }, (_, i) => addDays(start, i))
    }
    // Month view - show 30 days
    return Array.from({ length: 30 }, (_, i) => addDays(currentDate, i - 10))
  }

  const days = getDaysForView()

  const navigatePrevious = () => {
    if (viewMode === "day") setCurrentDate((d) => addDays(d, -1))
    else if (viewMode === "week")
      setCurrentDate((d) => addDays(d, -1)) // Day-by-day navigation
    else setCurrentDate((d) => addDays(d, -7))
  }

  const navigateNext = () => {
    if (viewMode === "day") setCurrentDate((d) => addDays(d, 1))
    else if (viewMode === "week")
      setCurrentDate((d) => addDays(d, 1)) // Day-by-day navigation
    else setCurrentDate((d) => addDays(d, 7))
  }

  const goToToday = () => setCurrentDate(new Date())

  // Calculate reservation position and width
  const getReservationStyle = (startDate: Date, endDate: Date) => {
    const startIndex = days.findIndex((d) => isSameDay(d, startDate))
    const endIndex = days.findIndex((d) => isSameDay(d, endDate))

    const actualStart = startIndex >= 0 ? startIndex : 0
    const actualEnd = endIndex >= 0 ? endIndex : days.length

    const width = Math.max(1, actualEnd - actualStart)
    const left = actualStart

    return { width, left, isPartialStart: startIndex < 0, isPartialEnd: endIndex < 0 }
  }

  // Check if a segment is visible in current view
  const isSegmentVisible = (startDate: Date, endDate: Date) => {
    const firstDay = days[0]
    const lastDay = days[days.length - 1]
    return startDate <= lastDay && endDate >= firstDay
  }

  const handleCellClick = (roomId: string, day: Date) => {
    // Check if there's already a reservation or block for this cell
    const hasReservation = reservations.some((r) =>
      r.segments.some((seg) => seg.roomId === roomId && day >= seg.startDate && day < seg.endDate),
    )
    const hasBlock = blockedRooms.some((b) => b.roomId === roomId && day >= b.startDate && day < b.endDate)

    if (!hasReservation && !hasBlock) {
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
    setReservations((prev) =>
      prev.map((res) => (res.id === reservationId ? { ...res, status: "in-house", checkInTime: new Date() } : res)),
    )
    setSelectedReservation(null)
  }

  const handleCheckOut = (reservationId: string) => {
    const reservation = reservations.find((r) => r.id === reservationId)
    if (reservation && reservation.balance > 0) {
      alert(`No hay Paz y Salvo. Pendiente: $${reservation.balance.toLocaleString("es-CO")}`)
      return
    }
    setReservations((prev) => prev.map((res) => (res.id === reservationId ? { ...res, status: "checked-out" } : res)))
    setSelectedReservation(null)
  }

  const handleCancelReservation = (reservationId: string) => {
    if (confirm("¿Está seguro de cancelar esta reserva?")) {
      setReservations((prev) => prev.map((res) => (res.id === reservationId ? { ...res, status: "cancelled" } : res)))
      setSelectedReservation(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-[#E5E5E5]">Cronograma</h1>
          <p className="text-[#A3A3A3]">Vista de reservaciones y disponibilidad</p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Selector */}
          <div className="flex items-center rounded-lg border border-[#333333] bg-[#1A1A1A] p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("day")}
              className={cn(
                "h-8 px-3 text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#252525] transition-all duration-300",
                viewMode === "day" && "bg-[#D4AF37]/10 text-[#D4AF37]",
              )}
            >
              <Calendar className="h-4 w-4 mr-1" />
              Día
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("week")}
              className={cn(
                "h-8 px-3 text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#252525] transition-all duration-300",
                viewMode === "week" && "bg-[#D4AF37]/10 text-[#D4AF37]",
              )}
            >
              <CalendarDays className="h-4 w-4 mr-1" />
              Semana
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("month")}
              className={cn(
                "h-8 px-3 text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#252525] transition-all duration-300",
                viewMode === "month" && "bg-[#D4AF37]/10 text-[#D4AF37]",
              )}
            >
              <CalendarRange className="h-4 w-4 mr-1" />
              Mes
            </Button>
          </div>

          {/* New Reservation Button */}
          <Button
            onClick={() => setNewReservationModal({ isOpen: true, roomId: "", date: currentDate, type: "reservation" })}
            className="bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90 transition-all duration-300"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Reserva
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={navigatePrevious}
            className="h-9 w-9 border-[#333333] bg-[#1A1A1A] text-[#E5E5E5] hover:bg-[#252525] transition-all duration-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={navigateNext}
            className="h-9 w-9 border-[#333333] bg-[#1A1A1A] text-[#E5E5E5] hover:bg-[#252525] transition-all duration-300"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="h-9 border-[#333333] bg-[#1A1A1A] text-[#E5E5E5] hover:bg-[#252525] transition-all duration-300"
          >
            Hoy
          </Button>
        </div>

        <h2 className="text-lg font-medium text-[#E5E5E5]">{format(currentDate, "MMMM yyyy", { locale: es })}</h2>
      </div>

      {/* Calendar Grid - Added horizontal scroll for month view */}
      <div
        className={cn(
          "rounded-lg border border-[#333333] bg-[#1A1A1A] overflow-hidden",
          viewMode === "month" && "overflow-x-auto",
        )}
      >
        <div ref={gridRef} className={cn(viewMode === "month" && "min-w-[1800px]")}>
          {/* Days Header */}
          <div className="flex border-b border-[#333333]">
            {/* Room column header */}
            <div className="w-[140px] shrink-0 border-r border-[#333333] bg-[#0F0F0F] px-4 py-3">
              <span className="text-sm font-medium text-[#A3A3A3]">Habitación</span>
            </div>

            {/* Days */}
            <div className="flex flex-1">
              {days.map((day, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex-1 min-w-[60px] border-r border-[#333333] last:border-r-0 px-2 py-3 text-center",
                    isToday(day) && "bg-[#D4AF37]/10",
                  )}
                >
                  <p className="text-xs text-[#A3A3A3] uppercase">{format(day, "EEE", { locale: es })}</p>
                  <p className={cn("text-lg font-semibold", isToday(day) ? "text-[#D4AF37]" : "text-[#E5E5E5]")}>
                    {format(day, "d")}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="max-h-[calc(100vh-320px)] overflow-y-auto">
            {floors.map((floor) => (
              <div key={floor.name}>
                {/* Floor Header */}
                <div className="flex bg-[#0F0F0F] border-b border-[#333333]">
                  <div className="w-[140px] shrink-0 border-r border-[#333333] px-4 py-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">{floor.name}</span>
                  </div>
                  <div className="flex-1" />
                </div>

                {/* Rooms */}
                {floor.rooms.map((room) => {
                  // Get all segments for this room from all reservations
                  const roomSegments: {
                    reservation: Reservation
                    segment: ReservationSegment
                    segmentIndex: number
                  }[] = []
                  reservations.forEach((res) => {
                    res.segments.forEach((seg, idx) => {
                      if (seg.roomId === room.id && isSegmentVisible(seg.startDate, seg.endDate)) {
                        roomSegments.push({ reservation: res, segment: seg, segmentIndex: idx })
                      }
                    })
                  })

                  const roomBlocks = blockedRooms.filter(
                    (b) => b.roomId === room.id && isSegmentVisible(b.startDate, b.endDate),
                  )

                  return (
                    <div
                      key={room.id}
                      className="flex border-b border-[#333333] last:border-b-0"
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.add("bg-[#D4AF37]/5")
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove("bg-[#D4AF37]/5")
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.currentTarget.classList.remove("bg-[#D4AF37]/5")
                        handleDrop(room.id)
                      }}
                    >
                      {/* Room Info */}
                      <div className="w-[140px] shrink-0 border-r border-[#333333] px-4 py-3 flex flex-col justify-center">
                        <span className="text-sm font-semibold text-[#E5E5E5]">{room.number}</span>
                        <span className="text-xs text-[#A3A3A3]">{room.type}</span>
                      </div>

                      {/* Grid Cells with Reservations */}
                      <div className="flex-1 relative h-[60px]">
                        {/* Grid background - clickable cells */}
                        <div className="absolute inset-0 flex">
                          {days.map((day, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleCellClick(room.id, day)}
                              className={cn(
                                "flex-1 min-w-[60px] border-r border-[#333333]/50 last:border-r-0 cursor-pointer hover:bg-[#252525]/50 transition-all duration-300",
                                isToday(day) && "bg-[#D4AF37]/5",
                              )}
                            />
                          ))}
                        </div>

                        {/* Blocked periods (maintenance) */}
                        {roomBlocks.map((block) => {
                          const style = getReservationStyle(block.startDate, block.endDate)
                          return (
                            <div
                              key={block.id}
                              className="absolute top-2 h-[calc(100%-16px)] rounded bg-[#333333]/50 flex items-center px-2 cursor-pointer hover:bg-[#333333]/70 transition-all duration-300"
                              style={{
                                left: `${(style.left / days.length) * 100}%`,
                                width: `${(style.width / days.length) * 100}%`,
                                backgroundImage:
                                  "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(51,51,51,0.5) 4px, rgba(51,51,51,0.5) 8px)",
                              }}
                            >
                              <Wrench className="h-3 w-3 text-[#A3A3A3] mr-1" />
                              <span className="text-xs text-[#A3A3A3] truncate">{block.reason}</span>
                            </div>
                          )
                        })}

                        {/* Reservation Segments */}
                        {roomSegments.map(({ reservation, segment, segmentIndex }) => {
                          const style = getReservationStyle(segment.startDate, segment.endDate)
                          const isSplitReservation = reservation.segments.length > 1

                          return (
                            <ReservationPopover
                              key={`${reservation.id}-${segmentIndex}`}
                              reservation={reservation}
                              segment={segment}
                              segmentIndex={segmentIndex}
                              isOpen={selectedReservation === `${reservation.id}-${segmentIndex}`}
                              onOpenChange={(open) =>
                                setSelectedReservation(open ? `${reservation.id}-${segmentIndex}` : null)
                              }
                              onCheckIn={() => handleCheckIn(reservation.id)}
                              onCheckOut={() => handleCheckOut(reservation.id)}
                              onCancel={() => handleCancelReservation(reservation.id)}
                            >
                              <div
                                draggable
                                onDragStart={() => handleDragStart(reservation.id, segmentIndex, segment.roomId)}
                                className="absolute top-2 h-[calc(100%-16px)] cursor-grab active:cursor-grabbing"
                                style={{
                                  left: `${(style.left / days.length) * 100}%`,
                                  width: `${(style.width / days.length) * 100}%`,
                                }}
                              >
                                <ReservationBlock
                                  reservation={reservation}
                                  isPartialStart={style.isPartialStart}
                                  isPartialEnd={style.isPartialEnd}
                                  isSplit={isSplitReservation}
                                  segmentNumber={segmentIndex + 1}
                                  totalSegments={reservation.segments.length}
                                />
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

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-6 rounded bg-[#059669]" />
          <span className="text-[#A3A3A3]">Confirmada / Pagada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-6 rounded bg-[#3B82F6]" />
          <span className="text-[#A3A3A3]">En casa</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-6 rounded bg-[#CF6679]" />
          <span className="text-[#A3A3A3]">Pendiente pago</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-6 rounded bg-[#8B5CF6]" />
          <span className="text-[#A3A3A3]">Reserva fragmentada</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-6 rounded bg-[#333333]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(51,51,51,0.8) 2px, rgba(51,51,51,0.8) 4px)",
            }}
          />
          <span className="text-[#A3A3A3]">Mantenimiento</span>
        </div>
      </div>

      {/* New Reservation Modal */}
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
    </div>
  )
}

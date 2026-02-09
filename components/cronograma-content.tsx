"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import { addDays, format, startOfWeek, isSameDay, isToday, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { CheckinWizard } from "@/components/checkin-wizard"
import { ChevronLeft, ChevronRight, Plus, Lock, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ReservationPopover } from "./reservation-popover"
import { NewReservationModal } from "./new-reservation-modal"
import { RateModifierModal } from "./rate-modifier-modal"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import api from "@/lib/api" // Tu cliente Axios

// Importamos los tipos centralizados y los visuales
import {
  Room as RoomType,
  ReservationDto as ReservationType,
  BackendReservationStatus,
  VisualReservationStatus,
  BackendRoomStatus
} from "@/types"

// --- TYPES LOCALES PARA LA VISTA ---
type ViewMode = "day" | "week" | "month"

export type ReservationSegment = {
  roomId: string
  startDate: Date
  endDate: Date
}

// Extendemos el tipo base para añadir lógica visual del cronograma
export type TimelineReservation = {
  id: string
  guestName: string
  guestId?: string
  segments: ReservationSegment[] // El backend manda 1, pero el frontend soporta varios (cambios de cuarto)
  status: VisualReservationStatus // Usamos el estado visual (colores)
  totalValue: number
  paidAmount: number
  checkInTime?: Date
}

type FloorGroup = {
  name: string
  rooms: RoomType[]
}

// --- UTILIDADES VISUALES ---
const formatPriceShort = (price: number) => {
  if (price >= 1000000) return `${(price / 1000000).toFixed(1).replace(/\.0$/, '')}M`
  if (price >= 1000) return `${(price / 1000).toFixed(0)}k`
  return price.toString()
}

const getStatusStyles = (status: VisualReservationStatus) => {
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
    case "history":
      return "bg-gray-100 text-gray-500 border-l-gray-400 dark:bg-gray-800 dark:text-gray-500 dark:border-l-gray-600 border-l-4 opacity-70"
    default:
      return "bg-gray-500"
  }
}

const getCategoryColor = (category: string) => {
  // Normalizamos para comparar sin importar mayúsculas/minúsculas
  const cat = category.toLowerCase()
  if (cat.includes("estándar") || cat.includes("standard")) return "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:border-blue-400/20 dark:bg-blue-400/5"
  if (cat.includes("superior")) return "text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:border-purple-400/20 dark:bg-purple-400/5"
  if (cat.includes("deluxe")) return "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:border-amber-400/20 dark:bg-amber-400/5"
  if (cat.includes("suite")) return "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:border-rose-400/20 dark:bg-rose-400/5"
  return "text-gray-400"
}

// Función auxiliar para mapear estado Backend -> Visual
const mapBackendStatus = (status: BackendReservationStatus): VisualReservationStatus => {
  switch (status) {
    case "CheckedIn": return "check_in_debt"
    case "Confirmed": return "confirmed_deposit"
    case "Pending": return "confirmed_no_deposit"
    case "CheckedOut": return "history" // <--- NUEVO ESTADO VISUAL
    case "Cancelled":
    case "NoShow": return "available"
    default: return "available"
  }
}

export function CronogramaContent() {
  // Estados de datos
  const [rooms, setRooms] = useState<RoomType[]>([])
  const [floors, setFloors] = useState<FloorGroup[]>([])
  const [reservations, setReservations] = useState<TimelineReservation[]>([])
  const [loading, setLoading] = useState(true)

  // Estados de UI
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null)

  const [draggedSegment, setDraggedSegment] = useState<{
    reservationId: string
    segmentIndex: number
    originalRoomId: string
  } | null>(null)

  const [customPrices, setCustomPrices] = useState<Record<string, number>>({})
  const [checkinWizardData, setCheckinWizardData] = useState<{ isOpen: boolean; reservation: TimelineReservation | null } | null>(null)
  const [newReservationModal, setNewReservationModal] = useState<{ isOpen: boolean; roomId: string; date: Date; type: "reservation" | "block" } | null>(null)
  const [rateModalOpen, setRateModalOpen] = useState(false)

  const gridRef = useRef<HTMLDivElement>(null)

  // --- CARGA DE DATOS REALES ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [roomsRes, resRes] = await Promise.all([
          api.get<RoomType[]>('/rooms'),
          api.get<any[]>('/reservations') // Usamos any temporalmente para el mapping flexible
        ])

        // 1. Procesar Habitaciones y agrupar por Pisos
        const sortedRooms = roomsRes.data.sort((a, b) => a.number.localeCompare(b.number))
        setRooms(sortedRooms)

        const groups: Record<string, RoomType[]> = {}
        sortedRooms.forEach(room => {
          const floorNum = room.number.charAt(0) // Ej: "1" de "101"
          const floorName = `Piso ${floorNum}`
          if (!groups[floorName]) groups[floorName] = []
          groups[floorName].push(room)
        })

        const floorGroups: FloorGroup[] = Object.entries(groups).map(([name, rooms]) => ({ name, rooms }))
        setFloors(floorGroups.sort((a, b) => a.name.localeCompare(b.name)))

        // 2. Procesar Reservas
        const mappedReservations: TimelineReservation[] = resRes.data
            .filter(r => r.status !== "Cancelled")
            .map(r => ({
              id: r.id,
              guestName: r.mainGuestName || "Huésped",
              guestId: r.mainGuestId,
              status: mapBackendStatus(r.status),
              totalValue: r.totalAmount || 0, // Si el backend no calcula, poner 0
              paidAmount: 0, // Pendiente implementar pagos en backend
              segments: [{
                roomId: r.roomId,
                startDate: parseISO(r.startDate),
                endDate: parseISO(r.endDate)
              }]
            }))

        // 3. Crear Bloqueos Visuales para Habitaciones en Mantenimiento/Bloqueadas
        const maintenanceBlocks: TimelineReservation[] = sortedRooms
            .filter(r => r.status === "Maintenance" || r.status === "Blocked")
            .map(r => ({
              id: `block-${r.id}`,
              guestName: r.status === "Maintenance" ? "MANTENIMIENTO" : "BLOQUEADA",
              status: "blocked",
              totalValue: 0,
              paidAmount: 0,
              segments: [{
                roomId: r.id,
                startDate: startOfMonth(currentDate), // Bloqueo visual todo el mes
                endDate: endOfMonth(currentDate)
              }]
            }))

        setReservations([...mappedReservations, ...maintenanceBlocks])

      } catch (error) {
        console.error("Error loading timeline:", error)
        toast.error("Error al cargar datos del cronograma")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentDate]) // Recargar si cambia el mes para actualizar bloqueos dinámicos

  // --- LÓGICA DE NEGOCIO ---

  const getRoomPrice = (room: RoomType, date: Date) => {
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
    toast.success("Tarifas actualizadas localmente")
  }

  const handleDragStart = (reservationId: string, segmentIndex: number, originalRoomId: string) => {
    setDraggedSegment({ reservationId, segmentIndex, originalRoomId })
  }

  const handleDrop = async (targetRoomId: string) => {
    if (!draggedSegment) return

    // Optimistic Update
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

    // TODO: Llamar al backend para actualizar roomId
    // await api.patch(`/reservations/${draggedSegment.reservationId}`, { roomId: targetRoomId })

    setDraggedSegment(null)
    toast.success("Habitación actualizada (Solo visual por ahora)")
  }

  // --- LÓGICA DE FECHAS ---
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
    // Nota: endDate es exclusivo en lógica de intervalos pero inclusivo visualmente para reservas de hotel
    // Ajuste: si sale el día 5, ocupa la noche del 4.
    // Para simplificar visualización: mostramos hasta el día previo al checkout o medio bloque.

    let endIndexRaw = days.findIndex((d) => isSameDay(d, endDate))
    if (endIndexRaw === -1 && endDate > days[days.length - 1]) endIndexRaw = days.length

    if (endDate <= days[0] || startDate > days[days.length - 1]) return { width: 0, left: 0, isHidden: true }

    const actualStart = startIndex >= 0 ? startIndex : 0
    const actualEnd = endIndexRaw >= 0 ? endIndexRaw : days.length

    // Calculamos duración en días visibles
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

    // Actualizar estado localmente y en backend (el wizard ya llama al backend usualmente)
    setReservations(prev => prev.map(r => r.id === checkinWizardData.reservation!.id ? { ...r, status: "check_in_paid", checkInTime: new Date() } : r))
    setCheckinWizardData(null)
    toast.success("Check-in completado visualmente")
  }

  if (loading) return <div className="flex h-full items-center justify-center text-muted-foreground">Cargando cronograma...</div>

  return (
      <div className="space-y-4 h-full flex flex-col bg-background text-foreground p-2">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Cronograma</h1>
            <p className="text-xs text-muted-foreground">Gestión de ocupación y tarifas</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
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
                className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              <Plus className="h-4 w-4 mr-1" /> Crear
            </Button>
          </div>
        </div>

        {/* NAVEGACIÓN */}
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

        {/* GRID */}
        <div className="rounded-lg border border-border bg-background flex-1 flex flex-col overflow-hidden shadow-sm relative">
          <div ref={gridRef} className="flex-1 overflow-auto custom-scrollbar">
            <div className="min-w-max">

              {/* HEADER DÍAS */}
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
                {floors.length === 0 && (
                    <div className="p-8 text-center text-muted-foreground">No hay habitaciones registradas</div>
                )}

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
                                className="flex border-b border-border/50 h-[72px] relative hover:bg-accent/30 group transition-colors"
                            >

                              {/* INFO HABITACIÓN */}
                              <div className="w-[180px] shrink-0 border-r border-border px-4 flex flex-col justify-center sticky left-0 z-10 bg-background group-hover:bg-card transition-colors">
                                <div className="flex items-center justify-between w-full mb-1">
                                  <span className="text-xl font-bold text-foreground">{room.number}</span>
                                  <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 rounded-sm truncate max-w-[80px]", getCategoryColor(room.category))}>
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

                              {/* CELDAS DE DÍAS */}
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

                                {/* BARRAS DE RESERVA (DRAGGABLE) */}
                                {roomSegments.map(({ reservation, segment, idx }) => {
                                  const style = getReservationStyle(segment.startDate, segment.endDate)
                                  if (style.isHidden) return null;

                                  return (
                                      <ReservationPopover
                                          key={`${reservation.id}-${idx}`}
                                          reservation={reservation} // Pasamos la reserva completa
                                          segment={segment}
                                          segmentIndex={idx}
                                          isOpen={selectedReservation === `${reservation.id}-${idx}`}
                                          onOpenChange={(open) => setSelectedReservation(open ? `${reservation.id}-${idx}` : null)}
                                          onCheckIn={() => handleCheckIn(reservation.id)}
                                          onCheckOut={() => {}}
                                          onCancel={() => {}}
                                      >
                                        <div
                                            draggable={reservation.status !== "blocked"}
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
                                        {/* TODO: Lógica de pago real */}
                                        {reservation.paidAmount >= reservation.totalValue && reservation.totalValue > 0
                                            ? "Pagado"
                                            : "Pendiente"}
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

        {/* MODALES */}
        <RateModifierModal
            isOpen={rateModalOpen}
            onClose={() => setRateModalOpen(false)}
            onSave={handleSaveRates}
            roomCategories={Array.from(new Set(rooms.map(r => r.category)))}
        />

        {newReservationModal && (
            <NewReservationModal
                isOpen={newReservationModal.isOpen}
                onClose={() => setNewReservationModal(null)}
                initialRoomId={newReservationModal.roomId}
                initialDate={newReservationModal.date}
                type={newReservationModal.type as any}
                rooms={rooms}
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
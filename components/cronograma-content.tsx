"use client"

import { useState, useRef, useMemo, useEffect } from "react"
import {
  addDays,
  format,
  startOfWeek,
  isSameDay,
  isToday,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
  isValid,
  startOfDay
} from "date-fns"
import { es } from "date-fns/locale"
import { CheckInWizard } from "@/components/checkin-wizard"
import { ChevronLeft, ChevronRight, Plus, Lock, DollarSign, Calendar as CalendarIcon, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { ReservationPopover } from "./reservation-popover"
import { NewReservationModal } from "./new-reservation-modal"
import { RateModifierModal } from "./rate-modifier-modal"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import api, { reservationsApi } from "@/lib/api"

// Importamos los tipos centralizados
import {
  Room as RoomType,
} from "@/types"

// --- TYPES LOCALES ---
type ViewMode = "day" | "week" | "month"

export type VisualReservationStatus =
    | "check_in_paid"
    | "check_in_debt"
    | "confirmed_deposit"
    | "confirmed_no_deposit"
    | "blocked"
    | "history"
    | "available"

export type ReservationSegment = {
  roomId: string
  startDate: Date
  endDate: Date
}

export type TimelineReservation = {
  id: string
  guestName: string
  guestId?: string
  confirmationCode: string
  segments: ReservationSegment[]
  status: VisualReservationStatus
  totalValue: number
  paidAmount: number
  balance?: number
  checkInTime?: Date
  adults?: number
  children?: number
}

type FloorGroup = {
  name: string
  rooms: RoomType[]
}

// --- HELPER PARA EXTRAER DATOS ---
const extractData = (response: any): any[] => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (response.data && Array.isArray(response.data)) return response.data;
  if (response.result && Array.isArray(response.result)) return response.result;
  console.warn("Formato de datos no reconocido:", response);
  return [];
}

// Lógica inteligente de estado visual financiero
const determineVisualStatus = (
    backendStatus: string,
    balance: number,
    paidAmount: number
): VisualReservationStatus => {
  if (backendStatus === "Blocked") return "blocked"
  if (backendStatus === "Cancelled") return "history"
  if (backendStatus === "CheckedOut") return "history"

  if (backendStatus === "CheckedIn") {
    return balance <= 100 ? "check_in_paid" : "check_in_debt"
  }

  if (backendStatus === "Confirmed" || backendStatus === "Pending") {
    return paidAmount > 0 ? "confirmed_deposit" : "confirmed_no_deposit"
  }

  return "available"
}

// --- UTILIDADES VISUALES (Adaptado a variables CSS de Tailwind) ---
const formatPriceShort = (price: number) => {
  if (price >= 1000000) return `${(price / 1000000).toFixed(1).replace(/\.0$/, '')}M`
  if (price >= 1000) return `${(price / 1000).toFixed(0)}k`
  return price.toString()
}

const getStatusStyles = (status: VisualReservationStatus) => {
  switch (status) {
    case "check_in_paid":
      return "bg-emerald-100 text-emerald-900 border-l-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-50 dark:border-l-emerald-400 border-l-4 hover:bg-emerald-200 dark:hover:bg-emerald-500/40 shadow-sm"
    case "check_in_debt":
      return "bg-rose-100 text-rose-900 border-l-rose-600 dark:bg-rose-500/25 dark:text-rose-50 dark:border-l-rose-400 border-l-4 hover:bg-rose-200 dark:hover:bg-rose-500/40 shadow-sm"
    case "confirmed_deposit":
      return "bg-blue-100 text-blue-900 border-l-blue-600 dark:bg-blue-500/25 dark:text-blue-50 dark:border-l-blue-400 border-l-4 hover:bg-blue-200 dark:hover:bg-blue-500/40 shadow-sm"
    case "confirmed_no_deposit":
      return "bg-orange-100 text-orange-900 border-l-orange-600 dark:bg-orange-500/25 dark:text-orange-50 dark:border-l-orange-400 border-l-4 hover:bg-orange-200 dark:hover:bg-orange-500/40 shadow-sm"
    case "blocked":
      return "bg-gray-200 text-gray-800 border-l-gray-500 dark:bg-gray-700/50 dark:text-gray-200 dark:border-l-gray-400 border-l-4 hover:bg-gray-300 dark:hover:bg-gray-700/70 grayscale pattern-diagonal-lines shadow-sm"
    case "history":
      return "bg-gray-100 text-gray-500 border-l-gray-400 dark:bg-gray-800/80 dark:text-gray-400 dark:border-l-gray-600 border-l-4 opacity-70 shadow-sm"
    default:
      return "bg-primary text-primary-foreground"
  }
}

const getCategoryColor = (category: string | undefined) => {
  const cat = (category || "").toLowerCase()
  if (cat.includes("estándar") || cat.includes("standard")) return "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:border-blue-400/20 dark:bg-blue-400/5"
  if (cat.includes("superior")) return "text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-400 dark:border-purple-400/20 dark:bg-purple-400/5"
  if (cat.includes("deluxe") || cat.includes("triple")) return "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-400 dark:border-amber-400/20 dark:bg-amber-400/5"
  if (cat.includes("suite") || cat.includes("familiar")) return "text-rose-700 bg-rose-50 border-rose-200 dark:text-rose-400 dark:border-rose-400/20 dark:bg-rose-400/5"
  return "text-muted-foreground bg-muted border-border"
}

export function CronogramaContent() {
  const [rooms, setRooms] = useState<RoomType[]>([])
  const [floors, setFloors] = useState<FloorGroup[]>([])
  const [reservations, setReservations] = useState<TimelineReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // UI State
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null)
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({})

  // Modals
  const [checkinWizardData, setCheckinWizardData] = useState<{ isOpen: boolean; reservation: TimelineReservation | null } | null>(null)
  const [newReservationModal, setNewReservationModal] = useState<{ isOpen: boolean; roomId: string; date: Date; type: "reservation" | "block" } | null>(null)
  const [rateModalOpen, setRateModalOpen] = useState(false)

  // Estado para la confirmación de cancelación
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null)

  const gridRef = useRef<HTMLDivElement>(null)

  // --- FETCHING ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const [roomsRes, resRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/reservations')
        ])

        const roomsRaw = extractData(roomsRes)
        const sortedRooms: RoomType[] = roomsRaw.map((dto: any) => ({
          id: dto.id,
          number: dto.number,
          category: dto.category,
          status: dto.status,
          floor: dto.floor || 1,
          basePrice: dto.basePrice
        })).sort((a: any, b: any) =>
            a.floor === b.floor ? a.number.localeCompare(b.number) : a.floor - b.floor
        )

        setRooms(sortedRooms)

        const groups: Record<string, RoomType[]> = {}
        sortedRooms.forEach(room => {
          const floorName = `Piso ${room.floor}`
          if (!groups[floorName]) groups[floorName] = []
          groups[floorName].push(room)
        })
        const floorGroups = Object.entries(groups).map(([name, rooms]) => ({ name, rooms }))
        setFloors(floorGroups.sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)))

        const reservationsRaw = extractData(resRes)

        const mappedReservations: TimelineReservation[] = reservationsRaw
            .filter((r: any) => r.status !== "Cancelled")
            .map((r: any) => {
              let segments: ReservationSegment[] = []

              if (r.segments && Array.isArray(r.segments) && r.segments.length > 0) {
                segments = r.segments.map((s: any) => ({
                  roomId: s.roomId,
                  startDate: parseISO(s.start),
                  endDate: parseISO(s.end)
                }))
                    // ORDENAMIENTO CRÍTICO: Sincroniza los índices del Frontend con el Backend para N-Splits
                    .sort((a: ReservationSegment, b: ReservationSegment) => a.startDate.getTime() - b.startDate.getTime())
              }
              else if (r.roomId) {
                const start = r.checkIn ? parseISO(r.checkIn) : new Date()
                const end = r.checkOut ? parseISO(r.checkOut) : addDays(new Date(), 1)
                segments.push({
                  roomId: r.roomId,
                  startDate: isValid(start) ? start : new Date(),
                  endDate: isValid(end) ? end : addDays(new Date(), 1)
                })
              }

              return {
                id: r.id,
                guestName: r.mainGuestName || "Huésped",
                guestId: r.mainGuestId,
                confirmationCode: r.code || r.confirmationCode || "???",
                status: determineVisualStatus(r.status, r.balance || 0, r.paidAmount || 0),
                totalValue: r.totalAmount || 0,
                paidAmount: r.paidAmount || 0,
                balance: r.balance,
                adults: r.adults,
                children: r.children,
                segments: segments
              }
            })
            .filter(r => r.segments.length > 0)

        const maintenanceBlocks: TimelineReservation[] = sortedRooms
            .filter(r => r.status === "Maintenance" || r.status === "Blocked")
            .map(r => ({
              id: `block-${r.id}`,
              guestName: r.status === "Maintenance" ? "MANTENIMIENTO" : "BLOQUEADA",
              confirmationCode: "BLK",
              status: "blocked",
              totalValue: 0,
              paidAmount: 0,
              segments: [{
                roomId: r.id,
                startDate: startOfMonth(currentDate),
                endDate: endOfMonth(currentDate)
              }]
            }))

        setReservations([...mappedReservations, ...maintenanceBlocks])

      } catch (error) {
        console.error("Error loading timeline:", error)
        toast.error("Error cargando datos del cronograma")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentDate, refreshTrigger])

  // --- LOGIC ---
  const getRoomPrice = (room: RoomType, date: Date) => {
    const key = `${room.id}-${format(date, "yyyy-MM-dd")}`
    return customPrices[key] || room.basePrice
  }

  // --- CHECK OCCUPANCY ---
  const isDateOccupied = (roomId: string, date: Date) => {
    const targetDate = startOfDay(date);
    return reservations.some(res =>
        res.segments.some(seg => {
          if (seg.roomId !== roomId) return false;
          const start = startOfDay(seg.startDate);
          const end = startOfDay(seg.endDate);
          return targetDate.getTime() >= start.getTime() && targetDate.getTime() < end.getTime();
        })
    )
  }

  // --- DATE LOGIC ---
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

  const navigate = (dir: number) => {
    const amount = viewMode === "day" ? 1 : viewMode === "week" ? 7 : 30
    setCurrentDate(d => addDays(d, amount * dir))
  }

  const getReservationStyle = (startDate: Date, endDate: Date) => {
    let startIndex = days.findIndex(d => isSameDay(d, startDate))

    if (startIndex === -1 && startDate < days[0] && endDate > days[0]) {
      startIndex = 0
    }

    let endIndex = days.findIndex(d => isSameDay(d, endDate))
    if (endIndex === -1 && endDate > days[days.length - 1]) {
      endIndex = days.length
    }

    if (startIndex === -1 && endIndex === -1) return { width: 0, left: 0, isHidden: true }
    if (startIndex === -1) return { width: 0, left: 0, isHidden: true }

    const visualEnd = endIndex === 0 ? 0 : endIndex
    const width = Math.max(1, visualEnd - startIndex)

    return { width, left: startIndex, isHidden: false }
  }

  // --- ACCIONES DE BACKEND ---
  const handleCheckIn = (reservationId: string) => {
    const res = reservations.find(r => r.id === reservationId)
    if (res && res.segments.length > 0) {
      setCheckinWizardData({ isOpen: true, reservation: res })
      setSelectedReservation(null)
    }
  }

  const handleCheckOut = async (id: string) => {
    try {
      await reservationsApi.checkout(id)
      toast.success("Check-out realizado exitosamente")
      setRefreshTrigger(prev => prev + 1)
      setSelectedReservation(null)
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error(`Deuda pendiente: ${error.response.data.message}`)
      } else {
        toast.error(error.response?.data?.message || "Error al realizar check-out")
      }
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await reservationsApi.cancel(id)
      toast.success("Reserva cancelada exitosamente")
      setRefreshTrigger(prev => prev + 1)
      setSelectedReservation(null)
      setCancelConfirmId(null)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al cancelar la reserva")
    }
  }

  const handleSplit = async (reservationId: string, segmentIndex: number) => {
    const res = reservations.find(r => r.id === reservationId);
    if (!res) return;

    const seg = res.segments[segmentIndex];
    const totalDays = Math.round((seg.endDate.getTime() - seg.startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (totalDays <= 1) {
      toast.error("El segmento es de solo 1 noche, no se puede dividir más.");
      return;
    }

    const splitDate = addDays(seg.startDate, Math.floor(totalDays / 2));

    try {
      await reservationsApi.split(reservationId, {
        segmentIndex,
        splitDate: format(splitDate, 'yyyy-MM-dd'),
        newRoomId: null
      });
      toast.success("Reserva fragmentada exitosamente");
      setRefreshTrigger(prev => prev + 1);
      setSelectedReservation(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al dividir reserva");
    }
  }

  const handleMerge = async (id: string) => {
    try {
      await reservationsApi.merge(id)
      toast.success("Segmentos unificados exitosamente")
      setRefreshTrigger(prev => prev + 1)
      setSelectedReservation(null)
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error al unificar segmentos")
    }
  }

  const handleDrop = async (e: React.DragEvent, newRoomId: string) => {
    e.preventDefault();
    const dataString = e.dataTransfer.getData("application/json");
    if (!dataString) return;

    try {
      const { resId, segmentIdx } = JSON.parse(dataString);
      await reservationsApi.moveSegment(resId, segmentIdx, newRoomId);
      toast.success("Reserva movida exitosamente");
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "La habitación destino está ocupada");
    }
  }

  if (loading) return (
      <div className="flex h-full items-center justify-center space-x-2 text-muted-foreground animate-pulse">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span>Cargando Cronograma Zafiro...</span>
      </div>
  )

  return (
      <div className="space-y-4 h-full flex flex-col bg-background text-foreground p-2">
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cronograma</h1>
            <p className="text-xs text-muted-foreground">Gestión de ocupación y tarifas</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setRateModalOpen(true)}>
              <DollarSign className="h-4 w-4 mr-2" /> Tarifas
            </Button>

            <div className="flex items-center rounded-lg border bg-card p-1">
              {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                  <Button
                      key={mode}
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewMode(mode)}
                      className={cn("h-7 px-3 text-xs capitalize", viewMode === mode && "bg-primary text-primary-foreground")}
                  >
                    {mode === "day" ? "Día" : mode === "week" ? "Semana" : "Mes"}
                  </Button>
              ))}
            </div>

            <Button size="sm" onClick={() => setNewReservationModal({ isOpen: true, roomId: "", date: currentDate, type: "reservation" })}>
              <Plus className="h-4 w-4 mr-1" /> Crear
            </Button>
          </div>
        </div>

        {/* CONTROLES NAVEGACIÓN */}
        <div className="flex items-center justify-between shrink-0 bg-card p-2 rounded-md border">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-bold capitalize flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            {format(currentDate, "MMMM yyyy", { locale: es })}
          </span>
          <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* GRID PRINCIPAL */}
        <div className="rounded-lg border bg-card flex-1 flex flex-col overflow-hidden shadow-sm relative">
          <div ref={gridRef} className="flex-1 overflow-auto custom-scrollbar">
            <div className="min-w-max">

              {/* HEADER DÍAS */}
              <div className="flex sticky top-0 z-40 bg-card shadow-sm border-b">
                <div className="w-[180px] shrink-0 border-r p-3 sticky left-0 z-50 bg-card flex items-center justify-between border-b shadow-[4px_0_10px_-5px_rgba(0,0,0,0.1)]">
                  <span className="text-xs font-semibold">Habitación</span>
                </div>
                <div className="flex">
                  {days.map((day, idx) => (
                      <div key={idx} className={cn(
                          "min-w-[48px] w-12 border-r py-2 text-center flex flex-col justify-center transition-colors duration-300",
                          // Marcador nativo del DÍA ACTUAL (Usa el color primario de global.css)
                          isToday(day) ? "bg-primary/10 border-b-2 border-b-primary text-primary" : "bg-card"
                      )}>
                        <span className={cn("text-[10px] uppercase font-medium", isToday(day) ? "text-primary" : "text-muted-foreground")}>
                          {format(day, "EEE", { locale: es })}
                        </span>
                        <span className={cn("text-sm font-bold", isToday(day) ? "text-primary" : "")}>
                          {format(day, "d")}
                        </span>
                      </div>
                  ))}
                </div>
              </div>

              {/* FILAS */}
              <div className="pb-4">
                {floors.map((floor) => (
                    <div key={floor.name}>
                      {/* SEPARADOR PISO */}
                      <div className="flex sticky left-0 w-full z-20 border-y bg-muted/50">
                        <div className="w-[180px] shrink-0 sticky left-0 z-30 bg-muted border-r px-4 py-1 flex items-center shadow-[4px_0_10px_-5px_rgba(0,0,0,0.1)]">
                          <span className="text-[10px] font-bold uppercase text-primary">{floor.name}</span>
                        </div>
                        <div className="flex-1 bg-muted/50 py-1"></div>
                      </div>

                      {floor.rooms.map((room) => {
                        const roomSegments = reservations.flatMap(res =>
                            res.segments.map((seg, idx) => ({ reservation: res, segment: seg, idx }))
                                .filter(item => item.segment.roomId === room.id)
                        )

                        return (
                            <div key={room.id} className="flex border-b h-[72px] relative group bg-background">
                              {/* COLUMNA INFO */}
                              <div className="w-[180px] shrink-0 border-r px-4 flex flex-col justify-center sticky left-0 z-30 bg-background group-hover:bg-accent/50 transition-colors shadow-[4px_0_10px_-5px_rgba(0,0,0,0.1)]">
                                <div className="flex items-center justify-between w-full mb-1">
                                  <span className="text-xl font-bold">{room.number}</span>
                                  <Badge variant="outline" className={cn("text-[9px] px-1 py-0", getCategoryColor(room.category))}>
                                    {room.category}
                                  </Badge>
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                    ${formatPriceShort(getRoomPrice(room, new Date()))}
                                </span>
                              </div>

                              {/* GRID DÍAS (DROP ZONES) */}
                              <div className="flex relative z-0">
                                {days.map((day, idx) => {
                                  const isOccupied = isDateOccupied(room.id, day);
                                  return (
                                      <div
                                          key={idx}
                                          // DRAG & DROP LOGIC
                                          onDragOver={(e) => { if (!isOccupied) e.preventDefault() }}
                                          onDrop={(e) => { if (!isOccupied) handleDrop(e, room.id) }}
                                          className={cn(
                                              "min-w-[48px] w-12 border-r transition-colors duration-300",
                                              // Sombra/Fondo nativo del DÍA ACTUAL dentro de la celda de la matriz
                                              isToday(day) && !isOccupied && "bg-primary/5 ring-1 ring-inset ring-primary/20",
                                              isOccupied
                                                  ? (isToday(day) ? "bg-muted/30 cursor-not-allowed opacity-50 ring-1 ring-inset ring-primary/20" : "bg-muted/10 cursor-not-allowed opacity-50")
                                                  : "cursor-pointer hover:bg-accent"
                                          )}
                                          onClick={() => !isOccupied && setNewReservationModal({ isOpen: true, roomId: room.id, date: day, type: "reservation" })}
                                      />
                                  )
                                })}

                                {/* BARRAS DE RESERVA */}
                                {roomSegments.map(({ reservation, segment, idx }) => {
                                  const style = getReservationStyle(segment.startDate, segment.endDate)
                                  if (style.isHidden) return null;

                                  return (
                                      <ReservationPopover
                                          key={`${reservation.id}-${idx}`}
                                          reservation={reservation as any}
                                          segment={segment}
                                          segmentIndex={idx}
                                          isOpen={selectedReservation === `${reservation.id}-${idx}`}
                                          onOpenChange={(open) => setSelectedReservation(open ? `${reservation.id}-${idx}` : null)}
                                          onCheckIn={() => handleCheckIn(reservation.id)}
                                          onCheckOut={() => handleCheckOut(reservation.id)}
                                          onCancel={() => setCancelConfirmId(reservation.id)} // Intercepta para abrir el modal
                                          onSplit={handleSplit}
                                          onMerge={handleMerge}
                                      >
                                        <div
                                            draggable={reservation.status !== "history" && reservation.status !== "blocked"}
                                            onDragStart={(e) => {
                                              e.dataTransfer.setData("application/json", JSON.stringify({ resId: reservation.id, segmentIdx: idx }));
                                              e.dataTransfer.effectAllowed = "move";
                                            }}
                                            className={cn(
                                                "absolute top-1 bottom-1 m-auto rounded-md shadow-sm text-[10px] font-medium flex flex-col justify-center px-2 cursor-grab active:cursor-grabbing transition-all overflow-hidden whitespace-nowrap select-none",
                                                "z-10 hover:z-20 hover:scale-[1.02]",
                                                getStatusStyles(reservation.status)
                                            )}
                                            style={{
                                              left: `${style.left * 48}px`,
                                              width: `${style.width * 48}px`,
                                            }}
                                        >
                                          <div className="flex items-center gap-1 font-bold truncate">
                                            {reservation.status === "blocked" && <Lock className="h-3 w-3" />}
                                            {reservation.guestName}
                                          </div>
                                          {style.width > 1 && reservation.status !== "blocked" && (
                                              <div className="opacity-80 text-[9px] flex justify-between">
                                                <span>{reservation.confirmationCode}</span>
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

        {/* LEYENDA (Usando Tailwind estático y seguro para temas) */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] sm:text-xs bg-card py-2 px-4 rounded-full border border-border w-fit mx-auto shadow-sm shrink-0">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> <span className="text-muted-foreground">Al día</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-destructive"></div> <span className="text-muted-foreground">Deuda</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> <span className="text-muted-foreground">Confirmada</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div> <span className="text-muted-foreground">Pendiente</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-muted-foreground"></div> <span className="text-muted-foreground">Historial/Bloq</span></div>
        </div>

        {/* MODALES & WIZARDS */}
        <RateModifierModal
            isOpen={rateModalOpen}
            onClose={() => setRateModalOpen(false)}
            onSave={() => {}}
            roomCategories={Array.from(new Set(rooms.map(r => r.category as string)))}
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

        {checkinWizardData && checkinWizardData.reservation && checkinWizardData.reservation.segments.length > 0 && (
            <CheckInWizard
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
            />
        )}

        {/* DIALOGO DE CONFIRMACIÓN DE CANCELACIÓN (Nativo de UI y destructivo) */}
        <Dialog open={!!cancelConfirmId} onOpenChange={(open) => !open && setCancelConfirmId(null)}>
          <DialogContent className="sm:max-w-md bg-card">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Confirmar Cancelación
              </DialogTitle>
              <DialogDescription className="pt-2 text-base text-foreground">
                ¿Estás completamente seguro de que deseas cancelar esta reserva?
                <br /><br />
                <span className="text-muted-foreground">Esta acción no se puede deshacer y la habitación quedará libre inmediatamente en el cronograma.</span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setCancelConfirmId(null)}>
                Volver
              </Button>
              <Button
                  variant="destructive"
                  onClick={() => { if(cancelConfirmId) handleCancel(cancelConfirmId) }}
              >
                Sí, Cancelar Reserva
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
  )
}
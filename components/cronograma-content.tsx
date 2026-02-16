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
import { RateModifierModal, RateModifierPayload } from "./rate-modifier-modal"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import api, { reservationsApi } from "@/lib/api"

// Importamos los tipos centralizados
import {
  Room as RoomType,
} from "@/types"
import {getColombiaHolidays} from "@/lib/colombia-holidays";

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

// --- UTILIDADES VISUALES ---
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

  // --- FIX: Estado para controlar qué reserva se está arrastrando ---
  const [draggingId, setDraggingId] = useState<string | null>(null)

  // UI State
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [selectedReservation, setSelectedReservation] = useState<string | null>(null)
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({})

  // Modals
  const [checkinWizardData, setCheckinWizardData] = useState<{ isOpen: boolean; reservation: TimelineReservation | null } | null>(null)
  const [newReservationModal, setNewReservationModal] = useState<{ isOpen: boolean; roomId: string; date: Date; type: "reservation" | "block" } | null>(null)
  const [rateModalOpen, setRateModalOpen] = useState(false)
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null)

  const gridRef = useRef<HTMLDivElement>(null)

  const holidaysMap = useMemo(() => {
    // Calculamos festivos del año actual y el siguiente por si el usuario navega entre diciembre/enero
    const currentYear = currentDate.getFullYear();
    const nextYear = currentYear + 1;
    const prevYear = currentYear - 1;

    return {
      ...getColombiaHolidays(prevYear),
      ...getColombiaHolidays(currentYear),
      ...getColombiaHolidays(nextYear)
    };
  }, [currentDate]);

  useEffect(() => {
    const handleRefresh = () => setRefreshTrigger(prev => prev + 1);
    window.addEventListener("refresh-timeline", handleRefresh);
    return () => window.removeEventListener("refresh-timeline", handleRefresh);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [roomsRes, resRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/reservations')
        ])

        const roomsRaw = extractData(roomsRes)
        const pricesMap: Record<string, number> = {};

        const sortedRooms: RoomType[] = roomsRaw.map((dto: any) => {
          if (dto.priceOverrides && Array.isArray(dto.priceOverrides)) {
            dto.priceOverrides.forEach((override: any) => {
              const dateStr = override.date.split('T')[0];
              pricesMap[`${dto.id}-${dateStr}`] = override.price;
            });
          }
          return {
            id: dto.id,
            number: dto.number,
            category: dto.category,
            status: dto.status,
            floor: dto.floor || 1,
            basePrice: dto.basePrice
          }
        }).sort((a: any, b: any) =>
            a.floor === b.floor ? a.number.localeCompare(b.number) : a.floor - b.floor
        )

        setRooms(sortedRooms)
        setCustomPrices(pricesMap)

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
                    .sort((a: ReservationSegment, b: ReservationSegment) => a.startDate.getTime() - b.startDate.getTime())
              } else if (r.roomId) {
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

  const getRoomPrice = (room: RoomType, date: Date) => {
    const key = `${room.id}-${format(date, "yyyy-MM-dd")}`
    return customPrices[key] || room.basePrice
  }

  // --- FIX: Logic Conflict ---
  // Acepta excludeReservationId para ignorar la reserva que estamos moviendo actualmente
  const isDateOccupied = (roomId: string, date: Date, excludeReservationId?: string | null) => {
    const targetDate = startOfDay(date);
    return reservations.some(res => {
      // Si esta es la reserva que estoy arrastrando, la ignoro (es como si estuviera flotando)
      if (excludeReservationId && res.id === excludeReservationId) return false;

      return res.segments.some(seg => {
        if (seg.roomId !== roomId) return false;
        const start = startOfDay(seg.startDate);
        const end = startOfDay(seg.endDate);
        // Ocupa [start, end)
        return targetDate.getTime() >= start.getTime() && targetDate.getTime() < end.getTime();
      })
    })
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

  const handleSaveRates = async (payload: RateModifierPayload) => {
    try {
      await api.post('/rooms/rates', payload);
      toast.success("Tarifas especiales guardadas y aplicadas.");
      setRateModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Ocurrió un error guardando las tarifas");
    }
  }

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

    // Limpiamos el estado de drag visual
    setDraggingId(null);

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

        <div className="rounded-lg border bg-card flex-1 flex flex-col overflow-hidden shadow-sm relative">
          <div ref={gridRef} className="flex-1 overflow-auto custom-scrollbar">
            <div className="min-w-max">
              <div className="flex sticky top-0 z-40 bg-card shadow-sm border-b">
                <div
                    className="w-[180px] shrink-0 border-r p-3 sticky left-0 z-50 bg-card flex items-center justify-between border-b shadow-[4px_0_10px_-5px_rgba(0,0,0,0.1)]">
                  <span className="text-xs font-semibold">Habitación</span>
                </div>
                <div className="flex">
                  {days.map((day, idx) => {
                    const dayKey = format(day, "yyyy-MM-dd");
                    const holidayName = holidaysMap[dayKey]; // ¿Es festivo?
                    const isHoliday = !!holidayName;

                    return (
                        <div key={idx} className={cn(
                            "min-w-[48px] w-12 border-r py-2 text-center flex flex-col justify-center transition-all duration-300 relative group/header", // Agregué group/header para tooltip
                            isToday(day)
                                ? "bg-primary text-primary-foreground border-b-2 border-primary shadow-md relative z-10"
                                : isHoliday
                                    ? "bg-red-50 text-red-900 border-b-red-200" // ESTILO FESTIVO
                                    : "bg-card text-foreground"
                        )}>
                          {/* Tooltip nativo simple para el nombre del festivo */}
                          {isHoliday && (
                              <div
                                  className="absolute -top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] px-2 py-1 rounded shadow-lg opacity-0 group-hover/header:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                {holidayName}
                                <div
                                    className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-600"></div>
                              </div>
                          )}
                          <span className={cn("text-[10px] uppercase font-medium",
                              isToday(day) ? "text-primary-foreground/80" : isHoliday ? "text-red-600 font-bold" : "text-muted-foreground")}>
                            {format(day, "EEE", {locale: es})}
                          </span>
                          <span className={cn(
                              "text-sm font-bold",
                              isToday(day) ? "text-primary-foreground" : isHoliday ? "text-red-700" : "text-foreground")}>
                            {format(day, "d")}
                          </span>
                        </div>
                    )})}
                </div>
              </div>

              <div className="pb-4">
                {floors.map((floor) => (
                    <div key={floor.name}>
                      <div className="flex sticky left-0 w-full z-20 border-y bg-muted/50">
                        <div
                            className="w-[180px] shrink-0 sticky left-0 z-30 bg-muted border-r px-4 py-1 flex items-center shadow-[4px_0_10px_-5px_rgba(0,0,0,0.1)]">
                          <span className="text-[10px] font-bold uppercase text-primary">{floor.name}</span>
                        </div>
                        <div className="flex-1 bg-muted/50 py-1"></div>
                      </div>

                      {floor.rooms.map((room) => {
                        const roomSegments = reservations.flatMap(res =>
                            res.segments.map((seg, idx) => ({reservation: res, segment: seg, idx}))
                                .filter(item => item.segment.roomId === room.id)
                        )

                        return (
                            <div key={room.id}
                                 className="flex border-b h-[72px] relative group bg-background hover:bg-accent/30 transition-colors duration-200">
                              <div
                                  className="w-[180px] shrink-0 border-r px-4 flex flex-col justify-center sticky left-0 z-30 bg-background group-hover:bg-accent/50 transition-colors shadow-[4px_0_10px_-5px_rgba(0,0,0,0.1)]">
                                <div className="flex items-center justify-between w-full mb-1">
                                  <span className="text-xl font-bold">{room.number}</span>
                                  <Badge variant="outline"
                                         className={cn("text-[9px] px-1 py-0", getCategoryColor(room.category))}>
                                    {room.category}
                                  </Badge>
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                    ${formatPriceShort(getRoomPrice(room, new Date()))}
                                </span>
                              </div>

                              <div className="flex relative z-0">
                                {days.map((day, idx) => {
                                  // --- FIX: Logic Conflict ---
                                  // Si estamos arrastrando, pasamos el ID para que isDateOccupied lo ignore
                                  const isOccupied = isDateOccupied(room.id, day, draggingId);
                                  const price = getRoomPrice(room, day);
                                  const isPriceOverridden = price !== room.basePrice;
                                  const dayKey = format(day, "yyyy-MM-dd");
                                  const isHoliday = !!holidaysMap[dayKey];

                                  return (
                                      <div
                                          key={idx}
                                          onDragOver={(e) => {
                                            // Solo permitimos drop si no está ocupado (excluyendo lo que arrastramos)
                                            if (!isOccupied) e.preventDefault()
                                          }}
                                          onDrop={(e) => {
                                            if (!isOccupied) handleDrop(e, room.id)
                                          }}
                                          className={cn(
                                              "min-w-[48px] w-12 border-r transition-colors duration-300 relative",
                                              isToday(day) && !isOccupied && "bg-primary/5 ring-1 ring-inset ring-primary/20",
                                              !isToday(day) && isHoliday && !isOccupied && "bg-red-50/60 dark:bg-red-900/10", // <--- COLOR COLUMNA FESTIVO
                                              isPriceOverridden && !isOccupied && "bg-green-500/5",
                                              isOccupied
                                                  ? (isToday(day) ? "bg-muted/30 cursor-not-allowed opacity-50 ring-1 ring-inset ring-primary/20" : "bg-muted/10 cursor-not-allowed opacity-50")
                                                  : "cursor-pointer"
                                          )}
                                          onClick={() => !isOccupied && setNewReservationModal({ isOpen: true, roomId: room.id, date: day, type: "reservation" })}
                                      >
                                        {!isOccupied && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0">
                                                  <span className={cn(
                                                      "text-[9.5px] font-bold select-none",
                                                      isPriceOverridden ? "text-green-600 dark:text-green-400" : "text-muted-foreground/60"
                                                  )}>
                                                      ${formatPriceShort(price)}
                                                  </span>
                                            </div>
                                        )}
                                      </div>
                                  )
                                })}

                                {roomSegments.map(({ reservation, segment, idx }) => {
                                  const style = getReservationStyle(segment.startDate, segment.endDate)
                                  if (style.isHidden) return null;
                                  const canDrag = reservation.status !== "history" && reservation.status !== "blocked";

                                  return (
                                      /* --- FIX: UI Conflict & Drag Logic --- */
                                      <div
                                          key={`${reservation.id}-${idx}`}
                                          className={cn(
                                              // 1. CONTENEDOR EXTERNO (DRAGGABLE)
                                              // Este div es invisible pero maneja la posición y el evento de arrastre
                                              "absolute top-1 bottom-1 m-auto rounded-md shadow-sm flex flex-col justify-center transition-all overflow-hidden select-none",
                                              "z-10 hover:z-20",
                                              // Solo mostramos cursor de arrastre si es permitido, pero el estilo visual real va dentro
                                              canDrag ? "cursor-grab active:cursor-grabbing hover:scale-[1.02]" : "cursor-default",
                                              getStatusStyles(reservation.status),
                                              draggingId === reservation.id && "opacity-50 border-dashed border-2" // Feedback visual
                                          )}
                                          style={{
                                            left: `${style.left * 48}px`,
                                            width: `${style.width * 48}px`,
                                          }}
                                          draggable={canDrag}
                                          onDragStart={(e) => {
                                            if (!canDrag) return;
                                            setDraggingId(reservation.id);
                                            e.dataTransfer.setData("application/json", JSON.stringify({ resId: reservation.id, segmentIdx: idx }));
                                            e.dataTransfer.effectAllowed = "move";
                                          }}
                                          onDragEnd={() => setDraggingId(null)}
                                      >
                                        {/* 2. COMPONENTE POPOVER */}
                                        <ReservationPopover
                                            reservation={reservation as any}
                                            segment={segment}
                                            segmentIndex={idx}
                                            isOpen={selectedReservation === `${reservation.id}-${idx}`}
                                            onOpenChange={(open) => setSelectedReservation(open ? `${reservation.id}-${idx}` : null)}
                                            onCheckIn={() => handleCheckIn(reservation.id)}
                                            onCheckOut={() => handleCheckOut(reservation.id)}
                                            onCancel={() => setCancelConfirmId(reservation.id)}
                                            onSplit={handleSplit}
                                            onMerge={handleMerge}
                                        >
                                          {/* 3. CONTENIDO VISUAL (TRIGGER)
               Añadimos 'cursor-grab' aquí para forzar que el puntero se vea bien
               incluso encima del texto/iconos del Popover
            */}
                                          <div className={cn(
                                              "w-full h-full px-2 flex flex-col justify-center text-[10px] font-medium whitespace-nowrap",
                                              canDrag && "cursor-grab active:cursor-grabbing"
                                          )}>
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
                                      </div>
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

        <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] sm:text-xs bg-card py-2 px-4 rounded-full border border-border w-fit mx-auto shadow-sm shrink-0">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> <span className="text-muted-foreground">Al día</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-destructive"></div> <span className="text-muted-foreground">Deuda</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> <span className="text-muted-foreground">Confirmada</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div> <span className="text-muted-foreground">Pendiente</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-muted-foreground"></div> <span className="text-muted-foreground">Historial/Bloq</span></div>
        </div>

        <RateModifierModal
            isOpen={rateModalOpen}
            onClose={() => setRateModalOpen(false)}
            onSave={handleSaveRates}
            rooms={rooms}
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
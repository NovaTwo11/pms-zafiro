"use client"

import { useEffect, useState, useMemo } from "react"
import {
  CheckCircle2, AlertCircle, Paintbrush, User, CalendarClock,
  Filter, Wrench, Lock, Plus, Trash2, MoreVertical, Pencil, Timer
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { format, isSameDay, isWithinInterval, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import api from "@/lib/api"
import { toast } from "sonner"

// Tipos
import { RoomDto, ReservationDto, VisualReservationStatus, CreateRoomDto } from "@/types"

// --- CONFIGURACIÓN VISUAL ---
const housekeepingConfig: Record<string, any> = {
  Available: { label: "Limpia", color: "text-emerald-500", icon: CheckCircle2, bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  Dirty: { label: "Sucia", color: "text-red-500", icon: AlertCircle, bg: "bg-red-500/10", border: "border-red-500/20" },
  Maintenance: { label: "Mantenimiento", color: "text-blue-500", icon: Wrench, bg: "bg-blue-500/10", border: "border-blue-500/20" },
  TouchUp: { label: "Retoque", color: "text-amber-500", icon: Paintbrush, bg: "bg-amber-500/10", border: "border-amber-500/20" },
  Occupied: { label: "Ocupada", color: "text-purple-500", icon: User, bg: "bg-purple-500/10", border: "border-purple-500/20" },
}

const reservationStatusConfig: Record<string, any> = {
  check_in_paid: { label: "En Casa", color: "bg-orange-600", border: "border-orange-700" }, // Pasado a naranja
  check_in_debt: { label: "En Casa (Deuda)", color: "bg-red-600", border: "border-red-700" }, // Rojo alerta
  confirmed_deposit: { label: "Reserva", color: "bg-blue-600", border: "border-blue-700" },
  confirmed_no_deposit: { label: "Reserva", color: "bg-yellow-600", border: "border-yellow-700" },
  blocked: { label: "Bloqueada", color: "bg-gray-600", border: "border-gray-700" },
  available: { label: "Disponible", color: "bg-card", border: "border-border" }
}

export function HabitacionesContent() {
  const [rooms, setRooms] = useState<RoomDto[]>([])
  const [reservations, setReservations] = useState<ReservationDto[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filterHousekeeping, setFilterHousekeeping] = useState<string>("all")
  const [filterOccupancy, setFilterOccupancy] = useState<"all" | "occupied" | "available">("all")

  // Modal Crear/Editar
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [roomFormData, setRoomFormData] = useState<CreateRoomDto>({ number: "", floor: 1, category: "Doble", basePrice: 0 })
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)

  // Cuenta regresiva
  const [timeUntilCleaning, setTimeUntilCleaning] = useState("00:00:00")

  const today = new Date()

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true)
      const [roomsRes, resRes] = await Promise.all([
        api.get<RoomDto[]>('/rooms'),
        api.get<ReservationDto[]>('/reservations')
      ])
      const sortedRooms = roomsRes.data.sort((a, b) => a.floor === b.floor ? a.number.localeCompare(b.number) : a.floor - b.floor)
      setRooms(sortedRooms)
      setReservations(resRes.data)
    } catch (error) {
      toast.error("Error al cargar datos")
    } finally {
      setLoading(false)
    }
  }

  // Lógica del Timer de las 6:00 AM
  useEffect(() => {
    fetchData()

    const updateTimer = () => {
      const now = new Date()
      const next6AM = new Date(now)
      next6AM.setHours(6, 0, 0, 0)
      if (now >= next6AM) next6AM.setDate(next6AM.getDate() + 1)

      const diff = next6AM.getTime() - now.getTime()
      const h = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0')
      const m = Math.floor((diff / 1000 / 60) % 60).toString().padStart(2, '0')
      const s = Math.floor((diff / 1000) % 60).toString().padStart(2, '0')
      setTimeUntilCleaning(`${h}:${m}:${s}`)
    }

    updateTimer()
    const intId = setInterval(updateTimer, 1000)
    return () => clearInterval(intId)
  }, [])

  // --- HELPER: Formatear Nombre "Holdan L." ---
  const formatGuestName = (fullName: string) => {
    if (!fullName || fullName === "Desconocido") return "Ocupada"
    const parts = fullName.trim().split(" ").filter(Boolean)
    if (parts.length === 1) return parts[0]

    // Si tiene 3 nombres (Ej: Juan Carlos Perez), tomamos el 3ro como apellido. Si no, el 2do.
    const lastNameIdx = parts.length > 2 ? 2 : 1
    return `${parts[0]} ${parts[lastNameIdx].charAt(0)}.`
  }

  // --- LÓGICA VISUAL ---
  const getRoomVisuals = (room: RoomDto) => {
    const reservation = reservations.find(r =>
        r.roomId === room.id &&
        r.status !== 'Cancelled' && r.status !== 'CheckedOut' &&
        isWithinInterval(today, { start: parseISO(r.checkIn), end: parseISO(r.checkOut) })
    )

    const isCheckInToday = reservation && isSameDay(today, parseISO(reservation.checkIn))
    const isCheckOutToday = reservation && isSameDay(today, parseISO(reservation.checkOut))

    let visualStatus: VisualReservationStatus = "available"

    if (reservation) {
      if (reservation.status === "CheckedIn") visualStatus = (reservation.balance || 0) > 100 ? "check_in_debt" : "check_in_paid"
      else if (reservation.status === "Confirmed") visualStatus = "confirmed_deposit"
      else if (reservation.status === "Pending") visualStatus = "confirmed_no_deposit"
    } else if (room.status === "Blocked" as any) {
      visualStatus = "blocked"
    }

    const isSalesAlert = visualStatus === "available" && (room.status === "Dirty" || room.status === "Maintenance")

    return { reservation, visualStatus, isCheckInToday, isCheckOutToday, isSalesAlert }
  }

  // --- HANDLERS ---
  const handleStatusChange = async (roomId: string, newStatus: string) => {
    // Optimistic UI update
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus as any } : r))
    try {
      await api.patch(`/rooms/${roomId}/status`, `"${newStatus}"`, {
        headers: { "Content-Type": "application/json" }
      });
      toast.success(`Estado actualizado`)
    } catch(e) {
      toast.error("Error al actualizar el estado");
      fetchData(); // rollback
    }
  }

  const handleOpenCreate = () => {
    setEditingRoomId(null)
    setRoomFormData({ number: "", floor: 1, category: "Doble", basePrice: 0 })
    setIsCreateModalOpen(true)
  }

  const handleOpenEdit = (room: RoomDto) => {
    setEditingRoomId(room.id)
    setRoomFormData({ number: room.number, floor: room.floor, category: room.category, basePrice: room.basePrice })
    setIsCreateModalOpen(true)
  }

  const handleSaveRoom = async () => {
    if (!roomFormData.number || roomFormData.basePrice <= 0) return toast.warning("Revisa los datos ingresados")
    setIsSubmitting(true)
    try {
      if (editingRoomId) {
        await api.put(`/rooms/${editingRoomId}`, roomFormData);
        toast.success("Habitación actualizada");
      } else {
        await api.post('/rooms', roomFormData)
        toast.success("Habitación creada")
      }
      setIsCreateModalOpen(false)
      fetchData()
    } catch (error) { toast.error("Error al guardar la habitación") } finally { setIsSubmitting(false) }
  }

  const handleDeleteRoom = async (id: string) => {
    if(!confirm("¿Eliminar habitación permanentemente?")) return
    try { await api.delete(`/rooms/${id}`); toast.success("Habitación eliminada"); fetchData() }
    catch(e) { toast.error("No se puede eliminar (probablemente tiene reservas)") }
  }

  // --- FILTRADO ---
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const { visualStatus } = getRoomVisuals(room)
      if (filterHousekeeping !== "all" && room.status !== filterHousekeeping) return false
      if (filterOccupancy === "available" && visualStatus !== "available") return false
      if (filterOccupancy === "occupied" && visualStatus === "available") return false
      return true
    })
  }, [rooms, reservations, filterHousekeeping, filterOccupancy])

  const distinctFloors = [...new Set(filteredRooms.map(r => r.floor))].sort((a,b) => a - b)

  if (loading) return <div className="p-10 text-center text-muted-foreground animate-pulse">Cargando PMS Zafiro...</div>

  return (
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-semibold text-3xl text-foreground">Control de Habitaciones</h1>
            <p className="text-muted-foreground">{format(today, "EEEE, d 'de' MMMM", { locale: es })}</p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">
              <Timer className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-semibold tracking-widest">{timeUntilCleaning}</span>
            </div>

            <div className="h-10 w-px bg-border hidden sm:block"></div>

            <div className="flex gap-4">
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">Sucias</span>
                <span className="text-xl font-bold text-red-500">{rooms.filter(r => r.status === 'Dirty').length}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">Libres</span>
                <span className="text-xl font-bold text-emerald-500">{rooms.filter(r => getRoomVisuals(r).visualStatus === 'available').length}</span>
              </div>
            </div>

            <Button onClick={handleOpenCreate} className="bg-primary text-primary-foreground ml-2">
              <Plus className="w-4 h-4 mr-2" /> Nueva
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border bg-card shadow-sm">
          <Filter className="h-4 w-4 text-[#D4AF37] mr-2" />
          <Select value={filterOccupancy} onValueChange={(v:any) => setFilterOccupancy(v)}>
            <SelectTrigger className="w-[150px] bg-background"><SelectValue placeholder="Ocupación" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="available">Disponibles</SelectItem>
              <SelectItem value="occupied">Ocupadas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterHousekeeping} onValueChange={setFilterHousekeeping}>
            <SelectTrigger className="w-[150px] bg-background"><SelectValue placeholder="Limpieza" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Available">Limpia</SelectItem>
              <SelectItem value="Dirty">Sucia</SelectItem>
              <SelectItem value="Occupied">Ocupada</SelectItem>
              <SelectItem value="TouchUp">Retoque</SelectItem>
              <SelectItem value="Maintenance">Mantenimiento</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => {setFilterOccupancy("all"); setFilterHousekeeping("all")}}>Reset</Button>
        </div>

        {/* Grid por Pisos */}
        {distinctFloors.map((floor) => (
            <div key={floor} className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D4AF37] opacity-80 pl-1">Piso {floor}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredRooms.filter(r => r.floor === floor).map(room => {
                  const { reservation, visualStatus, isCheckInToday, isCheckOutToday, isSalesAlert } = getRoomVisuals(room)
                  const hkConfig = housekeepingConfig[room.status] || housekeepingConfig.Available
                  const occConfig = reservationStatusConfig[visualStatus] || reservationStatusConfig.available
                  const HkIcon = hkConfig.icon

                  return (
                      <div key={room.id} className={cn(
                          "relative group rounded-xl border p-4 transition-all hover:shadow-lg flex flex-col justify-between min-h-[180px]",
                          isSalesAlert ? "border-red-500/50 bg-red-950/10" : "border-border bg-card hover:bg-accent/5"
                      )}>
                        {/* Card Top */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-bold tracking-tight">{room.number}</span>
                              <span className="text-[10px] text-muted-foreground uppercase">{room.category}</span>
                            </div>
                            <p className="text-xs font-mono text-muted-foreground mt-1">${room.basePrice.toLocaleString()}</p>
                          </div>

                          <div className="flex gap-1">
                            {/* Botón Estado Rápido */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className={cn("h-7 w-7 border text-[10px]", hkConfig.color, hkConfig.bg, hkConfig.border)}>
                                  <HkIcon className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuLabel>Estado Limpieza</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleStatusChange(room.id, "Available")}>🟢 Limpia</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(room.id, "Occupied")}>🟣 Ocupada (En casa)</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(room.id, "Dirty")}>🔴 Sucia</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(room.id, "TouchUp")}>🟠 Retoque</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(room.id, "Maintenance")}>🔵 Mantenimiento</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Menú Acciones */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-4 w-4 text-muted-foreground" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleOpenEdit(room)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDeleteRoom(room.id)}><Trash2 className="mr-2 h-4 w-4" /> Eliminar</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Card Bottom - INDICADOR DE DISPONIBILIDAD O HUÉSPED */}
                        <div className="space-y-3">
                          {visualStatus === "available" ? (
                              <div className="p-3 rounded-lg border flex items-center justify-center gap-2 text-emerald-600 bg-emerald-500/10 border-emerald-500/20 shadow-sm transition-all hover:bg-emerald-500/20">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="font-bold tracking-wide">DISPONIBLE</span>
                              </div>
                          ) : (
                              <div className={cn("p-3 rounded-lg border text-white relative overflow-hidden shadow-md", occConfig.color, occConfig.border)}>
                                {isCheckInToday && <Badge className="absolute top-0 right-0 rounded-none bg-white text-black hover:bg-white text-[8px] px-1 shadow-sm">ENTRADA</Badge>}
                                {isCheckOutToday && <Badge className="absolute top-0 right-0 rounded-none bg-black/70 text-white hover:bg-black/70 text-[8px] px-1 shadow-sm">SALIDA</Badge>}

                                <div className="flex items-center gap-2 mb-1 mt-1">
                                  {visualStatus === "blocked" ? <Lock className="h-4 w-4"/> : <User className="h-4 w-4"/>}
                                  <span className="font-bold text-base truncate pr-2" title={reservation?.mainGuestName}>
                                      {reservation?.mainGuestName
                                          ? formatGuestName(reservation.mainGuestName)
                                          : "Bloqueada"}
                                  </span>
                                </div>
                                {reservation && (
                                    <div className="flex items-center gap-1 text-[10px] opacity-90 mt-2 font-medium">
                                      <CalendarClock className="h-3 w-3" />
                                      <span>Salida: {format(parseISO(reservation.checkOut), "dd MMM", {locale: es})}</span>
                                    </div>
                                )}
                              </div>
                          )}

                          {isSalesAlert && (
                              <div className="flex items-center justify-center gap-2 text-red-500 text-[10px] font-bold animate-pulse bg-red-100 dark:bg-red-900/20 py-1 rounded border border-red-500/30">
                                <AlertCircle className="h-3 w-3" />
                                <span>REQUIERE {room.status === "Maintenance" ? "MANTENIMIENTO" : "LIMPIEZA"}</span>
                              </div>
                          )}
                        </div>
                      </div>
                  )
                })}
              </div>
            </div>
        ))}

        {/* Modal Crear/Editar Habitación */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>{editingRoomId ? "Editar Habitación" : "Nueva Habitación"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input placeholder="Ej: 101" value={roomFormData.number} onChange={(e) => setRoomFormData({...roomFormData, number: e.target.value})}/>
                </div>
                <div className="space-y-2">
                  <Label>Piso</Label>
                  <Input type="number" value={roomFormData.floor} onChange={(e) => setRoomFormData({...roomFormData, floor: Number(e.target.value)})}/>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={roomFormData.category} onValueChange={(v) => setRoomFormData({...roomFormData, category: v})}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Doble">Doble</SelectItem>
                    <SelectItem value="Triple">Triple</SelectItem>
                    <SelectItem value="Familiar">Familiar</SelectItem>
                    <SelectItem value="SuiteFamiliar">Suite Familiar</SelectItem>
                    <SelectItem value="Suite">Suite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Precio Base</Label>
                <Input type="number" value={roomFormData.basePrice} onChange={(e) => setRoomFormData({...roomFormData, basePrice: Number(e.target.value)})}/>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveRoom} disabled={isSubmitting} className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 font-bold">
                {isSubmitting ? "Guardando..." : "Guardar Habitación"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  )
}
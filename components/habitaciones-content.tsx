"use client"

import { useState } from "react"
import { Plus, BedDouble, CheckCircle2, AlertCircle, Wrench, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type RoomStatus = "available" | "occupied" | "dirty" | "maintenance"

const rooms = [
  { id: "101", number: "101", type: "Estándar", floor: 1, status: "available" as RoomStatus, guest: null },
  {
    id: "102",
    number: "102",
    type: "Estándar",
    floor: 1,
    status: "occupied" as RoomStatus,
    guest: "Sra. Martínez López",
  },
  { id: "103", number: "103", type: "Superior", floor: 1, status: "dirty" as RoomStatus, guest: null },
  { id: "104", number: "104", type: "Superior", floor: 1, status: "maintenance" as RoomStatus, guest: null },
  { id: "105", number: "105", type: "Suite", floor: 1, status: "available" as RoomStatus, guest: null },
  {
    id: "201",
    number: "201",
    type: "Estándar",
    floor: 2,
    status: "occupied" as RoomStatus,
    guest: "Sr. García Mendoza",
  },
  { id: "202", number: "202", type: "Estándar", floor: 2, status: "available" as RoomStatus, guest: null },
  {
    id: "203",
    number: "203",
    type: "Superior",
    floor: 2,
    status: "occupied" as RoomStatus,
    guest: "Sra. Hernández Villa",
  },
  { id: "204", number: "204", type: "Superior", floor: 2, status: "dirty" as RoomStatus, guest: null },
  { id: "205", number: "205", type: "Suite", floor: 2, status: "available" as RoomStatus, guest: null },
  { id: "301", number: "301", type: "Estándar", floor: 3, status: "dirty" as RoomStatus, guest: null },
  { id: "302", number: "302", type: "Estándar", floor: 3, status: "available" as RoomStatus, guest: null },
  { id: "303", number: "303", type: "Superior", floor: 3, status: "maintenance" as RoomStatus, guest: null },
  {
    id: "304",
    number: "304",
    type: "Suite Junior",
    floor: 3,
    status: "occupied" as RoomStatus,
    guest: "Sr. Díaz Sánchez",
  },
  {
    id: "305",
    number: "305",
    type: "Suite Presidencial",
    floor: 3,
    status: "occupied" as RoomStatus,
    guest: "Sr. Rodríguez Pérez",
  },
]

const roomTypes = ["Estándar", "Superior", "Suite", "Suite Junior", "Suite Presidencial"]

const statusConfig = {
  available: { label: "Disponible", color: "bg-[#059669]", icon: CheckCircle2, textColor: "text-[#059669]" },
  occupied: { label: "Ocupada", color: "bg-[#3B82F6]", icon: User, textColor: "text-[#3B82F6]" },
  dirty: { label: "Sucia", color: "bg-[#F59E0B]", icon: AlertCircle, textColor: "text-[#F59E0B]" },
  maintenance: { label: "Mantenimiento", color: "bg-[#CF6679]", icon: Wrench, textColor: "text-[#CF6679]" },
}

export function HabitacionesContent() {
  const [filterStatus, setFilterStatus] = useState<RoomStatus | "all">("all")
  const [newRoomModal, setNewRoomModal] = useState(false)
  const [newRoomData, setNewRoomData] = useState({
    number: "",
    type: "Estándar",
    floor: 1,
  })

  const filteredRooms = filterStatus === "all" ? rooms : rooms.filter((r) => r.status === filterStatus)
  const floors = [...new Set(rooms.map((r) => r.floor))].sort()

  const statusCounts = {
    available: rooms.filter((r) => r.status === "available").length,
    occupied: rooms.filter((r) => r.status === "occupied").length,
    dirty: rooms.filter((r) => r.status === "dirty").length,
    maintenance: rooms.filter((r) => r.status === "maintenance").length,
  }

  const handleCreateRoom = () => {
    console.log("Creating room:", newRoomData)
    setNewRoomModal(false)
    setNewRoomData({ number: "", type: "Estándar", floor: 1 })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-[#E5E5E5]">Habitaciones</h1>
          <p className="text-[#A3A3A3]">Vista rápida del estado de habitaciones</p>
        </div>

        <Button
          onClick={() => setNewRoomModal(true)}
          className="bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90 transition-all duration-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Habitación
        </Button>
      </div>

      {/* Status Filters - Added transitions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setFilterStatus("all")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border",
            filterStatus === "all"
              ? "bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]"
              : "bg-[#1A1A1A] border-[#333333] text-[#A3A3A3] hover:border-[#444444]",
          )}
        >
          Todas ({rooms.length})
        </button>
        {(Object.keys(statusConfig) as RoomStatus[]).map((status) => {
          const config = statusConfig[status]
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border flex items-center gap-2",
                filterStatus === status
                  ? `bg-opacity-10 border-current ${config.textColor}`
                  : "bg-[#1A1A1A] border-[#333333] text-[#A3A3A3] hover:border-[#444444]",
              )}
              style={filterStatus === status ? { backgroundColor: `${config.color.replace("bg-", "")}20` } : {}}
            >
              <span className={`h-2 w-2 rounded-full ${config.color}`} />
              {config.label} ({statusCounts[status]})
            </button>
          )
        })}
      </div>

      {/* Rooms by Floor - Added hover transitions */}
      {floors.map((floor) => {
        const floorRooms = filteredRooms.filter((r) => r.floor === floor)
        if (floorRooms.length === 0) return null

        return (
          <div key={floor}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#D4AF37] mb-3">Piso {floor}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {floorRooms.map((room) => {
                const config = statusConfig[room.status]
                const Icon = config.icon

                return (
                  <button
                    key={room.id}
                    className="rounded-xl border border-[#333333] bg-[#1A1A1A] p-4 text-left transition-all duration-300 hover:border-[#D4AF37] hover:bg-[#252525]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-2xl font-bold text-[#E5E5E5]">{room.number}</span>
                      <span className={`h-3 w-3 rounded-full ${config.color}`} />
                    </div>
                    <p className="text-xs text-[#A3A3A3] mb-2">{room.type}</p>
                    <div className={`flex items-center gap-1.5 text-xs ${config.textColor}`}>
                      <Icon className="h-3 w-3" />
                      <span>{config.label}</span>
                    </div>
                    {room.guest && <p className="text-xs text-[#E5E5E5] mt-2 truncate">{room.guest}</p>}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <BedDouble className="h-12 w-12 text-[#333333] mx-auto mb-3" />
          <p className="text-[#A3A3A3]">No hay habitaciones con ese estado</p>
        </div>
      )}

      <Dialog open={newRoomModal} onOpenChange={setNewRoomModal}>
        <DialogContent className="sm:max-w-[400px] bg-[#1A1A1A] border-[#333333]">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-heading)] text-xl text-[#E5E5E5]">
              Nueva Habitación
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[#A3A3A3]">Número de Habitación *</Label>
              <Input
                value={newRoomData.number}
                onChange={(e) => setNewRoomData({ ...newRoomData, number: e.target.value })}
                placeholder="Ej: 401"
                className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] placeholder:text-[#666666] focus:border-[#D4AF37] transition-all duration-300"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#A3A3A3]">Tipo de Habitación *</Label>
              <Select value={newRoomData.type} onValueChange={(v) => setNewRoomData({ ...newRoomData, type: v })}>
                <SelectTrigger className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] transition-all duration-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#333333]">
                  {roomTypes.map((type) => (
                    <SelectItem key={type} value={type} className="text-[#E5E5E5] focus:bg-[#252525]">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[#A3A3A3]">Piso *</Label>
              <Select
                value={newRoomData.floor.toString()}
                onValueChange={(v) => setNewRoomData({ ...newRoomData, floor: Number.parseInt(v) })}
              >
                <SelectTrigger className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] transition-all duration-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#333333]">
                  {[1, 2, 3, 4, 5].map((floor) => (
                    <SelectItem key={floor} value={floor.toString()} className="text-[#E5E5E5] focus:bg-[#252525]">
                      Piso {floor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setNewRoomModal(false)}
                className="flex-1 border-[#333333] text-[#E5E5E5] hover:bg-[#252525] bg-transparent transition-all duration-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateRoom}
                disabled={!newRoomData.number}
                className="flex-1 bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90 transition-all duration-300"
              >
                Crear Habitación
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { format, addDays } from "date-fns"
import { X, CalendarDays, User, BedDouble, Wrench } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface Room {
  id: string
  number: string
  type: string
}

interface NewReservationModalProps {
  isOpen: boolean
  onClose: () => void
  initialRoomId: string
  initialDate: Date
  type: "reservation" | "maintenance"
  rooms: Room[]
}

export function NewReservationModal({
  isOpen,
  onClose,
  initialRoomId,
  initialDate,
  type,
  rooms,
}: NewReservationModalProps) {
  const [activeTab, setActiveTab] = useState<"reservation" | "maintenance">(type)
  const [formData, setFormData] = useState({
    guestName: "",
    roomId: initialRoomId,
    checkIn: format(initialDate, "yyyy-MM-dd"),
    checkOut: format(addDays(initialDate, 1), "yyyy-MM-dd"),
    nights: 1,
    adults: 1,
    children: 0,
    notes: "",
    maintenanceReason: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would save the reservation/maintenance block
    console.log("Submitting:", { ...formData, type: activeTab })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-[#1A1A1A] border-[#333333] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-[family-name:var(--font-heading)] text-2xl text-[#E5E5E5]">
              {activeTab === "reservation" ? "Nueva Reserva" : "Bloqueo por Mantenimiento"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#252525] transition-all duration-300"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "reservation" | "maintenance")}>
          <TabsList className="w-full bg-[#0F0F0F] border-b border-[#333333] rounded-none p-0 h-auto mx-0 px-6">
            <TabsTrigger
              value="reservation"
              className="flex-1 rounded-none py-3 text-sm data-[state=active]:bg-transparent data-[state=active]:text-[#D4AF37] data-[state=active]:border-b-2 data-[state=active]:border-[#D4AF37] text-[#A3A3A3] transition-all duration-300"
            >
              <BedDouble className="h-4 w-4 mr-2" />
              Reserva
            </TabsTrigger>
            <TabsTrigger
              value="maintenance"
              className="flex-1 rounded-none py-3 text-sm data-[state=active]:bg-transparent data-[state=active]:text-[#D4AF37] data-[state=active]:border-b-2 data-[state=active]:border-[#D4AF37] text-[#A3A3A3] transition-all duration-300"
            >
              <Wrench className="h-4 w-4 mr-2" />
              Mantenimiento
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            {/* Reservation Tab */}
            <TabsContent value="reservation" className="p-6 space-y-4 mt-0">
              {/* Guest Name */}
              <div className="space-y-2">
                <Label className="text-[#A3A3A3]">Nombre del Huésped *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A3A3A3]" />
                  <Input
                    value={formData.guestName}
                    onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                    placeholder="Apellido del huésped"
                    className="pl-9 bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] placeholder:text-[#666666] focus:border-[#D4AF37] transition-all duration-300"
                    required
                  />
                </div>
              </div>

              {/* Room Selection */}
              <div className="space-y-2">
                <Label className="text-[#A3A3A3]">Habitación *</Label>
                <Select value={formData.roomId} onValueChange={(v) => setFormData({ ...formData, roomId: v })} required>
                  <SelectTrigger className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] transition-all duration-300">
                    <SelectValue placeholder="Seleccionar habitación" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-[#333333]">
                    {rooms.map((room) => (
                      <SelectItem
                        key={room.id}
                        value={room.id}
                        className="text-[#E5E5E5] focus:bg-[#252525] focus:text-[#E5E5E5]"
                      >
                        {room.number} - {room.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Check-in *</Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A3A3A3]" />
                    <Input
                      type="date"
                      value={formData.checkIn}
                      onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                      className="pl-9 bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] transition-all duration-300"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Check-out *</Label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A3A3A3]" />
                    <Input
                      type="date"
                      value={formData.checkOut}
                      onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                      className="pl-9 bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] transition-all duration-300"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Occupancy */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Adultos</Label>
                  <Input
                    type="number"
                    min={1}
                    max={6}
                    value={formData.adults}
                    onChange={(e) => setFormData({ ...formData, adults: Number.parseInt(e.target.value) })}
                    className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] transition-all duration-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Niños</Label>
                  <Input
                    type="number"
                    min={0}
                    max={4}
                    value={formData.children}
                    onChange={(e) => setFormData({ ...formData, children: Number.parseInt(e.target.value) })}
                    className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] transition-all duration-300"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-[#A3A3A3]">Notas</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Solicitudes especiales, comentarios..."
                  className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] placeholder:text-[#666666] focus:border-[#D4AF37] resize-none transition-all duration-300"
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Maintenance Tab */}
            <TabsContent value="maintenance" className="p-6 space-y-4 mt-0">
              {/* Room Selection */}
              <div className="space-y-2">
                <Label className="text-[#A3A3A3]">Habitación *</Label>
                <Select value={formData.roomId} onValueChange={(v) => setFormData({ ...formData, roomId: v })} required>
                  <SelectTrigger className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] transition-all duration-300">
                    <SelectValue placeholder="Seleccionar habitación" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-[#333333]">
                    {rooms.map((room) => (
                      <SelectItem
                        key={room.id}
                        value={room.id}
                        className="text-[#E5E5E5] focus:bg-[#252525] focus:text-[#E5E5E5]"
                      >
                        {room.number} - {room.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Fecha Inicio *</Label>
                  <Input
                    type="date"
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] transition-all duration-300"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Fecha Fin *</Label>
                  <Input
                    type="date"
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] transition-all duration-300"
                    required
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label className="text-[#A3A3A3]">Motivo del Mantenimiento *</Label>
                <Select
                  value={formData.maintenanceReason}
                  onValueChange={(v) => setFormData({ ...formData, maintenanceReason: v })}
                  required
                >
                  <SelectTrigger className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] transition-all duration-300">
                    <SelectValue placeholder="Seleccionar motivo" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-[#333333]">
                    <SelectItem value="repair" className="text-[#E5E5E5] focus:bg-[#252525] focus:text-[#E5E5E5]">
                      Reparación General
                    </SelectItem>
                    <SelectItem value="ac" className="text-[#E5E5E5] focus:bg-[#252525] focus:text-[#E5E5E5]">
                      Reparación A/C
                    </SelectItem>
                    <SelectItem value="plumbing" className="text-[#E5E5E5] focus:bg-[#252525] focus:text-[#E5E5E5]">
                      Plomería
                    </SelectItem>
                    <SelectItem value="painting" className="text-[#E5E5E5] focus:bg-[#252525] focus:text-[#E5E5E5]">
                      Pintura
                    </SelectItem>
                    <SelectItem value="deep-clean" className="text-[#E5E5E5] focus:bg-[#252525] focus:text-[#E5E5E5]">
                      Limpieza Profunda
                    </SelectItem>
                    <SelectItem value="renovation" className="text-[#E5E5E5] focus:bg-[#252525] focus:text-[#E5E5E5]">
                      Renovación
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="text-[#A3A3A3]">Notas Adicionales</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detalles del mantenimiento..."
                  className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] placeholder:text-[#666666] focus:border-[#D4AF37] resize-none transition-all duration-300"
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* Actions */}
            <div className="p-6 pt-0 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 border-[#333333] text-[#E5E5E5] hover:bg-[#252525] bg-transparent transition-all duration-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90 transition-all duration-300"
              >
                {activeTab === "reservation" ? "Crear Reserva" : "Bloquear Habitación"}
              </Button>
            </div>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

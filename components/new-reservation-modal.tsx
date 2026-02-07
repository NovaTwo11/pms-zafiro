"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { format, addDays } from "date-fns"
import { X, CalendarDays, User, BedDouble, Wrench, Mail, Phone, CreditCard, Send } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch" // Asegúrate de tener este componente, o usa un checkbox simple

interface Room {
  id: string
  number: string
  category: string
}

interface NewReservationModalProps {
  isOpen: boolean
  onClose: () => void
  initialRoomId: string
  initialDate: Date
  type: "reservation" | "blocked" | "maintenance"
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
  const initialTab = type === "reservation" ? "reservation" : "maintenance"
  const [activeTab, setActiveTab] = useState<"reservation" | "maintenance">(initialTab)

  // Estado para controlar el envío de correo
  const [sendEmail, setSendEmail] = useState(false)

  // Reiniciar formulario cuando cambian props clave
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      roomId: initialRoomId,
      checkIn: format(initialDate, "yyyy-MM-dd"),
      checkOut: format(addDays(initialDate, 1), "yyyy-MM-dd")
    }))
    setSendEmail(false)
  }, [initialRoomId, initialDate])

  const [formData, setFormData] = useState({
    // Datos del Titular
    guestName: "",
    email: "",
    phone: "",
    docType: "",
    docNumber: "",

    // Datos de la Reserva
    roomId: initialRoomId,
    checkIn: format(initialDate, "yyyy-MM-dd"),
    checkOut: format(addDays(initialDate, 1), "yyyy-MM-dd"),
    nights: 1,
    adults: 1,
    children: 0,
    notes: "",
    maintenanceReason: "",
  })

  // Desactivar el switch de envío si no hay email
  useEffect(() => {
    if (!formData.email) {
      setSendEmail(false)
    }
  }, [formData.email])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría tu lógica de guardado
    console.log("Submitting:", { ...formData, sendConfirmationEmail: sendEmail, type: activeTab })
    onClose()
  }

  return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[550px] bg-[#1A1A1A] border-[#333333] p-0 text-[#E5E5E5] max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-bold text-2xl text-[#E5E5E5]">
                {activeTab === "reservation" ? "Nueva Reserva" : "Bloqueo / Mantenimiento"}
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
            <TabsList className="w-full bg-[#0F0F0F] border-b border-[#333333] rounded-none p-0 h-auto mx-0 px-6 sticky top-0 z-10">
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
                Bloqueo
              </TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit}>
              {/* --- TAB RESERVA --- */}
              <TabsContent value="reservation" className="p-6 space-y-6 mt-0">

                {/* Sección: Información del Titular */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4" /> Información del Titular
                  </h3>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-[#A3A3A3] text-xs">Nombre Completo *</Label>
                      <Input
                          value={formData.guestName}
                          onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
                          placeholder="Ej: Juan Pérez"
                          className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37]"
                          required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[#A3A3A3] text-xs">Correo Electrónico</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#666]" />
                          <Input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="cliente@email.com"
                              className="pl-8 bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37]"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#A3A3A3] text-xs">Teléfono</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#666]" />
                          <Input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="+57 300..."
                              className="pl-8 bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5 col-span-1">
                        <Label className="text-[#A3A3A3] text-xs">Tipo Doc</Label>
                        <Select value={formData.docType} onValueChange={(v) => setFormData({ ...formData, docType: v })}>
                          <SelectTrigger className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]">
                            <SelectItem value="CC">CC</SelectItem>
                            <SelectItem value="CE">CE</SelectItem>
                            <SelectItem value="PA">Pasaporte</SelectItem>
                            <SelectItem value="TI">TI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-[#A3A3A3] text-xs">Número Documento</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#666]" />
                          <Input
                              value={formData.docNumber}
                              onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                              placeholder="123456789"
                              className="pl-8 bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección: Detalles de la Estadía */}
                <div className="space-y-4 pt-2 border-t border-[#333]">
                  <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Detalles de la Estadía
                  </h3>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-[#A3A3A3] text-xs">Habitación *</Label>
                      <Select value={formData.roomId} onValueChange={(v) => setFormData({ ...formData, roomId: v })} required>
                        <SelectTrigger className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37]">
                          <SelectValue placeholder="Seleccionar habitación" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]">
                          {rooms.map((room) => (
                              <SelectItem key={room.id} value={room.id} className="focus:bg-[#252525]">
                                {room.number} - {room.category}
                              </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[#A3A3A3] text-xs">Check-in *</Label>
                        <Input
                            type="date"
                            value={formData.checkIn}
                            onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                            className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] [color-scheme:dark]"
                            required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#A3A3A3] text-xs">Check-out *</Label>
                        <Input
                            type="date"
                            value={formData.checkOut}
                            onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                            className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] [color-scheme:dark]"
                            required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[#A3A3A3] text-xs">Adultos</Label>
                        <Input
                            type="number"
                            min={1}
                            max={6}
                            value={formData.adults}
                            onChange={(e) => setFormData({ ...formData, adults: Number.parseInt(e.target.value) })}
                            className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#A3A3A3] text-xs">Niños</Label>
                        <Input
                            type="number"
                            min={0}
                            max={4}
                            value={formData.children}
                            onChange={(e) => setFormData({ ...formData, children: Number.parseInt(e.target.value) })}
                            className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[#A3A3A3] text-xs">Notas</Label>
                      <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Solicitudes especiales..."
                          className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] resize-none h-16"
                      />
                    </div>
                  </div>
                </div>

                {/* Botón de acción extra: Enviar Correo */}
                <div className="flex items-center space-x-2 pt-2 border-t border-[#333]">
                  <Switch
                      id="email-mode"
                      checked={sendEmail}
                      onCheckedChange={setSendEmail}
                      disabled={!formData.email} // REGLA: No se puede activar si no hay email
                      className="data-[state=checked]:bg-[#D4AF37]"
                  />
                  <Label htmlFor="email-mode" className={`text-xs ${!formData.email ? 'text-[#666]' : 'text-[#E5E5E5]'}`}>
                    Enviar confirmación por correo { !formData.email && "(Requiere email)" }
                  </Label>
                </div>

              </TabsContent>

              {/* --- TAB MANTENIMIENTO --- */}
              <TabsContent value="maintenance" className="p-6 space-y-4 mt-0">
                <div className="space-y-1.5">
                  <Label className="text-[#A3A3A3] text-xs">Habitación *</Label>
                  <Select value={formData.roomId} onValueChange={(v) => setFormData({ ...formData, roomId: v })} required>
                    <SelectTrigger className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37]">
                      <SelectValue placeholder="Seleccionar habitación" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]">
                      {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id} className="focus:bg-[#252525]">
                            {room.number} - {room.category}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[#A3A3A3] text-xs">Desde *</Label>
                    <Input
                        type="date"
                        value={formData.checkIn}
                        onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                        className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] [color-scheme:dark]"
                        required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#A3A3A3] text-xs">Hasta *</Label>
                    <Input
                        type="date"
                        value={formData.checkOut}
                        onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                        className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] [color-scheme:dark]"
                        required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[#A3A3A3] text-xs">Motivo de Bloqueo *</Label>
                  <Select
                      value={formData.maintenanceReason}
                      onValueChange={(v) => setFormData({ ...formData, maintenanceReason: v })}
                      required
                  >
                    <SelectTrigger className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37]">
                      <SelectValue placeholder="Seleccionar motivo" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#333333] text-[#E5E5E5]">
                      <SelectItem value="repair" className="focus:bg-[#252525]">Reparación General</SelectItem>
                      <SelectItem value="ac" className="focus:bg-[#252525]">Reparación A/C</SelectItem>
                      <SelectItem value="plumbing" className="focus:bg-[#252525]">Plomería</SelectItem>
                      <SelectItem value="painting" className="focus:bg-[#252525]">Pintura</SelectItem>
                      <SelectItem value="cleaning" className="focus:bg-[#252525]">Limpieza Profunda</SelectItem>
                      <SelectItem value="other" className="focus:bg-[#252525]">Otro motivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[#A3A3A3] text-xs">Detalles</Label>
                  <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Descripción del bloqueo..."
                      className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] resize-none h-20"
                  />
                </div>
              </TabsContent>

              {/* Footer de Acciones */}
              <div className="p-6 pt-0 flex gap-3 sticky bottom-0 bg-[#1A1A1A] z-10 pb-6">
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
                    className="flex-1 bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90 transition-all duration-300 font-medium"
                >
                  {activeTab === "reservation" ? (sendEmail ? "Confirmar y Enviar" : "Confirmar Reserva") : "Bloquear"}
                </Button>
              </div>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>
  )
}
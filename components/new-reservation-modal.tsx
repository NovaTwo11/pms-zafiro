"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { format, addDays } from "date-fns"
import { X, CalendarDays, User, BedDouble, Wrench, Mail, Phone, CreditCard, Send, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import api from "@/lib/api"
import { toast } from "sonner"

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sendEmail, setSendEmail] = useState(false)

  const [formData, setFormData] = useState({
    // Datos del Titular (Divididos en 4)
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",

    email: "",
    phone: "",
    docType: "CC",
    docNumber: "",

    // Datos de la Reserva
    roomId: initialRoomId,
    checkIn: format(initialDate, "yyyy-MM-dd"),
    checkOut: format(addDays(initialDate, 1), "yyyy-MM-dd"),
    adults: 1,
    children: 0,
    notes: "",
    maintenanceReason: "",
  })

  // Reiniciar formulario cuando abrimos el modal o cambiamos de cuadro
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
      setFormData(prev => ({
        ...prev,
        roomId: initialRoomId,
        checkIn: format(initialDate, "yyyy-MM-dd"),
        checkOut: format(addDays(initialDate, 1), "yyyy-MM-dd"),
        primerNombre: "",
        segundoNombre: "",
        primerApellido: "",
        segundoApellido: "",
        email: "",
        phone: "",
        docNumber: "",
        notes: "",
        maintenanceReason: ""
      }))
      setSendEmail(false)
    }
  }, [initialRoomId, initialDate, isOpen, initialTab])

  // Desactivar el switch de envío si no hay email
  useEffect(() => {
    if (!formData.email) {
      setSendEmail(false)
    }
  }, [formData.email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (activeTab === "reservation") {
        // Payload para Reservas Manuales (Apunta a /reservations para evitar el 404)
        const payload = {
          roomId: formData.roomId,
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          adults: formData.adults,
          children: formData.children,
          status: "Confirmed",
          guest: {
            primerNombre: formData.primerNombre,
            segundoNombre: formData.segundoNombre,
            primerApellido: formData.primerApellido,
            segundoApellido: formData.segundoApellido,
            numeroId: formData.docNumber,
            telefono: formData.phone,
            correo: formData.email
          },
          notes: formData.notes
        }

        await api.post('/reservations', payload)
        toast.success("Reserva creada correctamente", {
          description: `Habitación asignada: ${rooms.find(r => r.id === formData.roomId)?.number}`
        })

        if (sendEmail) {
          toast.info("Enviando confirmación por correo...")
        }

      } else {
        // Payload para Bloqueo/Mantenimiento
        const payload = {
          roomId: formData.roomId,
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          status: "Blocked",
          guest: {
            primerNombre: "BLOQUEO",
            primerApellido: "MANTENIMIENTO",
            numeroId: "BLK-000",
            telefono: "0000000"
          },
          notes: `Motivo: ${formData.maintenanceReason} - ${formData.notes}`,
        }

        await api.post('/reservations', payload)
        toast.success("Habitación bloqueada por mantenimiento")
      }

      // Disparar evento para que el Cronograma recargue los datos sin F5
      window.dispatchEvent(new Event("refresh-timeline"))
      onClose()

    } catch (error: any) {
      console.error("Error creando reserva:", error)
      const msg = error.response?.status === 404
          ? "Error: Endpoint no encontrado (404). Verifica que Backend esté corriendo en /api/reservations."
          : error.response?.data?.message || "Verifica la disponibilidad de la habitación."

      toast.error("Error en la solicitud", { description: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Validación rápida para activar/desactivar botón Guardar
  const isValid = () => {
    if (activeTab === "maintenance") return formData.roomId && formData.checkIn && formData.checkOut && formData.maintenanceReason;

    return (
        formData.roomId &&
        formData.checkIn &&
        formData.checkOut &&
        formData.primerNombre.trim() !== "" &&
        formData.primerApellido.trim() !== "" &&
        formData.phone.trim() !== ""
    );
  }

  return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
        <DialogContent className="sm:max-w-[550px] bg-card border-border p-0 text-foreground max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">

          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="font-bold text-2xl text-foreground">
                  {activeTab === "reservation" ? "Nueva Reserva Manual" : "Bloquear Habitación"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground text-sm mt-1">
                  {activeTab === "reservation" ? "Agrega un huésped directamente al cronograma." : "Inhabilita una habitación para la venta."}
                </DialogDescription>
              </div>
              <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "reservation" | "maintenance")}>
            <TabsList className="w-full bg-background border-b border-border rounded-none p-0 h-auto mx-0 px-6 sticky top-0 z-10">
              <TabsTrigger
                  value="reservation"
                  disabled={isSubmitting}
                  className="flex-1 rounded-none py-3 text-sm data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary text-muted-foreground transition-all duration-300"
              >
                <BedDouble className="h-4 w-4 mr-2" />
                Reserva
              </TabsTrigger>
              <TabsTrigger
                  value="maintenance"
                  disabled={isSubmitting}
                  className="flex-1 rounded-none py-3 text-sm data-[state=active]:bg-transparent data-[state=active]:text-destructive data-[state=active]:border-b-2 data-[state=active]:border-destructive text-muted-foreground transition-all duration-300"
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
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4" /> Información del Titular
                  </h3>

                  <div className="space-y-3">
                    {/* Fila 1: Nombres */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">Primer Nombre *</Label>
                        <Input
                            value={formData.primerNombre}
                            onChange={(e) => setFormData({ ...formData, primerNombre: e.target.value })}
                            placeholder="Ej: Juan"
                            className="bg-background border-border text-foreground focus-visible:ring-primary"
                            required
                            disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">Segundo Nombre</Label>
                        <Input
                            value={formData.segundoNombre}
                            onChange={(e) => setFormData({ ...formData, segundoNombre: e.target.value })}
                            placeholder="Opcional"
                            className="bg-background border-border text-foreground focus-visible:ring-primary"
                            disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {/* Fila 2: Apellidos */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">Primer Apellido *</Label>
                        <Input
                            value={formData.primerApellido}
                            onChange={(e) => setFormData({ ...formData, primerApellido: e.target.value })}
                            placeholder="Ej: Pérez"
                            className="bg-background border-border text-foreground focus-visible:ring-primary"
                            required
                            disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">Segundo Apellido</Label>
                        <Input
                            value={formData.segundoApellido}
                            onChange={(e) => setFormData({ ...formData, segundoApellido: e.target.value })}
                            placeholder="Opcional"
                            className="bg-background border-border text-foreground focus-visible:ring-primary"
                            disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {/* Fila 3: Documento */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5 col-span-1">
                        <Label className="text-muted-foreground text-xs">Tipo Doc</Label>
                        <Select
                            value={formData.docType}
                            onValueChange={(v) => setFormData({ ...formData, docType: v })}
                            disabled={isSubmitting}
                        >
                          <SelectTrigger className="bg-background border-border text-foreground focus:ring-primary">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="CC">CC</SelectItem>
                            <SelectItem value="CE">CE</SelectItem>
                            <SelectItem value="PA">Pasaporte</SelectItem>
                            <SelectItem value="TI">TI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <Label className="text-muted-foreground text-xs">Número Documento</Label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                              value={formData.docNumber}
                              onChange={(e) => setFormData({ ...formData, docNumber: e.target.value })}
                              placeholder="123456789"
                              className="pl-9 bg-background border-border text-foreground focus-visible:ring-primary"
                              disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Fila 4: Contacto */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">Correo Electrónico</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="cliente@email.com"
                              className="pl-9 bg-background border-border text-foreground focus-visible:ring-primary"
                              disabled={isSubmitting}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">Teléfono *</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              placeholder="+57 300..."
                              className="pl-9 bg-background border-border text-foreground focus-visible:ring-primary"
                              required
                              disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Sección: Detalles de la Estadía */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Detalles de la Estadía
                  </h3>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground text-xs">Habitación *</Label>
                      <Select
                          value={formData.roomId}
                          onValueChange={(v) => setFormData({ ...formData, roomId: v })}
                          required
                          disabled={isSubmitting}
                      >
                        <SelectTrigger className="bg-background border-border text-foreground focus:ring-primary">
                          <SelectValue placeholder="Seleccionar habitación" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border text-foreground">
                          {rooms.map((room) => (
                              <SelectItem key={room.id} value={room.id} className="focus:bg-accent focus:text-accent-foreground">
                                {room.number} - {room.category}
                              </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">Check-in *</Label>
                        <Input
                            type="date"
                            value={formData.checkIn}
                            onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                            className="bg-background border-border text-foreground focus-visible:ring-primary [color-scheme:dark]"
                            required
                            disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">Check-out *</Label>
                        <Input
                            type="date"
                            value={formData.checkOut}
                            onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                            className="bg-background border-border text-foreground focus-visible:ring-primary [color-scheme:dark]"
                            required
                            disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">Adultos</Label>
                        <Input
                            type="number"
                            min={1}
                            max={6}
                            value={formData.adults}
                            onChange={(e) => setFormData({ ...formData, adults: Number.parseInt(e.target.value) })}
                            className="bg-background border-border text-foreground focus-visible:ring-primary"
                            disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-muted-foreground text-xs">Niños</Label>
                        <Input
                            type="number"
                            min={0}
                            max={4}
                            value={formData.children}
                            onChange={(e) => setFormData({ ...formData, children: Number.parseInt(e.target.value) })}
                            className="bg-background border-border text-foreground focus-visible:ring-primary"
                            disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground text-xs">Notas Opcionales</Label>
                      <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Cuna extra, piso alto, alergias..."
                          className="bg-background border-border text-foreground focus-visible:ring-primary resize-none h-16"
                          disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Botón de acción extra: Enviar Correo */}
                <div className="flex items-center space-x-2 pt-4 border-t border-border">
                  <Switch
                      id="email-mode"
                      checked={sendEmail}
                      onCheckedChange={setSendEmail}
                      disabled={!formData.email || isSubmitting}
                  />
                  <Label htmlFor="email-mode" className={`text-xs ${!formData.email ? 'text-muted-foreground' : 'text-foreground'}`}>
                    Enviar confirmación por correo { !formData.email && "(Requiere escribir email arriba)" }
                  </Label>
                </div>

              </TabsContent>

              {/* --- TAB MANTENIMIENTO --- */}
              <TabsContent value="maintenance" className="p-6 space-y-5 mt-0">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-start gap-3">
                  <Wrench className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>Inhabilitar una habitación impedirá que se creen reservas en esas fechas y marcará la celda en gris.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs">Habitación *</Label>
                  <Select
                      value={formData.roomId}
                      onValueChange={(v) => setFormData({ ...formData, roomId: v })}
                      required
                      disabled={isSubmitting}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground focus:ring-destructive">
                      <SelectValue placeholder="Seleccionar habitación a bloquear" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id} className="focus:bg-accent">
                            {room.number} - {room.category}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs">Fecha de Inicio *</Label>
                    <Input
                        type="date"
                        value={formData.checkIn}
                        onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                        className="bg-background border-border text-foreground focus-visible:ring-destructive [color-scheme:dark]"
                        required
                        disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs">Fecha de Fin *</Label>
                    <Input
                        type="date"
                        value={formData.checkOut}
                        onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                        className="bg-background border-border text-foreground focus-visible:ring-destructive [color-scheme:dark]"
                        required
                        disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs">Motivo de Bloqueo *</Label>
                  <Select
                      value={formData.maintenanceReason}
                      onValueChange={(v) => setFormData({ ...formData, maintenanceReason: v })}
                      required
                      disabled={isSubmitting}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground focus:ring-destructive">
                      <SelectValue placeholder="Selecciona un motivo" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground">
                      <SelectItem value="repair">Reparación General</SelectItem>
                      <SelectItem value="ac">Reparación Aire Acondicionado</SelectItem>
                      <SelectItem value="plumbing">Daño de Plomería</SelectItem>
                      <SelectItem value="painting">Pintura / Remodelación</SelectItem>
                      <SelectItem value="cleaning">Limpieza Extrema Especial</SelectItem>
                      <SelectItem value="other">Otro Motivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs">Detalles del daño</Label>
                  <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Explica qué ocurrió para que el equipo de mantenimiento lo revise..."
                      className="bg-background border-border text-foreground focus-visible:ring-destructive resize-none h-24"
                      disabled={isSubmitting}
                  />
                </div>
              </TabsContent>

              {/* Footer de Acciones (Común) */}
              <div className="p-6 pt-0 flex gap-3 sticky bottom-0 bg-card z-10 pb-6 border-t border-border mt-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 bg-background"
                >
                  Cancelar
                </Button>

                <Button
                    type="submit"
                    disabled={!isValid() || isSubmitting}
                    className={cn(
                        "flex-1 font-bold shadow-md",
                        activeTab === "maintenance"
                            ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                >
                  {isSubmitting ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Procesando...</span>
                  ) : (
                      activeTab === "reservation" ? (sendEmail ? "Confirmar y Enviar" : "Confirmar Reserva") : "Aplicar Bloqueo"
                  )}
                </Button>
              </div>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>
  )
}
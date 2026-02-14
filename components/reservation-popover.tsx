"use client"

import type React from "react"
import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  CalendarDays,
  User,
  CreditCard,
  LogIn,
  LogOut,
  XCircle,
  Phone,
  Mail,
  DollarSign,
  AlertTriangle,
  Scissors,
  Link2,
  Eye,
  Send,     // Icono para Enviar Link
  FileText, CheckCircle  // Icono para Confirmación
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import api from "@/lib/api"; // Importamos toast para las notificaciones

// Definimos la interfaz aquí o la importamos si la tienes centralizada
interface Reservation {
  id: string
  code?: string // Agregamos code opcional para el link de check-in
  guestName: string
  guestId?: string
  status: string
  totalValue: number
  paidAmount: number
  balance?: number
  segments: { roomId: string; startDate: Date; endDate: Date }[]
}

export interface ReservationSegment {
  roomId: string
  startDate: Date
  endDate: Date
}

interface ReservationPopoverProps {
  reservation: Reservation
  segment: ReservationSegment
  segmentIndex: number
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onCheckIn: () => void
  onCheckOut: () => void
  onCancel: () => void
  onSplit?: (reservationId: string, segmentIndex: number, splitDay: Date) => void
  onMerge?: (reservationId: string) => void
  children: React.ReactNode
}

// Sample guest data
const guestData: Record<string, { phone: string; email: string; document: string }> = {
  g1: { phone: "+57 300 123 4567", email: "garcia@email.com", document: "CC 123456789" },
  g2: { phone: "+57 301 234 5678", email: "martinez@email.com", document: "CC 987654321" },
  g3: { phone: "+57 302 345 6789", email: "lopez@email.com", document: "CE 456789123" },
  g4: { phone: "+57 303 456 7890", email: "rodriguez@email.com", document: "CC 321654987" },
  g5: { phone: "+57 304 567 8901", email: "sanchez@email.com", document: "Pasaporte AB123456" },
  g6: { phone: "+57 305 678 9012", email: "perez@email.com", document: "CC 654321789" },
  g7: { phone: "+57 306 789 0123", email: "hernandez@email.com", document: "CC 789123456" },
  g8: { phone: "+57 307 890 1234", email: "diaz@email.com", document: "CC 147258369" },
}

export function ReservationPopover({
                                     reservation,
                                     segment,
                                     segmentIndex,
                                     isOpen,
                                     onOpenChange,
                                     onCheckIn,
                                     onCheckOut,
                                     onCancel,
                                     onSplit,
                                     onMerge,
                                     children,
                                   }: ReservationPopoverProps) {
  const [activeTab, setActiveTab] = useState("detalle")
  const [successDialog, setSuccessDialog] = useState<{isOpen: boolean, title: string, message: string}>({
    isOpen: false, title: "", message: ""
  })

  const getStatusLabel = () => {
    switch (reservation.status) {
      case "check_in_paid":
      case "check_in_debt":
      case "in-house":
        return "En casa"
      case "checked-out":
        return "Finalizada"
      case "cancelled":
        return "Cancelada"
      case "blocked":
        return "Bloqueada"
      default:
        return "Confirmada"
    }
  }

  const getStatusColor = () => {
    switch (reservation.status) {
      case "check_in_paid":
      case "in-house":
        return "text-[#3B82F6] bg-[#3B82F6]/10"
      case "check_in_debt":
        return "text-red-500 bg-red-500/10"
      case "checked-out":
        return "text-muted-foreground bg-[#A3A3A3]/10"
      case "cancelled":
        return "text-[#666666] bg-[#666666]/10"
      case "blocked":
        return "text-gray-400 bg-gray-400/10"
      default:
        return "text-[#059669] bg-[#059669]/10"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const guest = reservation.guestId ? guestData[reservation.guestId] : null

  // Lógica de estado
  const isCheckedIn = reservation.status.startsWith("check_in") || reservation.status === "in-house"
  const isCancelled = reservation.status === "cancelled"
  const isBlocked = reservation.status === "blocked"

  const canCheckIn = !isCheckedIn && !isCancelled && !isBlocked && (
      reservation.status === "confirmed" ||
      reservation.status === "confirmed_deposit" ||
      reservation.status === "confirmed_no_deposit"
  )

  const balance = reservation.balance ?? (reservation.totalValue - reservation.paidAmount)
  const canCheckOut = isCheckedIn && balance <= 0
  const hasBalance = balance > 0

  const isSplitReservation = reservation.segments.length > 1
  const canMerge = isSplitReservation && segmentIndex > 0

  // --- NUEVAS FUNCIONES DE ACCIÓN ---
  const handleSendEmail = async () => {
    try {
      await api.post(`/reservations/${reservation.id}/send-summary`)
      setSuccessDialog({
        isOpen: true,
        title: "¡Correo Enviado!",
        message: `El resumen detallado de la reserva fue enviado exitosamente al correo: ${guest?.email || 'del titular'}.`
      })
    } catch (error) {
      toast.error('Error al enviar el correo')
    }
  }

  const handleSendCheckinLink = async () => {
    try {
      await api.post(`/reservations/${reservation.id}/send-checkin-link`)
      setSuccessDialog({
        isOpen: true,
        title: "¡Link de Check-in Enviado!",
        message: `El enlace único para el registro online fue enviado exitosamente al correo: ${guest?.email || 'del titular'}.`
      })
    } catch (error) {
      toast.error('Error al enviar el link')
    }
  }

  return (
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{children}</PopoverTrigger>
        <PopoverContent className="w-80 bg-card border-border text-foreground p-0 shadow-2xl z-50" align="start" side="bottom">
          {/* Header */}
          <div className="border-b border-border p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-foreground">
                  Hab. {segment.roomId}
                </h4>
                <p className="text-sm text-muted-foreground">Sr./Sra. {reservation.guestName}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor()}`}>{getStatusLabel()}</span>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-background border-b border-border rounded-none p-0 h-auto">
              <TabsTrigger
                  value="detalle"
                  className="flex-1 rounded-none py-2.5 text-xs data-[state=active]:bg-transparent data-[state=active]:text-[#D4AF37] data-[state=active]:border-b-2 data-[state=active]:border-[#D4AF37] text-muted-foreground"
              >
                Detalle
              </TabsTrigger>
              <TabsTrigger
                  value="huesped"
                  className="flex-1 rounded-none py-2.5 text-xs data-[state=active]:bg-transparent data-[state=active]:text-[#D4AF37] data-[state=active]:border-b-2 data-[state=active]:border-[#D4AF37] text-muted-foreground"
              >
                Huésped
              </TabsTrigger>
              <TabsTrigger
                  value="acciones"
                  className="flex-1 rounded-none py-2.5 text-xs data-[state=active]:bg-transparent data-[state=active]:text-[#D4AF37] data-[state=active]:border-b-2 data-[state=active]:border-[#D4AF37] text-muted-foreground"
              >
                Acciones
              </TabsTrigger>
            </TabsList>

            {/* Detalle Tab */}
            <TabsContent value="detalle" className="p-4 space-y-3 mt-0">
              <div className="flex items-center gap-3 text-sm">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
              {format(segment.startDate, "dd MMM", { locale: es })} -{" "}
                  {format(segment.endDate, "dd MMM", { locale: es })}
            </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">Total: {formatCurrency(reservation.totalValue)}</span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className={hasBalance ? "text-[#CF6679]" : "text-[#059669]"}>
              {hasBalance ? `Pendiente: ${formatCurrency(balance)}` : "Pagado completo"}
            </span>
              </div>

              {isSplitReservation && (
                  <div className="mt-2 p-2 rounded bg-[#8B5CF6]/10 border border-[#8B5CF6]/30">
                    <p className="text-xs text-[#8B5CF6]">
                      Reserva fragmentada: Segmento {segmentIndex + 1} de {reservation.segments.length}
                    </p>
                  </div>
              )}
            </TabsContent>

            {/* Huésped Tab */}
            <TabsContent value="huesped" className="p-4 space-y-3 mt-0">
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">Sr./Sra. {reservation.guestName}</span>
              </div>

              {guest && (
                  <>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{guest.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{guest.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{guest.document}</span>
                    </div>
                  </>
              )}

              <Link href={`/huespedes/${reservation.guestId || ''}`}>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 border-border text-foreground hover:bg-accent bg-transparent transition-all duration-300"
                >
                  Ver Perfil Completo
                </Button>
              </Link>
            </TabsContent>

            {/* Acciones Tab */}
            <TabsContent value="acciones" className="p-4 space-y-3 mt-0">

              {/* --- NUEVAS ACCIONES: Correos --- */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Button
                    onClick={handleSendEmail}
                    variant="outline"
                    size="sm"
                    className="border-border text-foreground hover:bg-accent bg-transparent text-xs px-2"
                >
                  <FileText className="h-3 w-3 mr-1.5" />
                  Enviar Info
                </Button>
                <Button
                    onClick={handleSendCheckinLink}
                    variant="outline"
                    size="sm"
                    className="border-border text-foreground hover:bg-accent bg-transparent text-xs px-2"
                >
                  <Send className="h-3 w-3 mr-1.5" />
                  Link Check-in
                </Button>
              </div>

              <div className="h-px bg-[#333333] w-full my-2" />
              {/* -------------------------------- */}

              <Link href={`/reservas/${reservation.id}`} className="block w-full">
                <Button
                    className="w-full bg-primary text-[#0F0F0F] hover:bg-primary/90 transition-all font-bold"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Reserva Completa
                </Button>
              </Link>

              <Button
                  onClick={onCheckIn}
                  disabled={!canCheckIn}
                  className="w-full bg-[#059669] text-white hover:bg-[#059669]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Check-in
              </Button>

              <div className="space-y-1">
                <Button
                    onClick={onCheckOut}
                    disabled={!canCheckOut && isCheckedIn}
                    className="w-full bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Check-out
                </Button>
                {hasBalance && isCheckedIn && (
                    <div className="flex items-center gap-1 text-xs text-[#CF6679]">
                      <AlertTriangle className="h-3 w-3" />
                      <span>No hay Paz y Salvo. Pendiente: {formatCurrency(balance)}</span>
                    </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                    onClick={() => onSplit?.(reservation.id, segmentIndex, segment.startDate)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-[#8B5CF6] text-[#8B5CF6] hover:bg-[#8B5CF6]/10 bg-transparent"
                >
                  <Scissors className="h-4 w-4 mr-1" />
                  Dividir
                </Button>
                {canMerge && (
                    <Button
                        onClick={() => onMerge?.(reservation.id)}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-[#059669] text-[#059669] hover:bg-[#059669]/10 bg-transparent"
                    >
                      <Link2 className="h-4 w-4 mr-1" />
                      Unificar
                    </Button>
                )}
              </div>

              <Button
                  onClick={onCancel}
                  disabled={isCheckedIn || isCancelled}
                  variant="outline"
                  className="w-full border-[#CF6679] text-[#CF6679] hover:bg-[#CF6679]/10 bg-transparent disabled:opacity-50 transition-all duration-300"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar Reserva
              </Button>

              <Link href={`/folios?id=${reservation.id}`} className="block">
                <Button
                    variant="outline"
                    className="w-full border-[#D4AF37] text-[#D4AF37] hover:bg-primary/10 bg-transparent transition-all duration-300"
                >
                  Ver Folio Completo
                </Button>
              </Link>
            </TabsContent>
          </Tabs>
        </PopoverContent>
        <Dialog open={successDialog.isOpen} onOpenChange={(open) => setSuccessDialog(prev => ({...prev, isOpen: open}))}>
          <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
            <DialogHeader>
              <div className="mx-auto w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <DialogTitle className="text-center text-xl">{successDialog.title}</DialogTitle>
              <DialogDescription className="text-center text-md pt-2">
                {successDialog.message}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center mt-4">
              <Button type="button" onClick={() => setSuccessDialog(prev => ({...prev, isOpen: false}))} className="bg-primary text-black hover:bg-primary/90">
                Aceptar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Popover>
  )
}
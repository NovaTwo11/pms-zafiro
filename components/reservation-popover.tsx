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
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import type { Reservation, ReservationSegment } from "./cronograma-content"

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

  const getStatusLabel = () => {
    switch (reservation.status) {
      case "in-house":
        return "En casa"
      case "checked-out":
        return "Finalizada"
      case "cancelled":
        return "Cancelada"
      default:
        return "Confirmada"
    }
  }

  const getStatusColor = () => {
    switch (reservation.status) {
      case "in-house":
        return "text-[#3B82F6] bg-[#3B82F6]/10"
      case "checked-out":
        return "text-[#A3A3A3] bg-[#A3A3A3]/10"
      case "cancelled":
        return "text-[#666666] bg-[#666666]/10"
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
  const canCheckIn = reservation.status === "confirmed"
  const canCheckOut = reservation.status === "in-house" && reservation.balance === 0
  const hasBalance = reservation.balance > 0
  const isSplitReservation = reservation.segments.length > 1
  const canMerge = isSplitReservation && segmentIndex > 0

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 bg-[#1A1A1A] border-[#333333] text-[#E5E5E5] p-0" align="start" side="bottom">
        {/* Header */}
        <div className="border-b border-[#333333] p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[#E5E5E5]">
                Hab. {segment.roomId}
              </h4>
              <p className="text-sm text-[#A3A3A3]">Sr./Sra. {reservation.guestName}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded ${getStatusColor()}`}>{getStatusLabel()}</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full bg-[#0F0F0F] border-b border-[#333333] rounded-none p-0 h-auto">
            <TabsTrigger
              value="detalle"
              className="flex-1 rounded-none py-2.5 text-xs data-[state=active]:bg-transparent data-[state=active]:text-[#D4AF37] data-[state=active]:border-b-2 data-[state=active]:border-[#D4AF37] text-[#A3A3A3]"
            >
              Detalle
            </TabsTrigger>
            <TabsTrigger
              value="huesped"
              className="flex-1 rounded-none py-2.5 text-xs data-[state=active]:bg-transparent data-[state=active]:text-[#D4AF37] data-[state=active]:border-b-2 data-[state=active]:border-[#D4AF37] text-[#A3A3A3]"
            >
              Huésped
            </TabsTrigger>
            <TabsTrigger
              value="acciones"
              className="flex-1 rounded-none py-2.5 text-xs data-[state=active]:bg-transparent data-[state=active]:text-[#D4AF37] data-[state=active]:border-b-2 data-[state=active]:border-[#D4AF37] text-[#A3A3A3]"
            >
              Acciones
            </TabsTrigger>
          </TabsList>

          {/* Detalle Tab */}
          <TabsContent value="detalle" className="p-4 space-y-3 mt-0">
            <div className="flex items-center gap-3 text-sm">
              <CalendarDays className="h-4 w-4 text-[#A3A3A3]" />
              <span className="text-[#A3A3A3]">
                {format(segment.startDate, "dd MMM", { locale: es })} -{" "}
                {format(segment.endDate, "dd MMM", { locale: es })}
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <DollarSign className="h-4 w-4 text-[#A3A3A3]" />
              <span className="text-[#E5E5E5]">Total: {formatCurrency(reservation.totalValue)}</span>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <CreditCard className="h-4 w-4 text-[#A3A3A3]" />
              <span className={hasBalance ? "text-[#CF6679]" : "text-[#059669]"}>
                {hasBalance ? `Pendiente: ${formatCurrency(reservation.balance)}` : "Pagado completo"}
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
              <User className="h-4 w-4 text-[#A3A3A3]" />
              <span className="text-[#E5E5E5]">Sr./Sra. {reservation.guestName}</span>
            </div>

            {guest && (
              <>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-[#A3A3A3]" />
                  <span className="text-[#A3A3A3]">{guest.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-[#A3A3A3]" />
                  <span className="text-[#A3A3A3]">{guest.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CreditCard className="h-4 w-4 text-[#A3A3A3]" />
                  <span className="text-[#A3A3A3]">{guest.document}</span>
                </div>
              </>
            )}

            <Link href={`/huespedes/${reservation.guestId}`}>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 border-[#333333] text-[#E5E5E5] hover:bg-[#252525] bg-transparent transition-all duration-300"
              >
                Ver Perfil Completo
              </Button>
            </Link>
          </TabsContent>

          {/* Acciones Tab */}
          <TabsContent value="acciones" className="p-4 space-y-3 mt-0">

            {/* Ver reserva completa Button */}
            <Link href={`/reservas/${reservation.id}`} className="block w-full">
              <Button
                  className="w-full bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90 transition-all font-bold"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Reserva Completa
              </Button>
            </Link>

            {/* Check-in Button */}
            <Button
              onClick={onCheckIn}
              disabled={!canCheckIn}
              className="w-full bg-[#059669] text-white hover:bg-[#059669]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Check-in
            </Button>

            {/* Check-out Button with Balance Warning */}
            <div className="space-y-1">
              <Button
                onClick={onCheckOut}
                disabled={!canCheckOut && reservation.status === "in-house"}
                className="w-full bg-[#3B82F6] text-white hover:bg-[#3B82F6]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Check-out
              </Button>
              {hasBalance && reservation.status === "in-house" && (
                <div className="flex items-center gap-1 text-xs text-[#CF6679]">
                  <AlertTriangle className="h-3 w-3" />
                  <span>No hay Paz y Salvo. Pendiente: {formatCurrency(reservation.balance)}</span>
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

            {/* Cancel Button */}
            <Button
              onClick={onCancel}
              disabled={reservation.status === "checked-out" || reservation.status === "cancelled"}
              variant="outline"
              className="w-full border-[#CF6679] text-[#CF6679] hover:bg-[#CF6679]/10 bg-transparent disabled:opacity-50 transition-all duration-300"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cancelar Reserva
            </Button>

            <Link href={`/folios?id=${reservation.id}`} className="block">
              <Button
                variant="outline"
                className="w-full border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 bg-transparent transition-all duration-300"
              >
                Ver Folio Completo
              </Button>
            </Link>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

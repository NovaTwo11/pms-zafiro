"use client"

import { CheckCircle2, Layers, Globe, Hotel } from "lucide-react"
import { cn } from "@/lib/utils"

interface Reservation {
  id: string
  guestName: string
  status: "confirmed" | "in-house" | "checked-out" | "cancelled"
  isPaid: boolean
  origin?: "booking" | "direct"
}

interface ReservationBlockProps {
  reservation: Reservation
  isPartialStart?: boolean
  isPartialEnd?: boolean
  isSplit?: boolean
  segmentNumber?: number
  totalSegments?: number
}

export function ReservationBlock({
  reservation,
  isPartialStart,
  isPartialEnd,
  isSplit,
  segmentNumber,
  totalSegments,
}: ReservationBlockProps) {
  const getStatusColor = () => {
    if (reservation.status === "cancelled") return "bg-[#666666]"
    if (isSplit) return "bg-[#8B5CF6]"
    if (!reservation.isPaid) return "bg-[#CF6679]"
    if (reservation.status === "in-house") return "bg-[#3B82F6]"
    return "bg-[#059669]"
  }

  const getOriginIcon = () => {
    if (reservation.origin === "booking") {
      return <Globe className="h-3 w-3 text-[#003580] shrink-0" title="Booking.com" />
    }
    if (reservation.origin === "direct") {
      return <Hotel className="h-3 w-3 text-[#D4AF37] shrink-0" title="Reserva Directa" />
    }
    return null
  }

  return (
    <div
      className={cn(
        "h-full px-2 flex items-center gap-1.5 cursor-pointer transition-all duration-300 hover:brightness-110 text-white",
        getStatusColor(),
        isPartialStart ? "rounded-r" : "rounded-l",
        isPartialEnd ? "rounded-l" : "rounded-r",
        !isPartialStart && !isPartialEnd && "rounded",
        reservation.status === "cancelled" && "opacity-50 line-through",
      )}
    >
      {getOriginIcon()}

      {isSplit && (
        <span className="flex items-center gap-0.5 shrink-0">
          <Layers className="h-3 w-3" />
          <span className="text-[10px]">
            {segmentNumber}/{totalSegments}
          </span>
        </span>
      )}
      <span className="text-xs font-medium truncate">{reservation.guestName}</span>
      {reservation.isPaid && !isSplit && <CheckCircle2 className="h-3 w-3 shrink-0" />}
    </div>
  )
}

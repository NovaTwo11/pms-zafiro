"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { BedDouble, Users, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

type GuestFolio = {
  id: string
  type: "guest"
  roomNumber: string
  guestName: string
  balance: number
  checkIn: Date
  checkOut: Date
  nights: number
  status: "in-house" | "checked-out"
}

type ExternalFolio = {
  id: string
  type: "external"
  alias: string
  description: string
  balance: number
  createdAt: Date
}

type Folio = GuestFolio | ExternalFolio

interface FolioCardProps {
  folio: Folio
  isSelected: boolean
  onClick: () => void
}

export function FolioCard({ folio, isSelected, onClick }: FolioCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const hasBalance = folio.balance > 0

  if (folio.type === "guest") {
    return (
      <button
        onClick={onClick}
        className={cn(
          "w-full text-left rounded-lg border bg-[#1A1A1A] p-4 transition-all hover:border-[#444444]",
          isSelected ? "border-[#D4AF37] ring-1 ring-[#D4AF37]" : "border-[#333333]",
        )}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
              <BedDouble className="h-5 w-5 text-[#3B82F6]" />
            </div>
            <div>
              <p className="text-lg font-semibold text-[#E5E5E5]">{folio.roomNumber}</p>
              <p className="text-xs text-[#A3A3A3]">En casa</p>
            </div>
          </div>
          {hasBalance ? (
            <AlertCircle className="h-5 w-5 text-[#CF6679]" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-[#059669]" />
          )}
        </div>

        <p className="text-sm font-medium text-[#E5E5E5] truncate mb-1">{folio.guestName}</p>
        <p className="text-xs text-[#A3A3A3] mb-3">
          {format(folio.checkIn, "dd MMM", { locale: es })} - {format(folio.checkOut, "dd MMM", { locale: es })} •{" "}
          {folio.nights} noches
        </p>

        <div className="pt-3 border-t border-[#333333]">
          <p className="text-xs text-[#A3A3A3]">Saldo pendiente</p>
          <p className={cn("text-lg font-semibold", hasBalance ? "text-[#CF6679]" : "text-[#059669]")}>
            {formatCurrency(folio.balance)}
          </p>
        </div>
      </button>
    )
  }

  // External folio
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg border bg-[#1A1A1A] p-4 transition-all hover:border-[#444444]",
        isSelected ? "border-[#D4AF37] ring-1 ring-[#D4AF37]" : "border-[#333333]",
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-[#D4AF37]" />
          </div>
          <div>
            <p className="text-xs text-[#A3A3A3]">Externo</p>
          </div>
        </div>
        {hasBalance ? (
          <AlertCircle className="h-5 w-5 text-[#CF6679]" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-[#059669]" />
        )}
      </div>

      <p className="text-sm font-medium text-[#E5E5E5] truncate mb-1">{folio.alias}</p>
      <p className="text-xs text-[#A3A3A3] mb-3 truncate">{folio.description}</p>

      <div className="pt-3 border-t border-[#333333]">
        <p className="text-xs text-[#A3A3A3]">Saldo pendiente</p>
        <p className={cn("text-lg font-semibold", hasBalance ? "text-[#CF6679]" : "text-[#059669]")}>
          {formatCurrency(folio.balance)}
        </p>
      </div>
    </button>
  )
}

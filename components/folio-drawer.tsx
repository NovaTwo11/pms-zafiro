"use client"

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  X,
  LogOut,
  Plus,
  CreditCard,
  Coffee,
  Utensils,
  Car,
  Wifi,
  BedDouble,
  AlertTriangle,
  Banknote,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

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

interface FolioDrawerProps {
  folio: Folio | undefined
  isOpen: boolean
  onClose: () => void
}

// Sample line items
const sampleItems = [
  { id: "1", description: "Alojamiento - Noche 1", amount: 180000, category: "room", date: new Date(2026, 0, 3) },
  { id: "2", description: "Alojamiento - Noche 2", amount: 180000, category: "room", date: new Date(2026, 0, 4) },
  { id: "3", description: "Servicio a la habitación", amount: 45000, category: "food", date: new Date(2026, 0, 4) },
  { id: "4", description: "Minibar - Coca Cola x2", amount: 12000, category: "minibar", date: new Date(2026, 0, 4) },
  { id: "5", description: "Parqueadero", amount: 25000, category: "parking", date: new Date(2026, 0, 3) },
  { id: "6", description: "WiFi Premium", amount: 15000, category: "wifi", date: new Date(2026, 0, 3) },
  { id: "7", description: "Abono efectivo", amount: -120000, category: "payment", date: new Date(2026, 0, 4) },
]

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "room":
      return BedDouble
    case "food":
      return Utensils
    case "minibar":
      return Coffee
    case "parking":
      return Car
    case "wifi":
      return Wifi
    case "payment":
      return CreditCard
    default:
      return Plus
  }
}

export function FolioDrawer({ folio, isOpen, onClose }: FolioDrawerProps) {
  const router = useRouter()
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")

  if (!folio) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(Math.abs(amount))
  }

  const isGuest = folio.type === "guest"
  const title = isGuest ? `Hab. ${folio.roomNumber}` : folio.alias
  const subtitle = isGuest ? folio.guestName : folio.description

  const totalCharges = sampleItems.filter((i) => i.amount > 0).reduce((sum, i) => sum + i.amount, 0)
  const totalPayments = Math.abs(sampleItems.filter((i) => i.amount < 0).reduce((sum, i) => sum + i.amount, 0))

  const canCheckOut = folio.balance === 0
  const hasBalance = folio.balance > 0

  const handleCheckOut = () => {
    if (!canCheckOut) {
      alert(`No hay Paz y Salvo. Pendiente: ${formatCurrency(folio.balance)}`)
      return
    }
    // Process checkout
    console.log("Processing checkout for folio:", folio.id)
    onClose()
  }

  const handleAddPayment = () => {
    if (folio.balance === 0) {
      alert("El saldo ya está en cero. No se pueden agregar más abonos.")
      return
    }
    setPaymentModalOpen(true)
  }

  const handleChargeConsumption = () => {
    // Redirect to POS with folio/room context
    const params = isGuest ? `?roomId=${folio.roomNumber}&folioId=${folio.id}` : `?folioId=${folio.id}`
    router.push(`/pos${params}`)
    onClose()
  }

  const submitPayment = () => {
    console.log("Payment submitted:", { amount: paymentAmount, method: paymentMethod })
    setPaymentModalOpen(false)
    setPaymentAmount("")
    setPaymentMethod("")
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full sm:max-w-[480px] bg-[#1A1A1A] border-l border-[#333333] p-0 flex flex-col">
          {/* Header */}
          <SheetHeader className="p-6 border-b border-[#333333]">
            <div className="flex items-start justify-between">
              <div>
                <SheetTitle className="font-[family-name:var(--font-heading)] text-2xl text-[#E5E5E5]">
                  {title}
                </SheetTitle>
                <p className="text-sm text-[#A3A3A3] mt-1">{subtitle}</p>
                {isGuest && (
                  <p className="text-xs text-[#A3A3A3] mt-2">
                    {format(folio.checkIn, "dd MMM", { locale: es })} -{" "}
                    {format(folio.checkOut, "dd MMM", { locale: es })} • {folio.nights} noches
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isGuest && (
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCheckOut}
                      disabled={!canCheckOut}
                      className={cn(
                        "border-[#CF6679] text-[#CF6679] hover:bg-[#CF6679]/10 hover:text-[#CF6679] bg-transparent transition-all duration-300",
                        !canCheckOut && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Check-out
                    </Button>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#252525] transition-all duration-300"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Check-out blocked warning */}
            {isGuest && hasBalance && (
              <div className="mt-3 p-3 rounded-lg bg-[#CF6679]/10 border border-[#CF6679]/30 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#CF6679] shrink-0" />
                <p className="text-xs text-[#CF6679]">
                  No hay Paz y Salvo. Pendiente: <strong>{formatCurrency(folio.balance)}</strong>
                </p>
              </div>
            )}
          </SheetHeader>

          {/* Summary */}
          <div className="px-6 py-4 border-b border-[#333333] bg-[#0F0F0F]">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-[#A3A3A3]">Cargos</p>
                <p className="text-lg font-semibold text-[#E5E5E5]">{formatCurrency(totalCharges)}</p>
              </div>
              <div>
                <p className="text-xs text-[#A3A3A3]">Abonos</p>
                <p className="text-lg font-semibold text-[#059669]">{formatCurrency(totalPayments)}</p>
              </div>
              <div>
                <p className="text-xs text-[#A3A3A3]">Saldo</p>
                <p className={cn("text-lg font-semibold", folio.balance > 0 ? "text-[#CF6679]" : "text-[#059669]")}>
                  {formatCurrency(folio.balance)}
                </p>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-6">
            <h4 className="text-sm font-medium text-[#A3A3A3] mb-4">Movimientos</h4>
            <div className="space-y-3">
              {sampleItems.map((item) => {
                const Icon = getCategoryIcon(item.category)
                const isPayment = item.amount < 0

                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#0F0F0F] border border-[#333333] transition-all duration-300 hover:border-[#444444]"
                  >
                    <div
                      className={cn(
                        "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                        isPayment ? "bg-[#059669]/10" : "bg-[#252525]",
                      )}
                    >
                      <Icon className={cn("h-4 w-4", isPayment ? "text-[#059669]" : "text-[#A3A3A3]")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#E5E5E5] truncate">{item.description}</p>
                      <p className="text-xs text-[#A3A3A3]">{format(item.date, "dd MMM, HH:mm", { locale: es })}</p>
                    </div>
                    <p className={cn("text-sm font-medium shrink-0", isPayment ? "text-[#059669]" : "text-[#E5E5E5]")}>
                      {isPayment ? "-" : ""}
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sticky Actions */}
          <div className="p-4 border-t border-[#333333] bg-[#1A1A1A] flex gap-3">
            <Button
              onClick={handleAddPayment}
              disabled={folio.balance === 0}
              className={cn(
                "flex-1 bg-[#059669] text-white hover:bg-[#059669]/90 transition-all duration-300",
                folio.balance === 0 && "opacity-50 cursor-not-allowed",
              )}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Agregar Abono
            </Button>
            <Button
              onClick={handleChargeConsumption}
              className="flex-1 bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90 transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Cargar Consumo
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#1A1A1A] border-[#333333]">
          <DialogHeader>
            <DialogTitle className="font-[family-name:var(--font-heading)] text-xl text-[#E5E5E5]">
              Agregar Abono
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[#A3A3A3]">Monto *</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0"
                className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] text-lg transition-all duration-300"
              />
              <p className="text-xs text-[#A3A3A3]">Saldo pendiente: {formatCurrency(folio.balance)}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[#A3A3A3]">Método de Pago *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37] transition-all duration-300">
                  <SelectValue placeholder="Seleccionar método" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#333333]">
                  <SelectItem value="cash" className="text-[#E5E5E5] focus:bg-[#252525]">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-[#059669]" />
                      Efectivo
                    </div>
                  </SelectItem>
                  <SelectItem value="card" className="text-[#E5E5E5] focus:bg-[#252525]">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-[#3B82F6]" />
                      Tarjeta
                    </div>
                  </SelectItem>
                  <SelectItem value="transfer" className="text-[#E5E5E5] focus:bg-[#252525]">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[#8B5CF6]" />
                      Transferencia
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setPaymentModalOpen(false)}
                className="flex-1 border-[#333333] text-[#E5E5E5] hover:bg-[#252525] bg-transparent transition-all duration-300"
              >
                Cancelar
              </Button>
              <Button
                onClick={submitPayment}
                disabled={!paymentAmount || !paymentMethod}
                className="flex-1 bg-[#059669] text-white hover:bg-[#059669]/90 transition-all duration-300"
              >
                Registrar Abono
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

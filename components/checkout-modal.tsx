"use client"

import { useState } from "react"
import { CreditCard, Banknote, BedDouble, Search, Building2, Percent, DollarSign, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  total: number
  onComplete: () => void
  preselectedRoom?: string
}

type PaymentMethod = "cash" | "card" | "transfer" | "room" | null

// Sample rooms for searching
const availableRooms = [
  { number: "201", guest: "Sr. García Mendoza" },
  { number: "102", guest: "Sra. Martínez López" },
  { number: "305", guest: "Sr. Rodríguez Pérez" },
  { number: "203", guest: "Sra. Hernández Villa" },
  { number: "304", guest: "Sr. Díaz Sánchez" },
]

export function CheckoutModal({ isOpen, onClose, total, onComplete, preselectedRoom }: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [roomSearch, setRoomSearch] = useState("")
  const [selectedRoom, setSelectedRoom] = useState<(typeof availableRooms)[0] | null>(
    preselectedRoom ? availableRooms.find((r) => r.number === preselectedRoom) || null : null,
  )
  const [showDiscount, setShowDiscount] = useState(false)
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent")
  const [discountValue, setDiscountValue] = useState("")

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const calculateDiscount = () => {
    const value = Number.parseFloat(discountValue) || 0
    if (discountType === "percent") {
      return (total * value) / 100
    }
    return value
  }

  const discountAmount = calculateDiscount()
  const finalTotal = Math.max(0, total - discountAmount)

  const filteredRooms = availableRooms.filter(
    (room) => room.number.includes(roomSearch) || room.guest.toLowerCase().includes(roomSearch.toLowerCase()),
  )

  const handleComplete = () => {
    setPaymentMethod(null)
    setRoomSearch("")
    setSelectedRoom(null)
    setShowDiscount(false)
    setDiscountValue("")
    onComplete()
  }

  const handleClose = () => {
    setPaymentMethod(null)
    setRoomSearch("")
    setSelectedRoom(null)
    setShowDiscount(false)
    setDiscountValue("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px] bg-[#1A1A1A] border-[#333333] p-0 [&>button]:hidden">
        <DialogHeader className="p-6 pb-4 border-b border-[#333333]">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-[family-name:var(--font-heading)] text-2xl text-[#E5E5E5]">Cobrar</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#252525]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-center pt-2">
            <p className="text-[#A3A3A3]">Total a cobrar</p>
            {discountAmount > 0 ? (
              <>
                <p className="text-lg text-[#A3A3A3] line-through">{formatCurrency(total)}</p>
                <p className="text-3xl font-bold text-[#D4AF37]">{formatCurrency(finalTotal)}</p>
                <p className="text-sm text-[#059669]">Descuento: -{formatCurrency(discountAmount)}</p>
              </>
            ) : (
              <p className="text-3xl font-bold text-[#D4AF37]">{formatCurrency(total)}</p>
            )}
          </div>
        </DialogHeader>

        <div className="p-6">
          {paymentMethod === null ? (
            /* Payment Method Selection */
            <div className="space-y-4">
              {!showDiscount ? (
                <Button
                  variant="outline"
                  onClick={() => setShowDiscount(true)}
                  className="w-full border-[#059669] text-[#059669] hover:bg-[#059669]/10 bg-transparent"
                >
                  <Percent className="h-4 w-4 mr-2" />
                  Agregar Descuento
                </Button>
              ) : (
                <div className="p-4 rounded-lg border border-[#059669]/30 bg-[#059669]/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#059669]">Descuento</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowDiscount(false)
                        setDiscountValue("")
                      }}
                      className="h-6 w-6 p-0 text-[#A3A3A3] hover:text-[#E5E5E5]"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDiscountType("percent")}
                      className={cn(
                        "flex-1 border-[#333333]",
                        discountType === "percent"
                          ? "bg-[#059669]/20 text-[#059669] border-[#059669]"
                          : "text-[#A3A3A3] hover:text-[#E5E5E5] bg-transparent",
                      )}
                    >
                      <Percent className="h-4 w-4 mr-1" />
                      Porcentaje
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDiscountType("fixed")}
                      className={cn(
                        "flex-1 border-[#333333]",
                        discountType === "fixed"
                          ? "bg-[#059669]/20 text-[#059669] border-[#059669]"
                          : "text-[#A3A3A3] hover:text-[#E5E5E5] bg-transparent",
                      )}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Valor Fijo
                    </Button>
                  </div>
                  <Input
                    type="number"
                    placeholder={discountType === "percent" ? "Ej: 10" : "Ej: 5000"}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-[#333333] bg-[#0F0F0F] hover:border-[#D4AF37] transition-all duration-300"
                >
                  <Banknote className="h-8 w-8 text-[#059669] mb-2" />
                  <span className="text-sm font-medium text-[#E5E5E5]">Efectivo</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("card")}
                  className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-[#333333] bg-[#0F0F0F] hover:border-[#D4AF37] transition-all duration-300"
                >
                  <CreditCard className="h-8 w-8 text-[#3B82F6] mb-2" />
                  <span className="text-sm font-medium text-[#E5E5E5]">Tarjeta</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("transfer")}
                  className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-[#333333] bg-[#0F0F0F] hover:border-[#D4AF37] transition-all duration-300"
                >
                  <Building2 className="h-8 w-8 text-[#8B5CF6] mb-2" />
                  <span className="text-sm font-medium text-[#E5E5E5]">Transferencia</span>
                </button>
              </div>
              <button
                onClick={() => setPaymentMethod("room")}
                className="w-full flex flex-col items-center justify-center h-28 rounded-xl border-2 border-[#333333] bg-[#0F0F0F] hover:border-[#D4AF37] transition-all duration-300"
              >
                <BedDouble className="h-8 w-8 text-[#D4AF37] mb-2" />
                <span className="text-sm font-medium text-[#E5E5E5]">Cargar a Habitación</span>
              </button>

              <Button
                variant="outline"
                onClick={handleClose}
                className="w-full mt-4 border-[#333333] text-[#E5E5E5] hover:bg-[#252525] bg-transparent transition-all duration-300"
              >
                Cancelar
              </Button>
            </div>
          ) : paymentMethod === "room" && !selectedRoom ? (
            /* Room Selection */
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => setPaymentMethod(null)}
                className="text-[#A3A3A3] hover:text-[#E5E5E5] px-0"
              >
                ← Volver
              </Button>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A3A3A3]" />
                <Input
                  placeholder="Buscar por número o huésped..."
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                  className="pl-9 bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] placeholder:text-[#666666] focus:border-[#D4AF37] transition-all duration-300"
                  autoFocus
                />
              </div>

              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {filteredRooms.map((room) => (
                  <button
                    key={room.number}
                    onClick={() => setSelectedRoom(room)}
                    className="w-full flex items-center gap-3 p-4 rounded-lg border border-[#333333] bg-[#0F0F0F] hover:border-[#D4AF37] transition-all duration-300 text-left"
                  >
                    <div className="h-12 w-12 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-[#D4AF37]">{room.number}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#E5E5E5]">{room.guest}</p>
                      <p className="text-xs text-[#A3A3A3]">Habitación {room.number}</p>
                    </div>
                  </button>
                ))}
                {filteredRooms.length === 0 && (
                  <p className="text-center text-[#A3A3A3] py-4">No se encontraron habitaciones</p>
                )}
              </div>
            </div>
          ) : (
            /* Confirmation */
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => {
                  if (paymentMethod === "room") {
                    setSelectedRoom(null)
                  } else {
                    setPaymentMethod(null)
                  }
                }}
                className="text-[#A3A3A3] hover:text-[#E5E5E5] px-0"
              >
                ← Volver
              </Button>

              <div className="text-center py-6">
                {paymentMethod === "cash" && (
                  <>
                    <Banknote className="h-16 w-16 text-[#059669] mx-auto mb-4" />
                    <p className="text-lg text-[#E5E5E5]">Pago en Efectivo</p>
                    <p className="text-[#A3A3A3]">Confirme que recibió el pago</p>
                  </>
                )}
                {paymentMethod === "card" && (
                  <>
                    <CreditCard className="h-16 w-16 text-[#3B82F6] mx-auto mb-4" />
                    <p className="text-lg text-[#E5E5E5]">Pago con Tarjeta</p>
                    <p className="text-[#A3A3A3]">Procese el pago en el datáfono</p>
                  </>
                )}
                {paymentMethod === "transfer" && (
                  <>
                    <Building2 className="h-16 w-16 text-[#8B5CF6] mx-auto mb-4" />
                    <p className="text-lg text-[#E5E5E5]">Pago por Transferencia</p>
                    <p className="text-[#A3A3A3]">Verifique el comprobante de transferencia</p>
                  </>
                )}
                {paymentMethod === "room" && selectedRoom && (
                  <>
                    <div className="h-16 w-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-[#D4AF37]">{selectedRoom.number}</span>
                    </div>
                    <p className="text-lg text-[#E5E5E5]">Cargar a Habitación {selectedRoom.number}</p>
                    <p className="text-[#A3A3A3]">{selectedRoom.guest}</p>
                  </>
                )}
              </div>

              <Button
                onClick={handleComplete}
                className={cn(
                  "w-full h-14 text-lg font-semibold transition-all duration-300",
                  paymentMethod === "cash"
                    ? "bg-[#059669] hover:bg-[#059669]/90 text-white"
                    : paymentMethod === "card"
                      ? "bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white"
                      : paymentMethod === "transfer"
                        ? "bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white"
                        : "bg-[#D4AF37] hover:bg-[#D4AF37]/90 text-[#0F0F0F]",
                )}
              >
                Confirmar {formatCurrency(finalTotal)}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { CreditCard, Banknote, BedDouble, Search, Building2, Percent, DollarSign, X, Users } from "lucide-react"
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

type PaymentMethod = "cash" | "card" | "transfer" | "room" | "daypass" | null

// Sample rooms for searching
const availableRooms = [
  { number: "201", guest: "Sr. García Mendoza" },
  { number: "102", guest: "Sra. Martínez López" },
  { number: "305", guest: "Sr. Rodríguez Pérez" },
  { number: "203", guest: "Sra. Hernández Villa" },
  { number: "304", guest: "Sr. Díaz Sánchez" },
]

const availablePasadias = [
  { id: "e1", alias: "Familia Pérez", description: "Evento de cumpleaños" },
  { id: "e2", alias: "Empresa ABC Corp", description: "Almuerzo ejecutivo" },
  { id: "e3", alias: "Sr. López (Pasadía)", description: "Uso de piscina" },
];

export function CheckoutModal({ isOpen, onClose, total, onComplete, preselectedRoom }: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [roomSearch, setRoomSearch] = useState("")
  const [selectedRoom, setSelectedRoom] = useState<(typeof availableRooms)[0] | null>(
    preselectedRoom ? availableRooms.find((r) => r.number === preselectedRoom) || null : null,
  )
  const [showDiscount, setShowDiscount] = useState(false)
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent")
  const [discountValue, setDiscountValue] = useState("")
  const [selectedPasadia, setSelectedPasadia] = useState<typeof availablePasadias[0] | null>(null);

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
      <DialogContent className="sm:max-w-[500px] bg-card border-border p-0 [&>button]:hidden">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-[family-name:var(--font-heading)] text-2xl text-foreground">Cobrar</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-center pt-2">
            <p className="text-muted-foreground">Total a cobrar</p>
            {discountAmount > 0 ? (
              <>
                <p className="text-lg text-muted-foreground line-through">{formatCurrency(total)}</p>
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
                      <Percent className="h-4 w-4 mr-2"/>
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
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4"/>
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDiscountType("percent")}
                            className={cn(
                                "flex-1 border-border",
                                discountType === "percent"
                                    ? "bg-[#059669]/20 text-[#059669] border-[#059669]"
                                    : "text-muted-foreground hover:text-foreground bg-transparent",
                            )}
                        >
                          <Percent className="h-4 w-4 mr-1"/>
                          Porcentaje
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDiscountType("fixed")}
                            className={cn(
                                "flex-1 border-border",
                                discountType === "fixed"
                                    ? "bg-[#059669]/20 text-[#059669] border-[#059669]"
                                    : "text-muted-foreground hover:text-foreground bg-transparent",
                            )}
                        >
                          <DollarSign className="h-4 w-4 mr-1"/>
                          Valor Fijo
                        </Button>
                      </div>
                      <Input
                          type="number"
                          placeholder={discountType === "percent" ? "Ej: 10" : "Ej: 5000"}
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          className="bg-background border-border text-foreground"
                      />
                    </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <button
                      onClick={() => setPaymentMethod("cash")}
                      className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-border bg-background hover:border-[#D4AF37] transition-all duration-300"
                  >
                    <Banknote className="h-8 w-8 text-[#059669] mb-2"/>
                    <span className="text-sm font-medium text-foreground">Efectivo</span>
                  </button>
                  <button
                      onClick={() => setPaymentMethod("card")}
                      className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-border bg-background hover:border-[#D4AF37] transition-all duration-300"
                  >
                    <CreditCard className="h-8 w-8 text-[#3B82F6] mb-2"/>
                    <span className="text-sm font-medium text-foreground">Tarjeta</span>
                  </button>
                  <button
                      onClick={() => setPaymentMethod("transfer")}
                      className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-border bg-background hover:border-[#D4AF37] transition-all duration-300"
                  >
                    <Building2 className="h-8 w-8 text-[#8B5CF6] mb-2"/>
                    <span className="text-sm font-medium text-foreground">Transferencia</span>
                  </button>
                </div>
                <button
                    onClick={() => setPaymentMethod("room")}
                    className="w-full flex flex-col items-center justify-center h-28 rounded-xl border-2 border-border bg-background hover:border-[#D4AF37] transition-all duration-300"
                >
                  <BedDouble className="h-8 w-8 text-[#D4AF37] mb-2"/>
                  <span className="text-sm font-medium text-foreground">Cargar a Habitación</span>
                </button>

                <button
                    onClick={() => setPaymentMethod("daypass")}
                    className="w-full flex flex-col items-center justify-center h-28 rounded-xl border-2 border-border bg-background hover:border-[#D4AF37] transition-all duration-300"
                >
                  <Users className="h-8 w-8 text-[#D4AF37] mb-2"/>
                  <span className="text-sm font-medium text-foreground">Cargar a Pasadía</span>
                </button>

                <Button
                    variant="outline"
                    onClick={handleClose}
                    className="w-full mt-4 border-border text-foreground hover:bg-accent bg-transparent transition-all duration-300"
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
                    className="text-muted-foreground hover:text-foreground px-0"
                >
                  ← Volver
                </Button>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número o huésped..."
                  value={roomSearch}
                  onChange={(e) => setRoomSearch(e.target.value)}
                  className="pl-9 bg-background border-border text-foreground placeholder:text-[#666666] focus:border-[#D4AF37] transition-all duration-300"
                  autoFocus
                />
              </div>

              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {filteredRooms.map((room) => (
                  <button
                    key={room.number}
                    onClick={() => setSelectedRoom(room)}
                    className="w-full flex items-center gap-3 p-4 rounded-lg border border-border bg-background hover:border-[#D4AF37] transition-all duration-300 text-left"
                  >
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-[#D4AF37]">{room.number}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{room.guest}</p>
                      <p className="text-xs text-muted-foreground">Habitación {room.number}</p>
                    </div>
                  </button>
                ))}
                {filteredRooms.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No se encontraron habitaciones</p>
                )}
              </div>
            </div>
          ) : paymentMethod === "daypass" && !selectedPasadia ? (
                  <div className="space-y-4">
                    <Button
                        variant="ghost"
                        onClick={() => setPaymentMethod(null)}
                        className="text-muted-foreground hover:text-foreground px-0"
                    >
                      ← Volver
                    </Button>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                          placeholder="Buscar pasadía o cliente externo..."
                          value={roomSearch} // Reutilizamos el estado de búsqueda
                          onChange={(e) => setRoomSearch(e.target.value)}
                          className="pl-9 bg-background border-border text-foreground placeholder:text-[#666666] focus:border-[#D4AF37] transition-all duration-300"
                          autoFocus
                      />
                    </div>

                    <div className="space-y-2 max-h-[240px] overflow-y-auto">
                      {availablePasadias
                          .filter(p => p.alias.toLowerCase().includes(roomSearch.toLowerCase()))
                          .map((pasadia) => (
                              <button
                                  key={pasadia.id}
                                  onClick={() => setSelectedPasadia(pasadia)}
                                  className="w-full flex items-center gap-3 p-4 rounded-lg border border-border bg-background hover:border-[#D4AF37] transition-all duration-300 text-left"
                              >
                                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Users className="h-6 w-6 text-[#D4AF37]" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{pasadia.alias}</p>
                                  <p className="text-xs text-muted-foreground">{pasadia.description}</p>
                                </div>
                              </button>
                          ))}
                      {availablePasadias.filter(p => p.alias.toLowerCase().includes(roomSearch.toLowerCase())).length === 0 && (
                          <p className="text-center text-muted-foreground py-4">No se encontraron folios externos</p>
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
                    setSelectedRoom(null);
                  } else if (paymentMethod === "daypass") {
                    setSelectedPasadia(null);
                  } else {
                    setPaymentMethod(null);
                  }
                }
              }
                className="text-muted-foreground hover:text-foreground px-0"
              >
                ← Volver
              </Button>

              <div className="text-center py-6">
                {paymentMethod === "cash" && (
                  <>
                    <Banknote className="h-16 w-16 text-[#059669] mx-auto mb-4" />
                    <p className="text-lg text-foreground">Pago en Efectivo</p>
                    <p className="text-muted-foreground">Confirme que recibió el pago</p>
                  </>
                )}
                {paymentMethod === "card" && (
                  <>
                    <CreditCard className="h-16 w-16 text-[#3B82F6] mx-auto mb-4" />
                    <p className="text-lg text-foreground">Pago con Tarjeta</p>
                    <p className="text-muted-foreground">Procese el pago en el datáfono</p>
                  </>
                )}
                {paymentMethod === "transfer" && (
                  <>
                    <Building2 className="h-16 w-16 text-[#8B5CF6] mx-auto mb-4" />
                    <p className="text-lg text-foreground">Pago por Transferencia</p>
                    <p className="text-muted-foreground">Verifique el comprobante de transferencia</p>
                  </>
                )}
                {paymentMethod === "room" && selectedRoom && (
                  <>
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-[#D4AF37]">{selectedRoom.number}</span>
                    </div>
                    <p className="text-lg text-foreground">Cargar a Habitación {selectedRoom.number}</p>
                    <p className="text-muted-foreground">{selectedRoom.guest}</p>
                  </>
                )}
                {paymentMethod === "daypass" && selectedPasadia && (
                    <>
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-[#D4AF37]" />
                      </div>
                      <p className="text-lg text-foreground">Cargar a Pasadía</p>
                      <p className="text-muted-foreground font-medium">{selectedPasadia.alias}</p>
                      <p className="text-xs text-[#666666]">{selectedPasadia.description}</p>
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
                        : "bg-primary hover:bg-primary/90 text-[#0F0F0F]",
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

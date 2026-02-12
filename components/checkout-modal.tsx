"use client"

import { useState } from "react"
import {
  CreditCard,
  Banknote,
  BedDouble,
  Search,
  Building2,
  Percent,
  DollarSign,
  X,
  Users,
  ArrowLeft,
  AlertTriangle
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useCashierStore } from "@/lib/store"

// --- Tipos ---
export interface ActiveFolio {
  id: string
  roomNumber: string
  guestName: string
  balance: number
  status: string
}

export type PaymentMethodType = "Cash" | "CreditCard" | "Transfer" | "RoomCharge" | "DayPass"

// --- MAPEO CRÍTICO CON EL BACKEND (Domain/Enums.cs) ---
// PaymentMethod: None=0, Cash=1, CreditCard=2, DebitCard=3, Transfer=4
const PAYMENT_METHOD_IDS: Record<string, number> = {
  "Cash": 1,
  "CreditCard": 2, // Asumimos Crédito por defecto para tarjeta
  "Transfer": 4,
  "RoomCharge": 0, // No aplica método de pago físico
  "DayPass": 0     // No aplica método de pago físico
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  total: number
  activeFolios: ActiveFolio[]
  onComplete: (data: {
    method: PaymentMethodType,
    methodId: number, // <--- NUEVO: Enviamos el ID real para la API
    folioId?: string,
    finalAmount: number,
    discount: number
  }) => void
}

// Datos Mock SOLO para Pasadías (Esto luego debería venir de una API real de 'ExternalFolios')
const availablePasadias = [
  { id: "e1", alias: "Familia Pérez", description: "Evento de cumpleaños" },
  { id: "e2", alias: "Empresa ABC Corp", description: "Almuerzo ejecutivo" },
]

export function CheckoutModal({ isOpen, onClose, total, activeFolios, onComplete }: CheckoutModalProps) {
  // Conectamos con el store para validar si la caja está abierta
  const { isShiftOpen } = useCashierStore()

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType | null>(null)
  const [roomSearch, setRoomSearch] = useState("")

  const [selectedRoom, setSelectedRoom] = useState<ActiveFolio | null>(null)
  const [selectedPasadia, setSelectedPasadia] = useState<(typeof availablePasadias)[0] | null>(null)

  // Estados para descuento
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

  // Filtros
  const filteredRooms = activeFolios.filter(
      (folio) =>
          folio.roomNumber.includes(roomSearch) ||
          folio.guestName.toLowerCase().includes(roomSearch.toLowerCase())
  )

  const filteredPasadias = availablePasadias.filter(
      (p) => p.alias.toLowerCase().includes(roomSearch.toLowerCase()) || p.description.toLowerCase().includes(roomSearch.toLowerCase())
  )

  const handleComplete = () => {
    // Validaciones
    if (paymentMethod === "RoomCharge" && !selectedRoom) return;
    if (paymentMethod === "DayPass" && !selectedPasadia) return;
    if (!paymentMethod) return;

    // Obtener ID del método para el backend
    const methodId = PAYMENT_METHOD_IDS[paymentMethod] || 0;

    // Determinar el Folio ID destino (si es cargo a cuenta)
    let targetFolioId = undefined;
    if (paymentMethod === "RoomCharge") targetFolioId = selectedRoom?.id;
    if (paymentMethod === "DayPass") targetFolioId = selectedPasadia?.id;

    onComplete({
      method: paymentMethod,
      methodId: methodId, // Enviamos el 1, 2, o 4
      folioId: targetFolioId,
      finalAmount: finalTotal,
      discount: discountAmount
    })

    resetState()
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const resetState = () => {
    setPaymentMethod(null)
    setRoomSearch("")
    setSelectedRoom(null)
    setSelectedPasadia(null)
    setShowDiscount(false)
    setDiscountValue("")
  }

  return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border p-0 [&>button]:hidden duration-200">

          {/* HEADER */}
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-serif text-2xl text-foreground">Cobrar Orden</DialogTitle>
              <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Solo mostramos el total si la caja está abierta, sino mostramos error abajo */}
            {isShiftOpen && (
                <div className="text-center pt-2">
                  <p className="text-muted-foreground">Total a pagar</p>
                  {discountAmount > 0 ? (
                      <>
                        <p className="text-lg text-muted-foreground line-through">{formatCurrency(total)}</p>
                        <div className="flex items-center justify-center gap-2">
                          <p className="text-3xl font-bold text-[#D4AF37]">{formatCurrency(finalTotal)}</p>
                        </div>
                        <p className="text-xs text-[#059669] font-medium bg-[#059669]/10 px-2 py-0.5 rounded-full inline-block mt-1">
                          Ahorro: {formatCurrency(discountAmount)}
                        </p>
                      </>
                  ) : (
                      <p className="text-3xl font-bold text-[#D4AF37]">{formatCurrency(total)}</p>
                  )}
                </div>
            )}
          </DialogHeader>

          {/* BODY */}
          <div className="p-6">

            {/* --- VALIDACIÓN DE CAJA CERRADA --- */}
            {!isShiftOpen ? (
                <div className="flex flex-col items-center justify-center py-4 text-center space-y-4 animate-in zoom-in-95">
                  <div className="h-16 w-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center ring-1 ring-red-200 dark:ring-red-800">
                    <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Caja Cerrada</h3>
                    <p className="text-muted-foreground text-sm max-w-[280px] mx-auto mt-2">
                      El sistema no permite transacciones de pago sin un turno de caja activo.
                    </p>
                  </div>
                  <Button variant="outline" onClick={onClose} className="mt-2 border-red-200 hover:bg-red-50 text-red-700">
                    Cerrar ventana
                  </Button>
                </div>
            ) : (
                // --- CAJA ABIERTA: FLUJO DE PAGO ---
                <>
                  {paymentMethod === null ? (
                      <div className="space-y-4 animate-in fade-in duration-300">

                        {/* Descuento Toggle */}
                        {!showDiscount ? (
                            <Button
                                variant="outline"
                                onClick={() => setShowDiscount(true)}
                                className="w-full border-dashed border-2 border-[#059669]/50 text-[#059669] hover:bg-[#059669]/5 hover:border-[#059669]"
                            >
                              <Percent className="h-4 w-4 mr-2" />
                              Aplicar Descuento
                            </Button>
                        ) : (
                            <div className="p-4 rounded-lg border border-[#059669]/30 bg-[#059669]/5 space-y-3 animate-in fade-in slide-in-from-top-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#059669]">Configurar Descuento</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setShowDiscount(false)
                                      setDiscountValue("")
                                    }}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDiscountType("percent")}
                                    className={cn(
                                        "flex-1 border-border transition-colors h-8 text-xs",
                                        discountType === "percent"
                                            ? "bg-[#059669] text-white border-[#059669] hover:bg-[#059669]/90"
                                            : "text-muted-foreground bg-background"
                                    )}
                                >
                                  <Percent className="h-3 w-3 mr-1" /> % Porcentaje
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDiscountType("fixed")}
                                    className={cn(
                                        "flex-1 border-border transition-colors h-8 text-xs",
                                        discountType === "fixed"
                                            ? "bg-[#059669] text-white border-[#059669] hover:bg-[#059669]/90"
                                            : "text-muted-foreground bg-background"
                                    )}
                                >
                                  <DollarSign className="h-3 w-3 mr-1" /> $ Fijo
                                </Button>
                              </div>
                              <Input
                                  type="number"
                                  placeholder={discountType === "percent" ? "Ej: 10" : "Ej: 5000"}
                                  value={discountValue}
                                  onChange={(e) => setDiscountValue(e.target.value)}
                                  className="bg-background border-border text-foreground focus:border-[#059669] h-9"
                              />
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                          <button
                              onClick={() => setPaymentMethod("Cash")}
                              className="flex flex-col items-center justify-center h-24 rounded-xl border border-border bg-card hover:border-[#059669] hover:bg-[#059669]/5 transition-all duration-200 active:scale-95 group"
                          >
                            <Banknote className="h-7 w-7 text-[#059669] mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium text-foreground">Efectivo</span>
                          </button>
                          <button
                              onClick={() => setPaymentMethod("CreditCard")}
                              className="flex flex-col items-center justify-center h-24 rounded-xl border border-border bg-card hover:border-[#3B82F6] hover:bg-[#3B82F6]/5 transition-all duration-200 active:scale-95 group"
                          >
                            <CreditCard className="h-7 w-7 text-[#3B82F6] mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium text-foreground">Tarjeta</span>
                          </button>
                          <button
                              onClick={() => setPaymentMethod("Transfer")}
                              className="flex flex-col items-center justify-center h-24 rounded-xl border border-border bg-card hover:border-[#8B5CF6] hover:bg-[#8B5CF6]/5 transition-all duration-200 active:scale-95 group"
                          >
                            <Building2 className="h-7 w-7 text-[#8B5CF6] mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium text-foreground">Transferencia</span>
                          </button>
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">Cargos a Cuenta</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <button
                              onClick={() => setPaymentMethod("RoomCharge")}
                              className="flex flex-col items-center justify-center h-20 rounded-xl border border-border bg-card hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all duration-200 active:scale-95 group"
                          >
                            <BedDouble className="h-6 w-6 text-[#D4AF37] mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium text-foreground">A la Habitación</span>
                          </button>

                          <button
                              onClick={() => setPaymentMethod("DayPass")}
                              className="flex flex-col items-center justify-center h-20 rounded-xl border border-border bg-card hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all duration-200 active:scale-95 group"
                          >
                            <Users className="h-6 w-6 text-[#D4AF37] mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium text-foreground">Pasadía / Externo</span>
                          </button>
                        </div>
                      </div>

                  ) : paymentMethod === "RoomCharge" && !selectedRoom ? (

                      /* SELECCIÓN DE HABITACIÓN */
                      <div className="space-y-4 animate-in slide-in-from-right-10 duration-300">
                        <div className="flex items-center gap-2 mb-2">
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPaymentMethod(null)}
                              className="text-muted-foreground hover:text-foreground -ml-2"
                          >
                            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <h3 className="font-medium text-foreground">Seleccionar Huésped</h3>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Habitación o nombre..."
                                value={roomSearch}
                                onChange={(e) => setRoomSearch(e.target.value)}
                                className="pl-9 focus:border-[#D4AF37]"
                                autoFocus
                            />
                          </div>
                        </div>

                        <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pt-2">
                          {filteredRooms.length === 0 ? (
                              <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                                <BedDouble className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                                <p className="text-sm text-muted-foreground">No hay huéspedes activos</p>
                              </div>
                          ) : (
                              filteredRooms.map((folio) => (
                                  <button
                                      key={folio.id}
                                      onClick={() => setSelectedRoom(folio)}
                                      className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-[#D4AF37] hover:bg-accent/50 transition-all text-left group"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-md bg-[#D4AF37]/10 flex items-center justify-center group-hover:bg-[#D4AF37]/20">
                                        <span className="text-sm font-bold text-[#D4AF37]">{folio.roomNumber}</span>
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-foreground">{folio.guestName}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase">{folio.status}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-muted-foreground">Saldo actual</p>
                                      <p className={cn("text-sm font-semibold", folio.balance > 0 ? "text-red-500" : "text-green-600")}>
                                        {formatCurrency(folio.balance)}
                                      </p>
                                    </div>
                                  </button>
                              ))
                          )}
                        </div>
                      </div>

                  ) : paymentMethod === "DayPass" && !selectedPasadia ? (

                      /* SELECCIÓN DE PASADÍA */
                      <div className="space-y-4 animate-in slide-in-from-right-10 duration-300">
                        <div className="flex items-center gap-2 mb-2">
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPaymentMethod(null)}
                              className="text-muted-foreground hover:text-foreground -ml-2"
                          >
                            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
                          </Button>
                        </div>

                        <div className="space-y-3">
                          <h3 className="font-medium text-foreground">Buscar Cliente / Evento</h3>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Nombre o alias..."
                                value={roomSearch}
                                onChange={(e) => setRoomSearch(e.target.value)}
                                className="pl-9 focus:border-[#D4AF37]"
                                autoFocus
                            />
                          </div>
                        </div>

                        <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pt-2">
                          {filteredPasadias.map((pasadia) => (
                              <button
                                  key={pasadia.id}
                                  onClick={() => setSelectedPasadia(pasadia)}
                                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-[#D4AF37] hover:bg-accent/50 transition-all text-left group"
                              >
                                <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-[#D4AF37]/20">
                                  <Users className="h-5 w-5 text-[#D4AF37]" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{pasadia.alias}</p>
                                  <p className="text-xs text-muted-foreground">{pasadia.description}</p>
                                </div>
                              </button>
                          ))}
                        </div>
                      </div>

                  ) : (

                      /* CONFIRMACIÓN FINAL */
                      <div className="space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-start">
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (paymentMethod === "RoomCharge") setSelectedRoom(null)
                                else if (paymentMethod === "DayPass") setSelectedPasadia(null)
                                else setPaymentMethod(null)
                              }}
                              className="text-muted-foreground hover:text-foreground px-0"
                          >
                            <ArrowLeft className="h-4 w-4 mr-1" /> Cambiar método
                          </Button>
                        </div>

                        <div className="text-center py-2">
                          {paymentMethod === "Cash" && (
                              <div className="flex flex-col items-center">
                                <div className="h-16 w-16 rounded-full bg-[#059669]/10 flex items-center justify-center mb-3 ring-1 ring-[#059669]/30">
                                  <Banknote className="h-8 w-8 text-[#059669]" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">Pago en Efectivo</h3>
                                <p className="text-muted-foreground text-xs mt-1 max-w-[200px]">Recibe el dinero físico e ingrésalo a la caja.</p>
                              </div>
                          )}
                          {paymentMethod === "CreditCard" && (
                              <div className="flex flex-col items-center">
                                <div className="h-16 w-16 rounded-full bg-[#3B82F6]/10 flex items-center justify-center mb-3 ring-1 ring-[#3B82F6]/30">
                                  <CreditCard className="h-8 w-8 text-[#3B82F6]" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">Pago con Tarjeta</h3>
                                <p className="text-muted-foreground text-xs mt-1 max-w-[200px]">Procesa el cobro en el datáfono.</p>
                              </div>
                          )}
                          {paymentMethod === "Transfer" && (
                              <div className="flex flex-col items-center">
                                <div className="h-16 w-16 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center mb-3 ring-1 ring-[#8B5CF6]/30">
                                  <Building2 className="h-8 w-8 text-[#8B5CF6]" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">Transferencia Bancaria</h3>
                                <p className="text-muted-foreground text-xs mt-1 max-w-[200px]">Verifica el comprobante antes de confirmar.</p>
                              </div>
                          )}
                          {paymentMethod === "RoomCharge" && selectedRoom && (
                              <div className="flex flex-col items-center">
                                <div className="h-16 w-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-3 ring-1 ring-[#D4AF37]/30">
                                  <span className="text-xl font-bold text-[#D4AF37]">{selectedRoom.roomNumber}</span>
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">Cargar a Habitación</h3>
                                <div className="text-center mt-1 bg-accent/50 p-2 rounded-md w-full">
                                  <p className="text-xs text-muted-foreground">Huésped:</p>
                                  <p className="text-sm font-medium text-foreground truncate">{selectedRoom.guestName}</p>
                                </div>
                              </div>
                          )}
                          {paymentMethod === "DayPass" && selectedPasadia && (
                              <div className="flex flex-col items-center">
                                <div className="h-16 w-16 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mb-3 ring-1 ring-[#D4AF37]/30">
                                  <Users className="h-8 w-8 text-[#D4AF37]" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground">Cargar a Pasadía</h3>
                                <div className="text-center mt-1 bg-accent/50 p-2 rounded-md w-full">
                                  <p className="text-xs text-muted-foreground">Cuenta:</p>
                                  <p className="text-sm font-medium text-foreground truncate">{selectedPasadia.alias}</p>
                                </div>
                              </div>
                          )}
                        </div>

                        <Button
                            onClick={handleComplete}
                            className={cn(
                                "w-full h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300",
                                paymentMethod === "Cash"
                                    ? "bg-[#059669] hover:bg-[#059669]/90 text-white"
                                    : paymentMethod === "CreditCard"
                                        ? "bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white"
                                        : paymentMethod === "Transfer"
                                            ? "bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white"
                                            : "bg-primary hover:bg-[#B5952F] text-[#0F0F0F]",
                            )}
                        >
                          Confirmar Cobro {formatCurrency(finalTotal)}
                        </Button>
                      </div>
                  )}
                </>
            )}
          </div>
        </DialogContent>
      </Dialog>
  )
}
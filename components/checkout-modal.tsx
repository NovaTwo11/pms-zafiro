"use client"

import { useState, useEffect } from "react"
import {
  CreditCard,
  Banknote,
  BedDouble,
  Search,
  Building2,
  Percent,
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

// --- Tipos Exportados para reutilización ---
export interface ActiveFolio {
  id: string
  roomNumber: string
  guestName: string
  balance: number
  status: string
}

// PaymentMethodType alineado con las opciones de UI
export type PaymentMethodType = "Cash" | "CreditCard" | "Transfer" | "RoomCharge" | "DayPass"

// --- MAPEO CON EL BACKEND (Domain/Enums.cs) ---
// Aseguramos que estos IDs coincidan con tu enum PaymentMethod en C#
const PAYMENT_METHOD_IDS: Record<string, number> = {
  "Cash": 1,
  "CreditCard": 2,
  "DebitCard": 3,
  "Transfer": 4,
  "RoomCharge": 0, // Métodos lógicos, no financieros directos
  "DayPass": 0
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  total: number
  activeFolios: ActiveFolio[]
  // Opción para pre-seleccionar un folio (útil si venimos del Check-out de habitación)
  defaultFolioId?: string
  onComplete: (data: {
    method: PaymentMethodType,
    methodId: number,
    folioId?: string, // El ID del folio al que se aplica el pago/cargo
    finalAmount: number,
    discount: number,
    notes?: string
  }) => void
}

// Datos Mock para Pasadías (Reemplazar con fetch real a API de ExternalFolios)
const availablePasadias = [
  { id: "e1", alias: "Familia Pérez", description: "Evento de cumpleaños" },
  { id: "e2", alias: "Empresa ABC Corp", description: "Almuerzo ejecutivo" },
]

export function CheckoutModal({
                                isOpen,
                                onClose,
                                total,
                                activeFolios,
                                defaultFolioId,
                                onComplete
                              }: CheckoutModalProps) {

  const { isShiftOpen } = useCashierStore()

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType | null>(null)
  const [roomSearch, setRoomSearch] = useState("")

  const [selectedRoom, setSelectedRoom] = useState<ActiveFolio | null>(null)
  const [selectedPasadia, setSelectedPasadia] = useState<(typeof availablePasadias)[0] | null>(null)

  // Estados para descuento
  const [showDiscount, setShowDiscount] = useState(false)
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent")
  const [discountValue, setDiscountValue] = useState("")

  // Efecto para pre-seleccionar folio si se pasa por props (Flujo Check-out)
  useEffect(() => {
    if (isOpen && defaultFolioId && activeFolios.length > 0) {
      const preSelected = activeFolios.find(f => f.id === defaultFolioId)
      if (preSelected) {
        setSelectedRoom(preSelected)
        // Si venimos de checkout, asumimos que vamos a pagar (Cash/Card), no cargar a OTRO cuarto.
        // Pero no seteamos paymentMethod automáticamente para dejar elegir al cajero.
      }
    }
  }, [isOpen, defaultFolioId, activeFolios])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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
      (p) => p.alias.toLowerCase().includes(roomSearch.toLowerCase()) ||
          p.description.toLowerCase().includes(roomSearch.toLowerCase())
  )

  const handleComplete = () => {
    // Validaciones de negocio
    if (paymentMethod === "RoomCharge" && !selectedRoom) return;
    if (paymentMethod === "DayPass" && !selectedPasadia) return;
    if (!paymentMethod) return;

    // Obtener ID del método para el backend
    const methodId = PAYMENT_METHOD_IDS[paymentMethod] || 1; // Default a Cash si falla

    // Determinar el Folio ID destino
    let targetFolioId = undefined;

    // CASO 1: Cargo a Habitación (POS) -> El folio destino es el seleccionado
    if (paymentMethod === "RoomCharge") targetFolioId = selectedRoom?.id;
    // CASO 2: Pasadía -> El folio destino es el externo seleccionado
    else if (paymentMethod === "DayPass") targetFolioId = selectedPasadia?.id;
    // CASO 3: Pago Directo (Cash/Card) -> Si había un folio pre-seleccionado (Check-out), usamos ese
    else if (selectedRoom) targetFolioId = selectedRoom.id;

    onComplete({
      method: paymentMethod,
      methodId: methodId,
      folioId: targetFolioId,
      finalAmount: finalTotal,
      discount: discountAmount,
      notes: showDiscount ? `Descuento aplicado: ${formatCurrency(discountAmount)}` : undefined
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
    // No reseteamos selectedRoom si venía por defecto hasta cerrar completamente
    if (!defaultFolioId) setSelectedRoom(null)
    setSelectedPasadia(null)
    setShowDiscount(false)
    setDiscountValue("")
  }

  return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border p-0 [&>button]:hidden duration-200 gap-0 shadow-2xl">

          {/* HEADER */}
          <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/10">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-serif text-2xl text-foreground flex items-center gap-2">
                {selectedRoom ? (
                    <>
                      <span className="bg-[#D4AF37] text-white text-xs px-2 py-1 rounded">Hab. {selectedRoom.roomNumber}</span>
                      <span>Registrar Pago</span>
                    </>
                ) : (
                    "Cobrar Orden"
                )}
              </DialogTitle>
              <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isShiftOpen && (
                <div className="text-center pt-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monto a Cobrar</p>
                  {discountAmount > 0 ? (
                      <div className="flex flex-col items-center animate-in zoom-in-95">
                        <p className="text-lg text-muted-foreground line-through opacity-70">{formatCurrency(total)}</p>
                        <p className="text-4xl font-black text-[#D4AF37] tracking-tight">{formatCurrency(finalTotal)}</p>
                        <p className="text-xs text-[#059669] font-bold bg-[#059669]/10 px-2 py-1 rounded-full mt-1 border border-[#059669]/20">
                          Ahorras: {formatCurrency(discountAmount)}
                        </p>
                      </div>
                  ) : (
                      <p className="text-4xl font-black text-[#D4AF37] tracking-tight">{formatCurrency(total)}</p>
                  )}
                </div>
            )}
          </DialogHeader>

          {/* BODY */}
          <div className="p-6">

            {/* --- VALIDACIÓN DE CAJA CERRADA --- */}
            {!isShiftOpen ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-4 animate-in zoom-in-95 bg-red-50/50 rounded-xl border border-red-100">
                  <div className="h-16 w-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center ring-4 ring-red-50 dark:ring-red-900/10">
                    <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-700 dark:text-red-400">Caja Cerrada</h3>
                    <p className="text-muted-foreground text-sm max-w-[280px] mx-auto mt-2 leading-relaxed">
                      Para procesar pagos, primero debes abrir un turno en el módulo de Caja.
                    </p>
                  </div>
                  <Button variant="outline" onClick={onClose} className="mt-2 border-red-200 hover:bg-red-100 hover:text-red-800 text-red-700">
                    Entendido, cerrar
                  </Button>
                </div>
            ) : (
                // --- CAJA ABIERTA: FLUJO DE PAGO ---
                <>
                  {paymentMethod === null ? (
                      <div className="space-y-5 animate-in fade-in duration-300">

                        {/* Descuento Toggle */}
                        {!showDiscount ? (
                            <Button
                                variant="outline"
                                onClick={() => setShowDiscount(true)}
                                className="w-full border-dashed border-2 border-muted hover:border-[#059669] hover:text-[#059669] hover:bg-[#059669]/5 transition-all text-muted-foreground"
                            >
                              <Percent className="h-4 w-4 mr-2" />
                              Agregar Descuento
                            </Button>
                        ) : (
                            <div className="p-4 rounded-xl border border-[#059669]/30 bg-[#059669]/5 space-y-3 animate-in fade-in slide-in-from-top-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-[#059669] flex items-center gap-2">
                                  <Percent className="h-4 w-4"/> Configurar Descuento
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setShowDiscount(false)
                                      setDiscountValue("")
                                    }}
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-full"
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
                                        "flex-1 transition-all h-9 text-xs font-medium border",
                                        discountType === "percent"
                                            ? "bg-[#059669] text-white border-[#059669] shadow-sm"
                                            : "hover:bg-accent"
                                    )}
                                >
                                  % Porcentaje
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDiscountType("fixed")}
                                    className={cn(
                                        "flex-1 transition-all h-9 text-xs font-medium border",
                                        discountType === "fixed"
                                            ? "bg-[#059669] text-white border-[#059669] shadow-sm"
                                            : "hover:bg-accent"
                                    )}
                                >
                                  $ Valor Fijo
                                </Button>
                              </div>
                              <Input
                                  type="number"
                                  placeholder={discountType === "percent" ? "Ej: 10 (%)" : "Ej: 5000 ($)"}
                                  value={discountValue}
                                  onChange={(e) => setDiscountValue(e.target.value)}
                                  className="bg-background border-border focus:ring-1 focus:ring-[#059669] h-10"
                                  autoFocus
                              />
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                          <PaymentOption
                              icon={Banknote}
                              label="Efectivo"
                              color="text-[#059669]"
                              borderColor="group-hover:border-[#059669]"
                              bgColor="group-hover:bg-[#059669]/5"
                              onClick={() => setPaymentMethod("Cash")}
                          />
                          <PaymentOption
                              icon={CreditCard}
                              label="Tarjeta"
                              color="text-[#3B82F6]"
                              borderColor="group-hover:border-[#3B82F6]"
                              bgColor="group-hover:bg-[#3B82F6]/5"
                              onClick={() => setPaymentMethod("CreditCard")}
                          />
                          <PaymentOption
                              icon={Building2}
                              label="Transferencia"
                              color="text-[#8B5CF6]"
                              borderColor="group-hover:border-[#8B5CF6]"
                              bgColor="group-hover:bg-[#8B5CF6]/5"
                              onClick={() => setPaymentMethod("Transfer")}
                          />
                        </div>

                        {/* Opciones de Cargo (Solo si no hay folio pre-seleccionado o si queremos permitir split) */}
                        {!selectedRoom && (
                            <>
                              <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                  <span className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                                  <span className="bg-card px-2 text-muted-foreground">Opciones de Cargo</span>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <PaymentOption
                                    icon={BedDouble}
                                    label="A la Habitación"
                                    color="text-[#D4AF37]"
                                    borderColor="group-hover:border-[#D4AF37]"
                                    bgColor="group-hover:bg-[#D4AF37]/5"
                                    onClick={() => setPaymentMethod("RoomCharge")}
                                    className="h-16 flex-row gap-3"
                                />
                                <PaymentOption
                                    icon={Users}
                                    label="Pasadía / Externo"
                                    color="text-[#D4AF37]"
                                    borderColor="group-hover:border-[#D4AF37]"
                                    bgColor="group-hover:bg-[#D4AF37]/5"
                                    onClick={() => setPaymentMethod("DayPass")}
                                    className="h-16 flex-row gap-3"
                                />
                              </div>
                            </>
                        )}
                      </div>

                  ) : paymentMethod === "RoomCharge" && !selectedRoom ? (

                      /* SELECCIÓN DE HABITACIÓN (Si no venía pre-seleccionada) */
                      <div className="space-y-4 animate-in slide-in-from-right-10 duration-300 h-full flex flex-col">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPaymentMethod(null)}
                            className="text-muted-foreground hover:text-foreground self-start pl-0 -ml-2 mb-2"
                        >
                          <ArrowLeft className="h-4 w-4 mr-1" /> Volver a métodos
                        </Button>

                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                              placeholder="Buscar por habitación o huésped..."
                              value={roomSearch}
                              onChange={(e) => setRoomSearch(e.target.value)}
                              className="pl-9 h-11 focus-visible:ring-[#D4AF37]"
                              autoFocus
                          />
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2 space-y-2 max-h-[300px]">
                          {filteredRooms.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-10 opacity-50">
                                <BedDouble className="h-10 w-10 mb-2" />
                                <p className="text-sm">No se encontraron huéspedes</p>
                              </div>
                          ) : (
                              filteredRooms.map((folio) => (
                                  <div
                                      key={folio.id}
                                      onClick={() => setSelectedRoom(folio)}
                                      className="cursor-pointer p-3 rounded-lg border border-border bg-card hover:border-[#D4AF37] hover:shadow-md transition-all flex items-center justify-between group"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center font-bold text-foreground group-hover:bg-[#D4AF37] group-hover:text-white transition-colors">
                                        {folio.roomNumber}
                                      </div>
                                      <div>
                                        <p className="font-medium leading-none">{folio.guestName}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Folio: {folio.status}</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-muted-foreground">Saldo</p>
                                      <p className={cn("font-bold text-sm", folio.balance > 0 ? "text-red-500" : "text-green-600")}>
                                        {formatCurrency(folio.balance)}
                                      </p>
                                    </div>
                                  </div>
                              ))
                          )}
                        </div>
                      </div>

                  ) : paymentMethod === "DayPass" && !selectedPasadia ? (

                      /* SELECCIÓN DE PASADÍA */
                      <div className="space-y-4 animate-in slide-in-from-right-10 duration-300 h-full flex flex-col">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPaymentMethod(null)}
                            className="text-muted-foreground hover:text-foreground self-start pl-0 -ml-2 mb-2"
                        >
                          <ArrowLeft className="h-4 w-4 mr-1" /> Volver a métodos
                        </Button>

                        <Input
                            placeholder="Buscar cliente externo..."
                            value={roomSearch}
                            onChange={(e) => setRoomSearch(e.target.value)}
                            className="focus-visible:ring-[#D4AF37]"
                            autoFocus
                        />

                        <div className="space-y-2">
                          {filteredPasadias.map((pasadia) => (
                              <div
                                  key={pasadia.id}
                                  onClick={() => setSelectedPasadia(pasadia)}
                                  className="cursor-pointer p-3 rounded-lg border border-border hover:bg-accent/50 flex items-center gap-3 transition-colors"
                              >
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                  <Users className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-medium">{pasadia.alias}</p>
                                  <p className="text-xs text-muted-foreground">{pasadia.description}</p>
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>

                  ) : (

                      /* CONFIRMACIÓN FINAL */
                      <div className="space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="bg-accent/30 rounded-xl p-4 border border-border">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                                "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
                                paymentMethod === "Cash" ? "bg-[#059669]/10 text-[#059669]" :
                                    paymentMethod === "CreditCard" ? "bg-[#3B82F6]/10 text-[#3B82F6]" :
                                        paymentMethod === "Transfer" ? "bg-[#8B5CF6]/10 text-[#8B5CF6]" :
                                            "bg-[#D4AF37]/10 text-[#D4AF37]"
                            )}>
                              {paymentMethod === "Cash" && <Banknote className="h-6 w-6" />}
                              {paymentMethod === "CreditCard" && <CreditCard className="h-6 w-6" />}
                              {paymentMethod === "Transfer" && <Building2 className="h-6 w-6" />}
                              {(paymentMethod === "RoomCharge" || paymentMethod === "DayPass") && <BedDouble className="h-6 w-6" />}
                            </div>

                            <div className="space-y-1">
                              <p className="text-sm text-muted-foreground font-medium">Método de Pago</p>
                              <h3 className="text-lg font-bold text-foreground">
                                {paymentMethod === "Cash" && "Efectivo"}
                                {paymentMethod === "CreditCard" && "Tarjeta de Crédito/Débito"}
                                {paymentMethod === "Transfer" && "Transferencia Bancaria"}
                                {paymentMethod === "RoomCharge" && "Cargo a Habitación"}
                                {paymentMethod === "DayPass" && "Cuenta Externa"}
                              </h3>

                              {/* Mostrar detalle del destino si es cargo */}
                              {selectedRoom && paymentMethod === "RoomCharge" && (
                                  <p className="text-sm text-[#D4AF37] font-medium pt-1">
                                    Destino: Hab. {selectedRoom.roomNumber} ({selectedRoom.guestName})
                                  </p>
                              )}
                              {selectedPasadia && paymentMethod === "DayPass" && (
                                  <p className="text-sm text-[#D4AF37] font-medium pt-1">
                                    Cliente: {selectedPasadia.alias}
                                  </p>
                              )}
                              {/* NUEVO: Feedback Visual para Ventas Directas */}
                              {!selectedRoom && !selectedPasadia && ["Cash", "CreditCard", "Transfer"].includes(paymentMethod) && (
                                  <p className="text-sm text-[#059669] font-medium pt-1">
                                    Tipo: Venta Directa (Público General)
                                  </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button
                              variant="outline"
                              onClick={() => {
                                // Si veníamos pre-seleccionados, volvemos al menú principal sin borrar el cuarto
                                if (defaultFolioId && selectedRoom?.id === defaultFolioId) {
                                  setPaymentMethod(null)
                                } else if (paymentMethod === "RoomCharge") {
                                  setSelectedRoom(null)
                                } else if (paymentMethod === "DayPass") {
                                  setSelectedPasadia(null)
                                } else {
                                  setPaymentMethod(null)
                                }
                              }}
                              className="flex-1"
                          >
                            Atrás
                          </Button>
                          <Button
                              onClick={handleComplete}
                              className={cn(
                                  "flex-[2] font-bold text-base shadow-lg hover:shadow-xl transition-all",
                                  paymentMethod === "Cash"
                                      ? "bg-[#059669] hover:bg-[#059669]/90 text-white"
                                      : paymentMethod === "CreditCard"
                                          ? "bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white"
                                          : paymentMethod === "Transfer"
                                              ? "bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white"
                                              : "bg-[#D4AF37] hover:bg-[#B5952F] text-white",
                              )}
                          >
                            Confirmar {(!selectedRoom && !selectedPasadia && ["Cash", "CreditCard", "Transfer"].includes(paymentMethod)) ? `Venta Directa (${formatCurrency(finalTotal)})` : formatCurrency(finalTotal)}
                          </Button>
                        </div>
                      </div>
                  )}
                </>
            )}
          </div>
        </DialogContent>
      </Dialog>
  )
}

// Subcomponente auxiliar para botones de método de pago
function PaymentOption({
                         icon: Icon,
                         label,
                         color,
                         borderColor,
                         bgColor,
                         onClick,
                         className
                       }: {
  icon: any,
  label: string,
  color: string,
  borderColor: string,
  bgColor: string,
  onClick: () => void,
  className?: string
}) {
  return (
      <button
          onClick={onClick}
          className={cn(
              "flex flex-col items-center justify-center h-24 rounded-xl border border-border bg-card transition-all duration-200 active:scale-95 group shadow-sm hover:shadow-md",
              borderColor,
              bgColor,
              className
          )}
      >
        <Icon className={cn("h-8 w-8 mb-2 transition-transform group-hover:scale-110", color)} />
        <span className="text-xs font-semibold text-foreground group-hover:text-foreground/80">{label}</span>
      </button>
  )
}
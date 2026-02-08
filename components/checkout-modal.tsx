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
  ArrowLeft
} from "lucide-react"
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

// Sample data - En un caso real, esto vendría de tu API (/api/folios/active-guests y /api/folios/active-externals)
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
]

export function CheckoutModal({ isOpen, onClose, total, onComplete, preselectedRoom }: CheckoutModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null)
  const [roomSearch, setRoomSearch] = useState("")
  // Si viene preseleccionada, buscamos el objeto completo, si no, null
  const [selectedRoom, setSelectedRoom] = useState<(typeof availableRooms)[0] | null>(
      preselectedRoom ? availableRooms.find((r) => r.number === preselectedRoom) || null : null,
  )
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

  // Filtros de búsqueda
  const filteredRooms = availableRooms.filter(
      (room) => room.number.includes(roomSearch) || room.guest.toLowerCase().includes(roomSearch.toLowerCase()),
  )

  const filteredPasadias = availablePasadias.filter(
      (p) => p.alias.toLowerCase().includes(roomSearch.toLowerCase()) || p.description.toLowerCase().includes(roomSearch.toLowerCase())
  )

  const handleComplete = () => {
    // Aquí podrías enviar selectedRoom.number o selectedPasadia.id al backend junto con la orden
    resetState()
    onComplete()
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
        <DialogContent className="sm:max-w-[500px] bg-card border-border p-0 [&>button]:hidden">

          {/* HEADER */}
          <DialogHeader className="p-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <DialogTitle className="font-[family-name:var(--font-heading)] text-2xl text-foreground">Cobrar Orden</DialogTitle>
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
              <p className="text-muted-foreground">Total a pagar</p>
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

          {/* BODY */}
          <div className="p-6">

            {/* VISTA 1: SELECCIÓN DE MÉTODO */}
            {paymentMethod === null ? (
                <div className="space-y-4">

                  {/* Sección de Descuento */}
                  {!showDiscount ? (
                      <Button
                          variant="outline"
                          onClick={() => setShowDiscount(true)}
                          className="w-full border-[#059669] text-[#059669] hover:bg-[#059669]/10 bg-transparent dashed border-2"
                      >
                        <Percent className="h-4 w-4 mr-2" />
                        Agregar Descuento
                      </Button>
                  ) : (
                      <div className="p-4 rounded-lg border border-[#059669]/30 bg-[#059669]/5 space-y-3 animate-in fade-in zoom-in-95 duration-200">
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
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDiscountType("percent")}
                              className={cn(
                                  "flex-1 border-border transition-colors",
                                  discountType === "percent"
                                      ? "bg-[#059669]/20 text-[#059669] border-[#059669]"
                                      : "text-muted-foreground hover:text-foreground bg-transparent",
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
                                  "flex-1 border-border transition-colors",
                                  discountType === "fixed"
                                      ? "bg-[#059669]/20 text-[#059669] border-[#059669]"
                                      : "text-muted-foreground hover:text-foreground bg-transparent",
                              )}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Valor Fijo
                          </Button>
                        </div>
                        <Input
                            type="number"
                            placeholder={discountType === "percent" ? "Ej: 10 (%)" : "Ej: 5000 ($)"}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            className="bg-background border-border text-foreground focus:border-[#059669]"
                        />
                      </div>
                  )}

                  {/* Botones de Pago Directo */}
                  <div className="grid grid-cols-3 gap-4">
                    <button
                        onClick={() => setPaymentMethod("cash")}
                        className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-border bg-background hover:border-[#D4AF37] hover:bg-accent/50 transition-all duration-200 active:scale-95"
                    >
                      <Banknote className="h-8 w-8 text-[#059669] mb-2" />
                      <span className="text-sm font-medium text-foreground">Efectivo</span>
                    </button>
                    <button
                        onClick={() => setPaymentMethod("card")}
                        className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-border bg-background hover:border-[#D4AF37] hover:bg-accent/50 transition-all duration-200 active:scale-95"
                    >
                      <CreditCard className="h-8 w-8 text-[#3B82F6] mb-2" />
                      <span className="text-sm font-medium text-foreground">Tarjeta</span>
                    </button>
                    <button
                        onClick={() => setPaymentMethod("transfer")}
                        className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-border bg-background hover:border-[#D4AF37] hover:bg-accent/50 transition-all duration-200 active:scale-95"
                    >
                      <Building2 className="h-8 w-8 text-[#8B5CF6] mb-2" />
                      <span className="text-sm font-medium text-foreground">Transferencia</span>
                    </button>
                  </div>

                  {/* Botones de Cargo a Cuenta */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setPaymentMethod("room")}
                        className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-border bg-background hover:border-[#D4AF37] hover:bg-accent/50 transition-all duration-200 active:scale-95"
                    >
                      <BedDouble className="h-6 w-6 text-[#D4AF37] mb-2" />
                      <span className="text-sm font-medium text-foreground">Cargar a Habitación</span>
                    </button>

                    <button
                        onClick={() => setPaymentMethod("daypass")}
                        className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-border bg-background hover:border-[#D4AF37] hover:bg-accent/50 transition-all duration-200 active:scale-95"
                    >
                      <Users className="h-6 w-6 text-[#D4AF37] mb-2" />
                      <span className="text-sm font-medium text-foreground">Cargar a Pasadía</span>
                    </button>
                  </div>

                  <Button
                      variant="ghost"
                      onClick={handleClose}
                      className="w-full mt-4 text-muted-foreground hover:text-foreground"
                  >
                    Cancelar Operación
                  </Button>
                </div>

            ) : paymentMethod === "room" && !selectedRoom ? (

                /* VISTA 2: SELECCIÓN DE HABITACIÓN */
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPaymentMethod(null)}
                        className="text-muted-foreground hover:text-foreground px-2"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
                    </Button>
                    <h3 className="font-medium text-foreground">Seleccionar Habitación</h3>
                  </div>

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

                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                    {filteredRooms.map((room) => (
                        <button
                            key={room.number}
                            onClick={() => setSelectedRoom(room)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-accent/50 hover:border-[#D4AF37] transition-all duration-200 text-left group"
                        >
                          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-[#D4AF37]/20 transition-colors">
                            <span className="text-sm font-bold text-[#D4AF37]">{room.number}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{room.guest}</p>
                            <p className="text-xs text-muted-foreground">Habitación {room.number}</p>
                          </div>
                        </button>
                    ))}
                    {filteredRooms.length === 0 && (
                        <div className="text-center py-8">
                          <BedDouble className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                          <p className="text-muted-foreground">No se encontraron habitaciones</p>
                        </div>
                    )}
                  </div>
                </div>

            ) : paymentMethod === "daypass" && !selectedPasadia ? (

                /* VISTA 3: SELECCIÓN DE PASADÍA (FOLIO EXTERNO) */
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPaymentMethod(null)}
                        className="text-muted-foreground hover:text-foreground px-2"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" /> Atrás
                    </Button>
                    <h3 className="font-medium text-foreground">Seleccionar Pasadía / Cliente</h3>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nombre o alias..."
                        value={roomSearch} // Reutilizamos state de búsqueda
                        onChange={(e) => setRoomSearch(e.target.value)}
                        className="pl-9 bg-background border-border text-foreground placeholder:text-[#666666] focus:border-[#D4AF37] transition-all duration-300"
                        autoFocus
                    />
                  </div>

                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                    {filteredPasadias.map((pasadia) => (
                        <button
                            key={pasadia.id}
                            onClick={() => setSelectedPasadia(pasadia)}
                            className="w-full flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-accent/50 hover:border-[#D4AF37] transition-all duration-200 text-left group"
                        >
                          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center group-hover:bg-[#D4AF37]/20 transition-colors">
                            <Users className="h-5 w-5 text-[#D4AF37]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{pasadia.alias}</p>
                            <p className="text-xs text-muted-foreground">{pasadia.description}</p>
                          </div>
                        </button>
                    ))}
                    {filteredPasadias.length === 0 && (
                        <div className="text-center py-8">
                          <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                          <p className="text-muted-foreground">No se encontraron folios externos</p>
                        </div>
                    )}
                  </div>
                </div>

            ) : (

                /* VISTA 4: CONFIRMACIÓN FINAL */
                <div className="space-y-6 animate-in zoom-in-95 duration-300">
                  <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (paymentMethod === "room") setSelectedRoom(null)
                        else if (paymentMethod === "daypass") setSelectedPasadia(null)
                        else setPaymentMethod(null)
                      }}
                      className="text-muted-foreground hover:text-foreground px-0"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Cambiar método
                  </Button>

                  <div className="text-center py-4">
                    {paymentMethod === "cash" && (
                        <>
                          <div className="h-20 w-20 rounded-full bg-[#059669]/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-[#059669]/30">
                            <Banknote className="h-10 w-10 text-[#059669]" />
                          </div>
                          <h3 className="text-xl font-semibold text-foreground">Pago en Efectivo</h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            Recibe el dinero e ingresa al sistema.
                          </p>
                        </>
                    )}
                    {paymentMethod === "card" && (
                        <>
                          <div className="h-20 w-20 rounded-full bg-[#3B82F6]/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-[#3B82F6]/30">
                            <CreditCard className="h-10 w-10 text-[#3B82F6]" />
                          </div>
                          <h3 className="text-xl font-semibold text-foreground">Pago con Tarjeta</h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            Procesa el cobro en el datáfono.
                          </p>
                        </>
                    )}
                    {paymentMethod === "transfer" && (
                        <>
                          <div className="h-20 w-20 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-[#8B5CF6]/30">
                            <Building2 className="h-10 w-10 text-[#8B5CF6]" />
                          </div>
                          <h3 className="text-xl font-semibold text-foreground">Transferencia</h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            Verifique el comprobante bancario.
                          </p>
                        </>
                    )}
                    {paymentMethod === "room" && selectedRoom && (
                        <>
                          <div className="h-20 w-20 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-[#D4AF37]/30">
                            <span className="text-2xl font-bold text-[#D4AF37]">{selectedRoom.number}</span>
                          </div>
                          <h3 className="text-xl font-semibold text-foreground">Cargar a Habitación</h3>
                          <p className="text-muted-foreground text-sm mt-1 px-4">
                            Se añadirá al folio de: <br/> <span className="font-medium text-foreground">{selectedRoom.guest}</span>
                          </p>
                        </>
                    )}
                    {paymentMethod === "daypass" && selectedPasadia && (
                        <>
                          <div className="h-20 w-20 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-4 ring-1 ring-[#D4AF37]/30">
                            <Users className="h-10 w-10 text-[#D4AF37]" />
                          </div>
                          <h3 className="text-xl font-semibold text-foreground">Cargar a Pasadía</h3>
                          <p className="text-muted-foreground text-sm mt-1 px-4">
                            Cuenta: <span className="font-medium text-foreground">{selectedPasadia.alias}</span> <br/>
                            <span className="text-xs">{selectedPasadia.description}</span>
                          </p>
                        </>
                    )}
                  </div>

                  <div className="space-y-3 pt-2">
                    <Button
                        onClick={handleComplete}
                        className={cn(
                            "w-full h-12 text-lg font-semibold shadow-lg transition-all duration-300",
                            paymentMethod === "cash"
                                ? "bg-[#059669] hover:bg-[#059669]/90 text-white shadow-[#059669]/20"
                                : paymentMethod === "card"
                                    ? "bg-[#3B82F6] hover:bg-[#3B82F6]/90 text-white shadow-[#3B82F6]/20"
                                    : paymentMethod === "transfer"
                                        ? "bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white shadow-[#8B5CF6]/20"
                                        : "bg-primary hover:bg-[#B5952F] text-[#0F0F0F] shadow-amber-900/20",
                        )}
                    >
                      Confirmar {formatCurrency(finalTotal)}
                    </Button>
                  </div>
                </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
  )
}
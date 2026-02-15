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
  AlertTriangle,
  Eraser
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useCashierStore } from "@/lib/store"

export interface ActiveFolio {
  id: string
  roomNumber: string
  guestName: string
  balance: number
  status: string
  description?: string // Añadido para los folios externos
}

export type PaymentMethodType = "Cash" | "CreditCard" | "DebitCard" | "Transfer" | "RoomCharge" | "DayPass"

const PAYMENT_METHOD_IDS: Record<string, number> = {
  "Cash": 1,
  "CreditCard": 2,
  "DebitCard": 3,
  "Transfer": 4,
  "RoomCharge": 0,
  "DayPass": 0
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  total: number
  activeFolios: ActiveFolio[]
  defaultFolioId?: string
  onComplete: (data: {
    method: PaymentMethodType,
    methodId: number,
    folioId?: string,
    finalAmount: number,
    discount: number,
    notes?: string
  }) => void
}

export function CheckoutModal({
                                isOpen,
                                onClose,
                                total,
                                activeFolios,
                                defaultFolioId,
                                onComplete
                              }: CheckoutModalProps) {

  const isShiftOpen = useCashierStore ? useCashierStore((s) => s.isShiftOpen) : true

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType | null>(null)
  const [roomSearch, setRoomSearch] = useState("")

  // Un solo estado para el destino (sea habitación o pasadía)
  const [selectedRoom, setSelectedRoom] = useState<ActiveFolio | null>(null)

  const [editableAmount, setEditableAmount] = useState<string>("")

  const [showDiscount, setShowDiscount] = useState(false)
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent")
  const [discountValue, setDiscountValue] = useState("")

  useEffect(() => {
    if (isOpen) {
      setEditableAmount(total.toString())
      if (defaultFolioId && activeFolios.length > 0) {
        const preSelected = activeFolios.find(f => f.id === defaultFolioId)
        if (preSelected) setSelectedRoom(preSelected)
      }
    } else {
      resetState()
    }
  }, [isOpen, total, defaultFolioId, activeFolios])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const currentAmount = parseFloat(editableAmount) || 0

  const calculateDiscount = () => {
    const value = parseFloat(discountValue) || 0
    if (discountType === "percent") {
      return (currentAmount * value) / 100
    }
    return value
  }

  const discountAmount = calculateDiscount()
  const finalTotal = Math.max(0, currentAmount - discountAmount)

  // --- FILTROS SEPARADOS USANDO LOS DATOS REALES ---

  // Filtro 1: Solo Huéspedes reales (RoomNumber NO es "EXT")
  const filteredRooms = activeFolios.filter((folio) =>
      folio.roomNumber !== "EXT" &&
      ((folio.roomNumber?.toLowerCase().includes(roomSearch.toLowerCase()) ?? false) ||
          (folio.guestName?.toLowerCase().includes(roomSearch.toLowerCase()) ?? false))
  )

  // Filtro 2: Solo Pasadías reales (RoomNumber ES "EXT")
  const filteredPasadias = activeFolios.filter((folio) =>
      folio.roomNumber === "EXT" &&
      ((folio.guestName?.toLowerCase().includes(roomSearch.toLowerCase()) ?? false) ||
          (folio.description?.toLowerCase().includes(roomSearch.toLowerCase()) ?? false))
  )

  const handleComplete = () => {
    if ((paymentMethod === "RoomCharge" || paymentMethod === "DayPass") && !selectedRoom) return;
    if (!paymentMethod) return;

    const methodId = PAYMENT_METHOD_IDS[paymentMethod] || 1;

    // El destino siempre es selectedRoom.id (ya sea habitación o pasadía)
    let targetFolioId = defaultFolioId || selectedRoom?.id;

    onComplete({
      method: paymentMethod,
      methodId: methodId,
      folioId: targetFolioId,
      finalAmount: finalTotal,
      discount: discountAmount,
      notes: showDiscount ? `Descuento aplicado: ${formatCurrency(discountAmount)}` : undefined
    })
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  const resetState = () => {
    setPaymentMethod(null)
    setRoomSearch("")
    if (!defaultFolioId) setSelectedRoom(null)
    setShowDiscount(false)
    setDiscountValue("")
    setEditableAmount("")
  }

  return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border p-0 gap-0 shadow-2xl overflow-hidden">

          {/* HEADER */}
          <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/10">
            <div className="flex items-center justify-between mb-2">
              <DialogTitle className="font-serif text-2xl text-foreground flex items-center gap-2">
                {selectedRoom ? (
                    <>
                      <span className="bg-[#D4AF37] text-white text-xs px-2 py-1 rounded">
                        {selectedRoom.roomNumber === "EXT" ? "EXT" : `Hab. ${selectedRoom.roomNumber}`}
                      </span>
                      <span>Registrar Cargo</span>
                    </>
                ) : (
                    "Cobrar"
                )}
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {isShiftOpen && (
                <div className="text-center pt-2 flex flex-col items-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Monto a Cobrar</p>

                  <div className="relative group flex items-center justify-center">
                    <span className="text-2xl font-bold text-muted-foreground mr-1">$</span>
                    <Input
                        type="number"
                        value={editableAmount}
                        onChange={(e) => setEditableAmount(e.target.value)}
                        className="text-4xl font-black text-[#D4AF37] tracking-tight text-center border-none shadow-none focus-visible:ring-0 w-48 h-12 p-0 bg-transparent placeholder:text-muted/20 inline-block"
                        placeholder="0"
                    />
                    <Eraser
                        className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-50 cursor-pointer hover:!opacity-100 transition-opacity ml-1"
                        onClick={() => setEditableAmount("")}
                    />
                  </div>

                  {discountAmount > 0 && (
                      <div className="flex items-center justify-center gap-2 mt-2 animate-in slide-in-from-bottom-1">
                        <p className="text-xs text-[#059669] font-bold bg-[#059669]/10 px-2 py-0.5 rounded-full border border-[#059669]/20">
                          - {formatCurrency(discountAmount)} (Desc.)
                        </p>
                        <p className="text-sm font-bold text-foreground border-t border-foreground/20 pt-1">
                          Final: {formatCurrency(finalTotal)}
                        </p>
                      </div>
                  )}
                </div>
            )}
          </DialogHeader>

          {/* BODY */}
          <div className="p-6 min-h-[300px]">

            {!isShiftOpen ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-4 animate-in zoom-in-95 bg-red-50/50 rounded-xl border border-red-100">
                  <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center ring-4 ring-red-50">
                    <AlertTriangle className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-red-700">Caja Cerrada</h3>
                    <p className="text-muted-foreground text-sm max-w-[280px] mx-auto mt-2 leading-relaxed">
                      Para procesar pagos, primero debes abrir un turno en el módulo de Caja.
                    </p>
                  </div>
                  <Button variant="outline" onClick={onClose} className="mt-2 text-red-700 hover:bg-red-50">Cerrar</Button>
                </div>
            ) : (
                <>
                  {paymentMethod === null ? (
                      /* SELECCIÓN DE MÉTODO */
                      <div className="space-y-5 animate-in fade-in duration-300">

                        {/* Toggle Descuento */}
                        {!showDiscount ? (
                            <Button
                                variant="outline"
                                onClick={() => setShowDiscount(true)}
                                className="w-full border-dashed border-2 text-muted-foreground hover:text-primary hover:border-primary/50"
                            >
                              <Percent className="h-4 w-4 mr-2" /> Agregar Descuento / Ajuste
                            </Button>
                        ) : (
                            <div className="p-3 rounded-lg border bg-muted/20 space-y-3 animate-in fade-in slide-in-from-top-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold uppercase text-muted-foreground">Configurar Descuento</span>
                                <X className="h-4 w-4 cursor-pointer text-muted-foreground" onClick={() => { setShowDiscount(false); setDiscountValue(""); }}/>
                              </div>
                              <div className="flex gap-2">
                                <div className="flex bg-muted rounded p-1 gap-1">
                                  <button onClick={() => setDiscountType("percent")} className={cn("px-3 py-1 text-xs rounded transition-all", discountType === "percent" ? "bg-background shadow font-bold" : "text-muted-foreground")}>%</button>
                                  <button onClick={() => setDiscountType("fixed")} className={cn("px-3 py-1 text-xs rounded transition-all", discountType === "fixed" ? "bg-background shadow font-bold" : "text-muted-foreground")}>$</button>
                                </div>
                                <Input
                                    type="number"
                                    placeholder={discountType === "percent" ? "Porcentaje (ej. 10)" : "Monto Fijo"}
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(e.target.value)}
                                    className="h-8 bg-background"
                                />
                              </div>
                            </div>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                          <PaymentOption icon={Banknote} label="Efectivo" color="text-[#059669]" onClick={() => setPaymentMethod("Cash")} />
                          <PaymentOption icon={CreditCard} label="Tarjeta" color="text-[#3B82F6]" onClick={() => setPaymentMethod("CreditCard")} />
                          <PaymentOption icon={Building2} label="Transfer." color="text-[#8B5CF6]" onClick={() => setPaymentMethod("Transfer")} />
                        </div>

                        {!selectedRoom && (
                            <>
                              <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider"><span className="bg-card px-2 text-muted-foreground">Cargos Internos</span></div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <PaymentOption icon={BedDouble} label="A Habitación" color="text-[#D4AF37]" onClick={() => setPaymentMethod("RoomCharge")} className="flex-row gap-3 h-14" />
                                <PaymentOption icon={Users} label="Pasadía" color="text-[#D4AF37]" onClick={() => setPaymentMethod("DayPass")} className="flex-row gap-3 h-14" />
                              </div>
                            </>
                        )}
                      </div>

                  ) : paymentMethod === "RoomCharge" && !selectedRoom ? (

                      /* BUSCADOR HABITACIÓN */
                      <div className="space-y-4 animate-in slide-in-from-right-10 duration-200">
                        <Button variant="ghost" size="sm" onClick={() => setPaymentMethod(null)} className="pl-0 -ml-2 text-muted-foreground"><ArrowLeft className="h-4 w-4 mr-1"/> Volver</Button>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
                          <Input placeholder="Buscar hab o huésped..." value={roomSearch} onChange={e => setRoomSearch(e.target.value)} className="pl-9" autoFocus />
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[250px] space-y-2 pr-2">
                          {filteredRooms.length === 0 ? (
                              <p className="text-center text-sm text-muted-foreground py-4">No hay habitaciones activas</p>
                          ) : (
                              filteredRooms.map(f => (
                                  <div key={f.id} onClick={() => setSelectedRoom(f)} className="p-3 border rounded hover:border-[#D4AF37] hover:bg-accent/50 cursor-pointer flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center font-bold text-xs group-hover:bg-[#D4AF37] group-hover:text-white transition-colors">{f.roomNumber}</div>
                                      <div><p className="text-sm font-medium">{f.guestName}</p></div>
                                    </div>
                                    <span className={cn("text-xs font-bold", f.balance > 0 ? "text-red-500" : "text-green-500")}>{formatCurrency(f.balance)}</span>
                                  </div>
                              ))
                          )}
                        </div>
                      </div>

                  ) : paymentMethod === "DayPass" && !selectedRoom ? (

                      /* BUSCADOR PASADÍA (Ahora usa los datos reales) */
                      <div className="space-y-4 animate-in slide-in-from-right-10 duration-200">
                        <Button variant="ghost" size="sm" onClick={() => setPaymentMethod(null)} className="pl-0 -ml-2 text-muted-foreground"><ArrowLeft className="h-4 w-4 mr-1"/> Volver</Button>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/>
                          <Input placeholder="Buscar cliente externo..." value={roomSearch} onChange={e => setRoomSearch(e.target.value)} className="pl-9" autoFocus />
                        </div>
                        <div className="flex-1 overflow-y-auto max-h-[250px] space-y-2 pr-2">
                          {filteredPasadias.length === 0 ? (
                              <p className="text-center text-sm text-muted-foreground py-4">No hay pasadías activos</p>
                          ) : (
                              filteredPasadias.map(p => (
                                  <div key={p.id} onClick={() => setSelectedRoom(p)} className="p-3 border rounded hover:border-[#D4AF37] hover:bg-accent/50 cursor-pointer flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center font-bold text-xs group-hover:bg-[#D4AF37] group-hover:text-white transition-colors">EXT</div>
                                      <div>
                                        <p className="font-bold text-sm">{p.guestName}</p>
                                        {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                                      </div>
                                    </div>
                                    <span className={cn("text-xs font-bold", p.balance > 0 ? "text-red-500" : "text-green-500")}>{formatCurrency(p.balance)}</span>
                                  </div>
                              ))
                          )}
                        </div>
                      </div>

                  ) : (

                      /* CONFIRMACIÓN */
                      <div className="space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="bg-accent/30 rounded-xl p-4 border flex gap-4 items-start">
                          <div className={cn("h-12 w-12 rounded-full flex items-center justify-center shrink-0",
                              paymentMethod === "Cash" ? "bg-green-100 text-green-600" :
                                  paymentMethod === "CreditCard" ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                          )}>
                            {paymentMethod === "Cash" && <Banknote />}
                            {paymentMethod === "CreditCard" && <CreditCard />}
                            {(paymentMethod === "RoomCharge" || paymentMethod === "DayPass") && <BedDouble />}
                            {paymentMethod === "Transfer" && <Building2 />}
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground font-medium">Confirmar Transacción</p>
                            <h3 className="text-lg font-bold">
                              {paymentMethod === "Cash" ? "Pago en Efectivo" :
                                  paymentMethod === "CreditCard" ? "Pago con Tarjeta" :
                                      paymentMethod === "Transfer" ? "Transferencia" : "Cargo a Cuenta"}
                            </h3>
                            {selectedRoom && (
                                <p className="text-sm text-[#D4AF37]">
                                  Destino: {selectedRoom.roomNumber === "EXT" ? selectedRoom.guestName : `Hab. ${selectedRoom.roomNumber}`}
                                </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button variant="outline" onClick={() => {
                            if (defaultFolioId && selectedRoom?.id === defaultFolioId) setPaymentMethod(null);
                            else setSelectedRoom(null); // Limpiamos el destino sea cual sea
                          }} className="flex-1">Atrás</Button>

                          <Button onClick={handleComplete} className="flex-[2] font-bold text-lg bg-[#D4AF37] hover:bg-[#B5952F] text-white shadow-lg">
                            Confirmar {formatCurrency(finalTotal)}
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

function PaymentOption({ icon: Icon, label, color, onClick, className }: any) {
  return (
      <button onClick={onClick} className={cn("flex flex-col items-center justify-center h-24 rounded-xl border bg-card hover:border-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all group active:scale-95", className)}>
        <Icon className={cn("h-7 w-7 mb-2 transition-transform group-hover:scale-110", color)} />
        <span className="text-xs font-semibold text-foreground">{label}</span>
      </button>
  )
}
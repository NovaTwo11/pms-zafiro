"use client"

import { useState, useMemo } from "react"
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
  Calendar,
  Clock,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

// --- Tipos Actualizados ---
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

// Estructura de transacción mejorada para soportar cantidades
type TransactionItem = {
  id: string
  description: string
  unitPrice: number
  quantity: number
  amount: number // unitPrice * quantity
  category: "room" | "food" | "minibar" | "parking" | "wifi" | "payment"
  date: Date
  user?: string // Quién cargó el consumo
}

// Estructura para el ítem agrupado
type GroupedItem = {
  id: string // Usaremos la descripción como ID único para el grupo
  description: string
  category: string
  totalQuantity: number
  totalAmount: number
  history: TransactionItem[]
}

interface FolioDrawerProps {
  folio: Folio | undefined
  isOpen: boolean
  onClose: () => void
}

// --- Datos de Ejemplo Enriquecidos ---
const sampleItems: TransactionItem[] = [
  { id: "1", description: "Alojamiento", unitPrice: 180000, quantity: 1, amount: 180000, category: "room", date: new Date(2026, 0, 3, 15, 0) },
  { id: "2", description: "Alojamiento", unitPrice: 180000, quantity: 1, amount: 180000, category: "room", date: new Date(2026, 0, 4, 15, 0) },
  // Ejemplo de agrupación: Coca colas en días distintos
  { id: "3", description: "Coca Cola", unitPrice: 6000, quantity: 2, amount: 12000, category: "minibar", date: new Date(2026, 0, 3, 19, 30) },
  { id: "4", description: "Coca Cola", unitPrice: 6000, quantity: 1, amount: 6000, category: "minibar", date: new Date(2026, 0, 4, 14, 15) },
  // Otros servicios
  { id: "5", description: "Hamburguesa Clásica", unitPrice: 25000, quantity: 1, amount: 25000, category: "food", date: new Date(2026, 0, 4, 20, 0) },
  { id: "6", description: "Parqueadero", unitPrice: 25000, quantity: 1, amount: 25000, category: "parking", date: new Date(2026, 0, 3, 10, 0) },
  // Pagos
  { id: "7", description: "Abono Efectivo", unitPrice: -120000, quantity: 1, amount: -120000, category: "payment", date: new Date(2026, 0, 4, 9, 0) },
]

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "room": return BedDouble
    case "food": return Utensils
    case "minibar": return Coffee
    case "parking": return Car
    case "wifi": return Wifi
    case "payment": return CreditCard
    default: return Plus
  }
}

export function FolioDrawer({ folio, isOpen, onClose }: FolioDrawerProps) {
  const router = useRouter()
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)

  // Estado para controlar qué grupo se está visualizando en detalle
  const [selectedGroup, setSelectedGroup] = useState<GroupedItem | null>(null)

  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")

  // --- Lógica de Agrupación (Memoized) ---
  const { groupedItems, summary } = useMemo(() => {
    const groups: Record<string, GroupedItem> = {}
    let totalCharges = 0
    let totalPayments = 0

    sampleItems.forEach(item => {
      // Calcular totales generales
      if (item.category === 'payment') {
        totalPayments += Math.abs(item.amount)
      } else {
        totalCharges += item.amount
      }

      // Lógica de agrupación
      // Para pagos, quizás queramos verlos individuales, pero para productos agrupamos por descripción
      // Aquí agrupamos TODO por descripción para mantener consistencia visual
      const key = item.description

      if (!groups[key]) {
        groups[key] = {
          id: key,
          description: item.description,
          category: item.category,
          totalQuantity: 0,
          totalAmount: 0,
          history: []
        }
      }

      groups[key].totalQuantity += item.quantity
      groups[key].totalAmount += item.amount
      groups[key].history.push(item)
    })

    return {
      groupedItems: Object.values(groups),
      summary: { totalCharges, totalPayments }
    }
  }, []) // En producción, añadir sampleItems o folioId a dependencias

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
  const canCheckOut = folio.balance === 0
  const hasBalance = folio.balance > 0

  // Manejadores
  const handleItemClick = (group: GroupedItem) => {
    setSelectedGroup(group)
    setDetailModalOpen(true)
  }

  const handleCheckOut = () => {
    if (!canCheckOut) {
      alert(`No hay Paz y Salvo. Pendiente: ${formatCurrency(folio.balance)}`)
      return
    }
    console.log("Processing checkout for folio:", folio.id)
    onClose()
  }

  const handleAddPayment = () => {
    if (folio.balance === 0) {
      alert("El saldo ya está en cero.")
      return
    }
    setPaymentModalOpen(true)
  }

  const handleChargeConsumption = () => {
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
          <SheetContent className="w-full sm:max-w-[500px] bg-[#1A1A1A] border-l border-[#333333] p-0 flex flex-col">

            {/* Header del Folio */}
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
                  )}
                  <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-[#A3A3A3] hover:text-[#E5E5E5]">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {isGuest && hasBalance && (
                  <div className="mt-3 p-3 rounded-lg bg-[#CF6679]/10 border border-[#CF6679]/30 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[#CF6679] shrink-0" />
                    <p className="text-xs text-[#CF6679]">
                      Pendiente: <strong>{formatCurrency(folio.balance)}</strong>
                    </p>
                  </div>
              )}
            </SheetHeader>

            {/* Resumen Financiero */}
            <div className="px-6 py-4 border-b border-[#333333] bg-[#0F0F0F]">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-[#A3A3A3]">Cargos</p>
                  <p className="text-lg font-semibold text-[#E5E5E5]">{formatCurrency(summary.totalCharges)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#A3A3A3]">Abonos</p>
                  <p className="text-lg font-semibold text-[#059669]">{formatCurrency(summary.totalPayments)}</p>
                </div>
                <div>
                  <p className="text-xs text-[#A3A3A3]">Saldo</p>
                  <p className={cn("text-lg font-semibold", folio.balance > 0 ? "text-[#CF6679]" : "text-[#059669]")}>
                    {formatCurrency(folio.balance)}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista Agrupada de Movimientos */}
            <div className="flex-1 overflow-y-auto p-6">
              <h4 className="text-sm font-medium text-[#A3A3A3] mb-4">Resumen de Consumos</h4>
              <div className="space-y-3">
                {groupedItems.map((group) => {
                  const Icon = getCategoryIcon(group.category)
                  const isPayment = group.category === 'payment'

                  return (
                      <button
                          key={group.id}
                          onClick={() => handleItemClick(group)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0F0F0F] border border-[#333333] transition-all duration-300 hover:border-[#D4AF37]/50 hover:bg-[#151515] group"
                      >
                        <div className={cn(
                            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            isPayment ? "bg-[#059669]/10" : "bg-[#252525] group-hover:bg-[#2A2A2A]",
                        )}>
                          <Icon className={cn("h-5 w-5", isPayment ? "text-[#059669]" : "text-[#A3A3A3]")} />
                        </div>

                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#E5E5E5] truncate">{group.description}</p>
                            {group.totalQuantity > 1 && (
                                <span className="text-[10px] bg-[#333333] text-[#A3A3A3] px-1.5 py-0.5 rounded-full">
                            x{group.totalQuantity}
                          </span>
                            )}
                          </div>
                          <p className="text-xs text-[#666666]">
                            {group.history.length} {group.history.length === 1 ? 'transacción' : 'transacciones'}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <p className={cn("text-sm font-semibold", isPayment ? "text-[#059669]" : "text-[#E5E5E5]")}>
                            {isPayment ? "-" : ""}
                            {formatCurrency(group.totalAmount)}
                          </p>
                          <ChevronRight className="h-4 w-4 text-[#333333] group-hover:text-[#D4AF37] transition-colors" />
                        </div>
                      </button>
                  )
                })}
              </div>
            </div>

            {/* Botones de Acción (Sticky Footer) */}
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
                Abonar
              </Button>
              <Button
                  onClick={handleChargeConsumption}
                  className="flex-1 bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90 transition-all duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Cargar
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* --- Ventana Emergente de Detalle de Producto (Historial) --- */}
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="sm:max-w-[450px] bg-[#1A1A1A] border-[#333333]">
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-heading)] text-xl text-[#E5E5E5] flex items-center gap-2">
                {selectedGroup && (
                    <>
                      <div className="p-2 bg-[#252525] rounded-md">
                        {/* Renderizamos el icono dinámicamente */}
                        {(() => {
                          const Icon = getCategoryIcon(selectedGroup.category)
                          return <Icon className="h-5 w-5 text-[#D4AF37]" />
                        })()}
                      </div>
                      {selectedGroup.description}
                    </>
                )}
              </DialogTitle>
              <DialogDescription className="text-[#A3A3A3]">
                Historial detallado de transacciones para este ítem.
              </DialogDescription>
            </DialogHeader>

            {selectedGroup && (
                <div className="mt-4">
                  {/* Tabla de resumen superior */}
                  <div className="flex justify-between items-center mb-6 bg-[#0F0F0F] p-3 rounded-lg border border-[#333333]">
                    <div>
                      <p className="text-xs text-[#A3A3A3] mb-1">Cantidad Total</p>
                      <p className="text-xl font-bold text-[#E5E5E5]">{selectedGroup.totalQuantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#A3A3A3] mb-1">Valor Total</p>
                      <p className={cn("text-xl font-bold", selectedGroup.category === 'payment' ? "text-[#059669]" : "text-[#E5E5E5]")}>
                        {formatCurrency(selectedGroup.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Lista cronológica */}
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedGroup.history.sort((a,b) => b.date.getTime() - a.date.getTime()).map((item, index) => (
                        <div key={item.id} className="relative pl-6 pb-2 last:pb-0 border-l border-[#333333]">
                          {/* Línea de tiempo decorativa */}
                          <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />

                          <div className="flex justify-between items-start mb-1">
                            <div className="flex flex-col">
                        <span className="text-sm text-[#E5E5E5] font-medium flex items-center gap-2">
                           <Calendar className="h-3 w-3 text-[#666666]" />
                          {format(item.date, "dd 'de' MMMM, yyyy", { locale: es })}
                        </span>
                              <span className="text-xs text-[#A3A3A3] flex items-center gap-2 mt-1">
                           <Clock className="h-3 w-3 text-[#666666]" />
                                {format(item.date, "hh:mm a", { locale: es })}
                        </span>
                            </div>
                            <div className="text-right">
                         <span className="text-sm font-semibold text-[#E5E5E5]">
                            {formatCurrency(item.amount)}
                         </span>
                              {item.quantity > 1 && (
                                  <p className="text-xs text-[#A3A3A3]">
                                    {item.quantity} x {formatCurrency(item.unitPrice)}
                                  </p>
                              )}
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
            )}
          </DialogContent>
        </Dialog>

        {/* --- Modal de Pagos (Sin Cambios) --- */}
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
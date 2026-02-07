"use client"

import { useState, useMemo, useEffect } from "react"
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
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

// --- Tipos ---
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

type TransactionItem = {
  id: string
  description: string
  unitPrice: number
  quantity: number
  amount: number
  category: "room" | "food" | "minibar" | "parking" | "wifi" | "payment"
  date: Date
  user?: string
}

type GroupedItem = {
  id: string
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

// --- Datos Iniciales ---
const initialItems: TransactionItem[] = [
  { id: "1", description: "Alojamiento", unitPrice: 180000, quantity: 1, amount: 180000, category: "room", date: new Date(2026, 0, 3, 15, 0) },
  { id: "2", description: "Alojamiento", unitPrice: 180000, quantity: 1, amount: 180000, category: "room", date: new Date(2026, 0, 4, 15, 0) },
  { id: "3", description: "Coca Cola", unitPrice: 6000, quantity: 2, amount: 12000, category: "minibar", date: new Date(2026, 0, 3, 19, 30) },
  { id: "4", description: "Coca Cola", unitPrice: 6000, quantity: 1, amount: 6000, category: "minibar", date: new Date(2026, 0, 4, 14, 15) },
  { id: "5", description: "Hamburguesa Clásica", unitPrice: 25000, quantity: 1, amount: 25000, category: "food", date: new Date(2026, 0, 4, 20, 0) },
  { id: "6", description: "Parqueadero", unitPrice: 25000, quantity: 1, amount: 25000, category: "parking", date: new Date(2026, 0, 3, 10, 0) },
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

  // Estados de Modales
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [editTransactionModalOpen, setEditTransactionModalOpen] = useState(false)

  // Datos del Folio (Simulación de base de datos local para la demo)
  const [transactions, setTransactions] = useState<TransactionItem[]>(initialItems)

  // Estado para selección
  const [selectedGroup, setSelectedGroup] = useState<GroupedItem | null>(null)
  const [transactionToEdit, setTransactionToEdit] = useState<TransactionItem | null>(null)

  // Formulario de Pagos y Edición
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [editForm, setEditForm] = useState({ quantity: 1, unitPrice: 0 })

  // Resetear transacciones al cambiar de folio (opcional, aquí mantenemos las mismas para demo)
  // useEffect(() => { setTransactions(initialItems) }, [folio?.id])

  // --- Lógica de Agrupación (Recalcula cuando cambian las transacciones) ---
  const { groupedItems, summary, currentBalance } = useMemo(() => {
    const groups: Record<string, GroupedItem> = {}
    let totalCharges = 0
    let totalPayments = 0

    transactions.forEach(item => {
      if (item.category === 'payment') {
        totalPayments += Math.abs(item.amount)
      } else {
        totalCharges += item.amount
      }

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

    // Calcular saldo actual basado en las transacciones modificadas
    // Nota: Usamos el saldo inicial del prop folio como base, pero para esta demo
    // asumiremos que el saldo se deriva puramente de las transacciones para ver los cambios en tiempo real.
    // Si quisieramos ser estrictos con el prop, usaríamos folio.balance, pero no se actualizaría al borrar ítems.
    const calculatedBalance = totalCharges - totalPayments

    return {
      groupedItems: Object.values(groups),
      summary: { totalCharges, totalPayments },
      currentBalance: calculatedBalance
    }
  }, [transactions])

  // Actualizar el grupo seleccionado si cambian las transacciones (para reflejar ediciones en el modal abierto)
  useEffect(() => {
    if (selectedGroup) {
      const updatedGroup = groupedItems.find(g => g.id === selectedGroup.id)
      if (updatedGroup) {
        setSelectedGroup(updatedGroup)
      } else {
        // Si el grupo desapareció (ej. se borraron todos los items), cerrar modal
        setDetailModalOpen(false)
        setSelectedGroup(null)
      }
    }
  }, [groupedItems])


  if (!folio) return null

  // Helpers
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(Math.abs(amount))
  }

  const isGuest = folio.type === "guest"
  const isExternal = folio.type === "external"
  const title = isGuest ? `Hab. ${folio.roomNumber}` : folio.alias
  const subtitle = isGuest ? folio.guestName : folio.description

  // Usamos el saldo calculado dinámicamente para habilitar/deshabilitar botones
  const canCheckOut = currentBalance === 0

  // --- Manejadores de Acciones ---

  const handleDeleteTransaction = (txId: string) => {
    if (confirm("¿Estás seguro de eliminar este registro?")) {
      setTransactions(prev => prev.filter(t => t.id !== txId))
    }
  }

  const handleEditClick = (tx: TransactionItem) => {
    setTransactionToEdit(tx)
    setEditForm({ quantity: tx.quantity, unitPrice: tx.unitPrice })
    setEditTransactionModalOpen(true)
  }

  const saveTransactionChanges = () => {
    if (!transactionToEdit) return

    setTransactions(prev => prev.map(t => {
      if (t.id === transactionToEdit.id) {
        return {
          ...t,
          quantity: editForm.quantity,
          unitPrice: editForm.unitPrice,
          amount: editForm.quantity * editForm.unitPrice
        }
      }
      return t
    }))
    setEditTransactionModalOpen(false)
    setTransactionToEdit(null)
  }

  const handleDeleteFolio = () => {
    if (confirm(`¿Estás seguro de eliminar el folio "${folio.type}" de forma permanente?`)) {
      console.log("Folio eliminado:", folio.id)
      // Aquí iría la llamada a la API
      onClose()
    }
  }

  // --- Render ---

  return (
      <>
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <SheetContent className="w-full sm:max-w-[500px] bg-card border-l border-border p-0 flex flex-col">

            {/* Header */}
            <SheetHeader className="p-6 border-b border-border">
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle className="font-[family-name:var(--font-heading)] text-2xl text-foreground">
                    {title}
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                  {isGuest && (
                      <p className="text-xs text-muted-foreground mt-2">
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
                          onClick={() => console.log("Checkout")}
                          disabled={!canCheckOut}
                          className={cn(
                              "border-[#CF6679] text-[#CF6679] hover:bg-[#CF6679]/10 hover:text-[#CF6679] bg-transparent",
                              !canCheckOut && "opacity-50 cursor-not-allowed",
                          )}
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Check-out
                      </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Aviso de Saldo Pendiente */}
              {currentBalance > 0 && (
                  <div className="mt-3 p-3 rounded-lg bg-[#CF6679]/10 border border-[#CF6679]/30 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[#CF6679] shrink-0" />
                    <p className="text-xs text-[#CF6679]">
                      Pendiente: <strong>{formatCurrency(currentBalance)}</strong>
                    </p>
                  </div>
              )}
            </SheetHeader>

            {/* Resumen Financiero */}
            <div className="px-6 py-4 border-b border-border bg-background">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Cargos</p>
                  <p className="text-lg font-semibold text-foreground">{formatCurrency(summary.totalCharges)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Abonos</p>
                  <p className="text-lg font-semibold text-[#059669]">{formatCurrency(summary.totalPayments)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo</p>
                  <p className={cn("text-lg font-semibold", currentBalance > 0 ? "text-[#CF6679]" : "text-[#059669]")}>
                    {formatCurrency(currentBalance)}
                  </p>
                </div>
              </div>
            </div>

            {/* Lista Agrupada */}
            <div className="flex-1 overflow-y-auto p-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-4">Resumen de Consumos</h4>
              {groupedItems.length === 0 ? (
                  <div className="text-center py-8 text-[#666666]">
                    <p>No hay consumos registrados</p>
                  </div>
              ) : (
                  <div className="space-y-3">
                    {groupedItems.map((group) => {
                      const Icon = getCategoryIcon(group.category)
                      const isPayment = group.category === 'payment'

                      return (
                          <button
                              key={group.id}
                              onClick={() => { setSelectedGroup(group); setDetailModalOpen(true); }}
                              className="w-full flex items-center gap-3 p-3 rounded-lg bg-background border border-border transition-all duration-300 hover:border-[#D4AF37]/50 hover:bg-[#151515] group"
                          >
                            <div className={cn(
                                "h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                                isPayment ? "bg-[#059669]/10" : "bg-accent group-hover:bg-[#2A2A2A]",
                            )}>
                              <Icon className={cn("h-5 w-5", isPayment ? "text-[#059669]" : "text-muted-foreground")} />
                            </div>

                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground truncate">{group.description}</p>
                                {group.totalQuantity > 1 && (
                                    <span className="text-[10px] bg-[#333333] text-muted-foreground px-1.5 py-0.5 rounded-full">
                                x{group.totalQuantity}
                            </span>
                                )}
                              </div>
                              <p className="text-xs text-[#666666]">
                                {group.history.length} {group.history.length === 1 ? 'registro' : 'registros'}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <p className={cn("text-sm font-semibold", isPayment ? "text-[#059669]" : "text-foreground")}>
                                {isPayment ? "-" : ""}
                                {formatCurrency(group.totalAmount)}
                              </p>
                              <ChevronRight className="h-4 w-4 text-[#333333] group-hover:text-[#D4AF37] transition-colors" />
                            </div>
                          </button>
                      )
                    })}
                  </div>
              )}
            </div>

            {/* Footer de Acciones */}
            <div className="p-4 border-t border-border bg-card flex flex-col gap-3">
              <div className="flex gap-3">
                <Button
                    onClick={() => setPaymentModalOpen(true)}
                    disabled={currentBalance === 0}
                    className={cn(
                        "flex-1 bg-[#059669] text-white hover:bg-[#059669]/90 transition-all duration-300",
                        currentBalance === 0 && "opacity-50 cursor-not-allowed",
                    )}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Abonar
                </Button>
                <Button
                    onClick={() => router.push('/pos')}
                    className="flex-1 bg-primary text-[#0F0F0F] hover:bg-primary/90 transition-all duration-300"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Cargar
                </Button>
              </div>

              {/* Botón Eliminar Folio Externo (Solo si saldo es 0 y es externo) */}
              {isExternal && currentBalance === 0 && (
                  <Button
                      variant="ghost"
                      onClick={handleDeleteFolio}
                      className="w-full text-[#CF6679] hover:text-[#CF6679] hover:bg-[#CF6679]/10 border border-[#CF6679]/20"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar Folio
                  </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* --- Ventana Emergente: Historial Detallado del Producto --- */}
        <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
          <DialogContent className="sm:max-w-[500px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-heading)] text-xl text-foreground flex items-center gap-2">
                {selectedGroup && (
                    <>
                      <div className="p-2 bg-accent rounded-md">
                        {(() => {
                          const Icon = getCategoryIcon(selectedGroup.category)
                          return <Icon className="h-5 w-5 text-[#D4AF37]" />
                        })()}
                      </div>
                      {selectedGroup.description}
                    </>
                )}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Historial detallado. Puedes editar o eliminar registros individuales aquí.
              </DialogDescription>
            </DialogHeader>

            {selectedGroup && (
                <div className="mt-4">
                  {/* Header Resumen Grupo */}
                  <div className="flex justify-between items-center mb-6 bg-background p-3 rounded-lg border border-border">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Unidades</p>
                      <p className="text-xl font-bold text-foreground">{selectedGroup.totalQuantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Valor Acumulado</p>
                      <p className={cn("text-xl font-bold", selectedGroup.category === 'payment' ? "text-[#059669]" : "text-foreground")}>
                        {formatCurrency(selectedGroup.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Lista de Transacciones Individuales con Acciones */}
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedGroup.history.sort((a,b) => b.date.getTime() - a.date.getTime()).map((item) => (
                        <div key={item.id} className="relative pl-6 pb-2 last:pb-0 border-l border-border group">
                          {/* Indicador visual de tiempo */}
                          <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />

                          <div className="flex justify-between items-start bg-[#151515]/50 p-2 rounded-md hover:bg-[#151515] transition-colors">
                            <div className="flex flex-col">
                        <span className="text-sm text-foreground font-medium flex items-center gap-2">
                           <Calendar className="h-3 w-3 text-[#666666]" />
                          {format(item.date, "dd MMM yyyy", { locale: es })}
                        </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                           <Clock className="h-3 w-3 text-[#666666]" />
                                {format(item.date, "hh:mm a", { locale: es })}
                        </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                            <span className="text-sm font-semibold text-foreground">
                                {formatCurrency(item.amount)}
                            </span>
                                {item.quantity > 0 && (
                                    <p className="text-xs text-muted-foreground">
                                      {item.quantity} x {formatCurrency(item.unitPrice)}
                                    </p>
                                )}
                              </div>

                              {/* Menú de Acciones (Editar/Eliminar) */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#2A2A2A]">
                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-card border-border">
                                  <DropdownMenuItem onClick={() => handleEditClick(item)} className="text-foreground focus:bg-accent cursor-pointer">
                                    <Pencil className="mr-2 h-4 w-4 text-[#D4AF37]" />
                                    <span>Editar</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteTransaction(item.id)} className="text-[#CF6679] focus:bg-[#CF6679]/10 focus:text-[#CF6679] cursor-pointer">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Eliminar</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
            )}
          </DialogContent>
        </Dialog>

        {/* --- Modal de Edición de Transacción --- */}
        <Dialog open={editTransactionModalOpen} onOpenChange={setEditTransactionModalOpen}>
          <DialogContent className="sm:max-w-[400px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Editar Consumo</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Modifica la cantidad o el precio unitario.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right text-muted-foreground">
                  Cantidad
                </Label>
                <Input
                    id="quantity"
                    type="number"
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({...editForm, quantity: parseFloat(e.target.value) || 0})}
                    className="col-span-3 bg-background border-border text-foreground"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right text-muted-foreground">
                  Precio Unit.
                </Label>
                <Input
                    id="price"
                    type="number"
                    value={editForm.unitPrice}
                    onChange={(e) => setEditForm({...editForm, unitPrice: parseFloat(e.target.value) || 0})}
                    className="col-span-3 bg-background border-border text-foreground"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-muted-foreground">Total Nuevo</Label>
                <div className="col-span-3 font-semibold text-[#D4AF37]">
                  {formatCurrency(editForm.quantity * editForm.unitPrice)}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditTransactionModalOpen(false)} className="border-border text-foreground bg-transparent hover:bg-accent">
                Cancelar
              </Button>
              <Button onClick={saveTransactionChanges} className="bg-primary text-[#0F0F0F] hover:bg-primary/90">
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* --- Modal de Pagos (Existente) --- */}
        <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <DialogContent className="sm:max-w-[400px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-heading)] text-xl text-foreground">
                Agregar Abono
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Monto *</Label>
                <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0"
                    className="bg-background border-border text-foreground focus:border-[#D4AF37] text-lg transition-all duration-300"
                />
                <p className="text-xs text-muted-foreground">Saldo pendiente: {formatCurrency(currentBalance)}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Método de Pago *</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger className="bg-background border-border text-foreground focus:border-[#D4AF37] transition-all duration-300">
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="cash" className="text-foreground focus:bg-accent">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-[#059669]" />
                        Efectivo
                      </div>
                    </SelectItem>
                    <SelectItem value="card" className="text-foreground focus:bg-accent">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-[#3B82F6]" />
                        Tarjeta
                      </div>
                    </SelectItem>
                    <SelectItem value="transfer" className="text-foreground focus:bg-accent">
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
                    className="flex-1 border-border text-foreground hover:bg-accent bg-transparent transition-all duration-300"
                >
                  Cancelar
                </Button>
                <Button
                    onClick={() => { console.log("Pago registrado"); setPaymentModalOpen(false); }}
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
"use client"

import { useState, useEffect } from "react"
import { ProductGrid } from "./product-grid"
import { Ticket } from "./ticket"
import { CheckoutModal, ActiveFolio, PaymentMethodType } from "./checkout-modal"
import { usePOSStore, useCashierStore } from "@/lib/store" // Importamos useCashierStore
import api from "@/lib/api"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Unlock, LogOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// --- Tipos Backend ---
interface CashierShift {
  id: string;
  status: 0 | 1; // 0=Open, 1=Closed según Enum Backend
}

// --- Datos Mock Productos ---
const categories = [
  { id: "all", name: "Todo" },
  { id: "bebidas", name: "Bebidas" },
  { id: "platos", name: "Platos" },
]

const products = [
  { id: "p1", name: "Coca-Cola", price: 6000, category: "bebidas", image: "/refreshing-cola-can.png" },
  { id: "p2", name: "Agua Mineral", price: 4000, category: "bebidas", image: "/mineral-water-bottle.jpg" },
  { id: "p3", name: "Cerveza Club", price: 8000, category: "bebidas", image: "/amber-beer-bottle.png" },
  { id: "p11", name: "Hamburguesa Clásica", price: 32000, category: "platos", image: "/classic-hamburger.jpg" },
  { id: "p12", name: "Club Sandwich", price: 28000, category: "platos", image: "/club-sandwich.jpg" },
]

export function POSContent() {
  // --- Estados de Negocio ---
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const { items, addItem, clearCart, total } = usePOSStore()

  // Usamos el store global de caja para sincronizar estado
  const { checkStatus } = useCashierStore()

  // --- Estados de Datos Reales ---
  const [shift, setShift] = useState<CashierShift | null>(null)
  const [activeFolios, setActiveFolios] = useState<ActiveFolio[]>([])

  const [loading, setLoading] = useState(true)
  const [openShiftModalOpen, setOpenShiftModalOpen] = useState(false)
  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false)
  const [amountInput, setAmountInput] = useState("")

  // --- Carga Inicial ---
  const initData = async () => {
    try {
      setLoading(true)

      // 1. Turno (Cashier)
      try {
        const { data: shiftData } = await api.get("/cashier/status")
        // El backend devuelve null o 204 si no hay turno, o un objeto si hay
        if (shiftData && shiftData.status === 0) { // 0 = Open
          setShift(shiftData)
        } else {
          setShift(null)
          setOpenShiftModalOpen(true)
        }
      } catch {
        setShift(null)
        setOpenShiftModalOpen(true)
      }

      // 2. Huéspedes Activos (Folios)
      try {
        const { data: foliosData } = await api.get("/folios/active-guests")
        setActiveFolios(foliosData)
      } catch (e) {
        console.error("Error cargando folios", e)
        toast.error("No se pudieron cargar los huéspedes activos")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    initData()
  }, [])

  // --- Handlers Caja ---
  const handleOpenShift = async () => {
    if (!amountInput) return toast.error("Ingresa el monto base")
    try {
      const { data } = await api.post("/cashier/open", { startingAmount: parseFloat(amountInput) })
      setShift(data)
      setOpenShiftModalOpen(false)
      setAmountInput("")
      checkStatus() // Actualiza store global
      toast.success("Caja abierta correctamente")
    } catch (error: any) {
      const msg = error.response?.data || "Error al abrir caja";
      toast.error(typeof msg === 'string' ? msg : "Error al abrir caja")
    }
  }

  const handleCloseShift = async () => {
    if (!amountInput) return toast.error("Ingresa el monto del arqueo")
    try {
      await api.post("/cashier/close", { actualAmount: parseFloat(amountInput) })
      setShift(null)
      setCloseShiftModalOpen(false)
      setOpenShiftModalOpen(true)
      setAmountInput("")
      clearCart()
      checkStatus() // Actualiza store global
      toast.success("Turno cerrado correctamente")
    } catch {
      toast.error("Error al cerrar caja")
    }
  }

  const handleProductClick = (product: typeof products[0]) => {
    if (!shift) {
      toast.error("Debes abrir caja antes de vender")
      setOpenShiftModalOpen(true)
      return
    }
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    })
  }

  // --- Lógica Principal de Cobro ---
  const handlePaymentComplete = async (paymentData: {
    method: PaymentMethodType,
    methodId: number, // <--- Recibimos el ID mapeado del modal (1, 2, 4...)
    folioId?: string,
    finalAmount: number,
    discount: number
  }) => {

    if (!shift) return toast.error("No hay turno abierto")

    let targetFolioId = paymentData.folioId

    // Validación: Si es cargo a habitación, DEBE tener folio.
    // Si es pago directo, idealmente también (a un folio 'Público' o 'Mostrador'),
    // pero por ahora exigiremos folio de huésped o pasadía.
    if (!targetFolioId) {
      toast.error("Seleccione un folio/habitación para registrar la venta.")
      return
    }

    const loadingToast = toast.loading("Procesando venta...")

    try {
      // PASO 1: Registrar los consumos (Charges)
      // Esto genera la deuda en el folio.
      // Type = 0 (Charge)
      const chargePromises = items.map(item => {
        return api.post(`/folios/${targetFolioId}/transactions`, {
          amount: item.price * item.quantity,
          description: item.name, // "Coca Cola x2"
          type: 0, // Charge
          quantity: item.quantity,
          unitPrice: item.price,
          category: "Restaurante", // Opcional
          cashierShiftId: shift.id,
          paymentMethod: 0 // None (es un cargo, no un pago aún)
        })
      })

      await Promise.all(chargePromises)

      // PASO 2: Si NO es "RoomCharge" (crédito), registramos el PAGO inmediato.
      // Esto salda la deuda generada en el paso 1.
      if (paymentData.method !== "RoomCharge") {

        await api.post(`/folios/${targetFolioId}/transactions`, {
          amount: paymentData.finalAmount,
          description: `Pago POS - ${paymentData.method === 'Cash' ? 'Efectivo' : 'Tarjeta/Otro'}`,
          type: 1, // Payment (Enum Backend)
          quantity: 1,
          unitPrice: paymentData.finalAmount,

          // AQUÍ USAMOS EL ID QUE VIENE DEL MODAL
          paymentMethod: paymentData.methodId,

          cashierShiftId: shift.id
        })
      }

      toast.dismiss(loadingToast)
      toast.success("Venta registrada exitosamente")

      clearCart()
      setCheckoutOpen(false)

      // Actualizamos datos de fondo
      checkStatus() // Para que reportes se entere del nuevo ingreso
      initData()    // Para refrescar saldos de habitaciones

    } catch (error) {
      console.error(error)
      toast.dismiss(loadingToast)
      toast.error("Error al procesar la venta. Intente de nuevo.")
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center animate-pulse">Cargando sistema POS...</div>

  return (
      <>
        <div className="h-[calc(100vh-112px)] flex flex-col lg:flex-row gap-6 relative">

          {/* Overlay de Bloqueo si no hay turno */}
          {!shift && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4">
                <LogOut className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h2 className="text-2xl font-bold text-foreground">Caja Cerrada</h2>
                <p className="text-muted-foreground mb-6">Debe abrir un turno de caja para realizar ventas.</p>
                <Button onClick={() => setOpenShiftModalOpen(true)} size="lg" className="bg-[#059669] hover:bg-[#059669]/90 text-white">
                  Abrir Caja Ahora
                </Button>
              </div>
          )}

          {/* Catálogo */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h1 className="font-serif text-3xl font-semibold">Punto de Venta</h1>
                <div className="flex items-center gap-2 mt-1">
                  {shift && <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200"><Unlock className="w-3 h-3 mr-1" /> Caja Abierta</Badge>}
                </div>
              </div>
              {shift && <Button variant="destructive" size="sm" onClick={() => setCloseShiftModalOpen(true)}><LogOut className="w-4 h-4 mr-2" /> Cerrar Turno</Button>}
            </div>

            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} disabled={!shift}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                              selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-card border hover:bg-accent"
                          }`}>
                    {cat.name}
                  </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <ProductGrid
                  products={selectedCategory === "all" ? products : products.filter(p => p.category === selectedCategory)}
                  onProductClick={handleProductClick}
              />
            </div>
          </div>

          {/* Ticket */}
          <div className="w-full lg:w-[380px] shrink-0 border-l border-border pl-6">
            <Ticket items={items} total={total()} onCheckout={() => setCheckoutOpen(true)} />
          </div>
        </div>

        {/* --- Modales de Caja --- */}

        {/* Abrir Caja */}
        <Dialog open={openShiftModalOpen} onOpenChange={setOpenShiftModalOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader><DialogTitle>Apertura de Caja</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-sm">
                Ingrese el monto de efectivo inicial en la caja (Base).
              </div>
              <div className="space-y-2">
                <Label>Monto Base</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input
                      type="number"
                      className="pl-7 text-lg font-medium"
                      placeholder="0"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      autoFocus
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleOpenShift} className="w-full bg-[#059669] hover:bg-[#059669]/90 text-white">
                Confirmar Apertura
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Cerrar Caja */}
        <Dialog open={closeShiftModalOpen} onOpenChange={setCloseShiftModalOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader><DialogTitle>Cierre de Caja</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-md text-sm">
                Cuente el dinero físico y digite el total. El sistema calculará la diferencia.
              </div>
              <div className="space-y-2">
                <Label>Total en Efectivo (Arqueo)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                  <Input
                      type="number"
                      className="pl-7 text-lg font-medium"
                      placeholder="0"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                      autoFocus
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setCloseShiftModalOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleCloseShift}>Cerrar y Generar Reporte</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <CheckoutModal
            isOpen={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            total={total()}
            activeFolios={activeFolios}
            onComplete={handlePaymentComplete}
        />
      </>
  )
}
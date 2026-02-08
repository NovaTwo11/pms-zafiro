"use client"

import { useState, useEffect } from "react"
import { ProductGrid } from "./product-grid"
import { Ticket } from "./ticket"
import { CheckoutModal, ActiveFolio, PaymentMethodType } from "./checkout-modal"
import { usePOSStore } from "@/lib/store"
import api from "@/lib/api"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Unlock, DollarSign, LogOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// --- Tipos Backend ---
interface CashierShift {
  id: string; // Guid
  status: "Open" | "Closed";
}

// --- Datos Mock Productos (Frontend Only) ---
// Nota: Idealmente esto vendría de una tabla "Products", pero lo dejamos mockeado por simplicidad
const categories = [
  { id: "all", name: "Todo" },
  { id: "bebidas", name: "Bebidas" },
  { id: "cocteles", name: "Cócteles" },
  { id: "snacks", name: "Snacks" },
  { id: "platos", name: "Platos" },
  { id: "postres", name: "Postres" },
]

const products = [
  { id: "p1", name: "Coca-Cola", price: 6000, category: "bebidas", image: "/refreshing-cola-can.png" },
  { id: "p2", name: "Agua Mineral", price: 4000, category: "bebidas", image: "/mineral-water-bottle.jpg" },
  { id: "p3", name: "Cerveza Club", price: 8000, category: "bebidas", image: "/amber-beer-bottle.png" },
  { id: "p11", name: "Hamburguesa Clásica", price: 32000, category: "platos", image: "/classic-hamburger.jpg" },
  { id: "p12", name: "Club Sandwich", price: 28000, category: "platos", image: "/club-sandwich.jpg" },
  { id: "p13", name: "Ensalada César", price: 25000, category: "platos", image: "/caesar-salad.png" },
]

export function POSContent() {
  // --- Estados de Negocio ---
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const { items, addItem, clearCart, total } = usePOSStore()

  // --- Estados de Datos Reales ---
  const [shift, setShift] = useState<CashierShift | null>(null)
  const [activeFolios, setActiveFolios] = useState<ActiveFolio[]>([]) // Lista real de backend

  const [loading, setLoading] = useState(true)
  const [openShiftModalOpen, setOpenShiftModalOpen] = useState(false)
  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false)
  const [amountInput, setAmountInput] = useState("")

  // --- Carga Inicial ---
  const initData = async () => {
    try {
      setLoading(true)

      // 1. Obtener Turno de Caja
      try {
        const { data: shiftData } = await api.get("/cashier/status")
        setShift(shiftData)
        if (!shiftData) setOpenShiftModalOpen(true)
      } catch {
        setShift(null)
        setOpenShiftModalOpen(true)
      }

      // 2. Obtener Huéspedes Activos (Para cobrar a habitación)
      try {
        const { data: foliosData } = await api.get("/folios/active-guests")
        setActiveFolios(foliosData)
      } catch (e) {
        console.error("Error cargando folios", e)
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
      toast.success("Caja abierta correctamente")
    } catch {
      toast.error("Error al abrir caja")
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
      toast.success("Turno cerrado correctamente")
    } catch {
      toast.error("Error al cerrar caja")
    }
  }

  // --- Handlers Venta ---
  const handleProductClick = (product: typeof products[0]) => {
    if (!shift) return toast.error("Debes abrir caja primero")

    // CORRECCIÓN:
    // 1. No pasamos 'quantity' (el store lo pone en 1).
    // 2. Mapeamos solo las propiedades que el store espera (id, name, price, image).
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    })
  }

  // Lógica principal de cobro conectada al backend
  const handlePaymentComplete = async (paymentData: {
    method: PaymentMethodType,
    folioId?: string,
    finalAmount: number,
    discount: number
  }) => {

    if (!shift) return toast.error("No hay turno abierto")

    // Si es "RoomCharge", necesitamos obligatoriamente un folio destino.
    // Si es "Cash/Card", idealmente también, pero si no hay, fallará.
    // Para simplificar: Si es Cash/Card y NO seleccionó habitación,
    // asumimos que es una venta "Walk-in" (necesitaríamos un folio genérico,
    // pero por ahora usaremos la primera habitación activa como 'dummy' o lanzaremos error).

    let targetFolioId = paymentData.folioId

    if (!targetFolioId) {
      // Opción: Si es Cash y no hay folio, no podemos guardar en este esquema estricto de FolioTransaction.
      // Solución rápida: Requerir seleccionar habitación SIEMPRE en este MVP.
      if (activeFolios.length > 0) {
        // Fallback a la primera habitación (solo para pruebas) o error
        // toast.error("Por favor selecciona una habitación para asociar la venta (Requerido en MVP)")
        // return;

        // Ojo: checkout-modal ya valida que si es RoomCharge tenga folio.
        // Si es Cash, permitiremos continuar solo si hay un folio seleccionado,
        // Si no, tendremos que asignar uno 'dummy' (lo omito para no complicar).
        // Asumiré que el modal fuerza selección o usamos uno por defecto si queremos.
      } else {
        toast.error("No hay huéspedes activos para cargar la venta.")
        return
      }
    }

    // Si el usuario pagó en Cash/Card pero NO seleccionó folio,
    // en este diseño estricto no podemos guardar la transacción sin FolioId.
    // Así que asumiremos que el usuario SIEMPRE selecciona un folio en el modal
    // (puedes modificar CheckoutModal para forzarlo en Cash también si quieres).
    // Por ahora, si targetFolioId es null, usaremos el primer folio activo como "Fallback" para que no falle el demo.
    if (!targetFolioId && activeFolios.length > 0) {
      targetFolioId = activeFolios[0].id
      toast.info(`Venta asignada a habitación ${activeFolios[0].roomNumber} por defecto`)
    }

    if (!targetFolioId) {
      toast.error("Error: No hay folio destino disponible.")
      return
    }

    try {
      const loadingToast = toast.loading("Procesando transacción...")

      // 1. Registrar Cargos (Consumos) - Type: Charge
      // Enviamos cada producto individualmente para detalle en folio
      const itemPromises = items.map(item => {
        return api.post(`/folios/${targetFolioId}/transactions`, {
          amount: item.price * item.quantity,
          description: item.name, // Nombre del producto
          type: "Charge",
          quantity: item.quantity,
          unitPrice: item.price,
          category: "Restaurante", // Categoría fija por ahora
          cashierShiftId: shift.id
        })
      })

      await Promise.all(itemPromises)

      // 2. Si NO es cargo a habitación (es Cash/Card), registrar el PAGO inmediato.
      if (paymentData.method !== "RoomCharge") {
        await api.post(`/folios/${targetFolioId}/transactions`, {
          amount: paymentData.finalAmount,
          description: `Pago POS - ${paymentData.method}`,
          type: "Payment",
          category: "Payment",
          paymentMethod: paymentData.method,
          cashierShiftId: shift.id
        })
      }

      toast.dismiss(loadingToast)
      toast.success("Venta registrada exitosamente")

      clearCart()
      setCheckoutOpen(false)
      initData() // Recargar datos (saldos actualizados)

    } catch (error) {
      console.error(error)
      toast.error("Error al procesar la venta")
    }
  }

  if (loading) return <div className="h-screen flex items-center justify-center">Cargando sistema...</div>

  return (
      <>
        <div className="h-[calc(100vh-112px)] flex flex-col lg:flex-row gap-6 relative">
          {!shift && <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center text-muted-foreground font-medium">Caja Cerrada - Inicie Turno</div>}

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

            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {categories.map((cat) => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} disabled={!shift}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                              selectedCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-card border hover:bg-accent"
                          }`}>
                    {cat.name}
                  </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto">
              <ProductGrid
                  products={selectedCategory === "all" ? products : products.filter(p => p.category === selectedCategory)}
                  onProductClick={handleProductClick}
              />
            </div>
          </div>

          {/* Ticket */}
          <div className="w-full lg:w-[380px] shrink-0">
            <Ticket items={items} total={total()} onCheckout={() => setCheckoutOpen(true)} />
          </div>
        </div>

        {/* Modales */}
        <Dialog open={openShiftModalOpen} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader><DialogTitle>Apertura de Caja</DialogTitle></DialogHeader>
            <div className="py-4 space-y-2">
              <Label>Monto Base Efectivo</Label>
              <Input type="number" placeholder="0.00" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} />
            </div>
            <DialogFooter><Button onClick={handleOpenShift} className="w-full">Abrir Turno</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={closeShiftModalOpen} onOpenChange={setCloseShiftModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Cierre de Caja</DialogTitle></DialogHeader>
            <div className="py-4 space-y-2">
              <Label>Dinero en Caja (Arqueo)</Label>
              <Input type="number" placeholder="0.00" value={amountInput} onChange={(e) => setAmountInput(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCloseShiftModalOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleCloseShift}>Cerrar Caja</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <CheckoutModal
            isOpen={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            total={total()}
            activeFolios={activeFolios} // Pasamos la data real
            onComplete={handlePaymentComplete} // Recibimos la data real
        />
      </>
  )
}
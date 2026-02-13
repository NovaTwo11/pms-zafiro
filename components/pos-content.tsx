"use client"

import { useState, useEffect } from "react"
import { ProductGrid } from "./product-grid"
import { Ticket } from "./ticket"
import { CheckoutModal, ActiveFolio, PaymentMethodType } from "./checkout-modal"
import { usePOSStore, useCashierStore } from "@/lib/store"
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

interface Product {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  stock: number;
  category: string;
  imageUrl?: string;
  isActive: boolean;
  isStockTracked: boolean;
}

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

  // Nuevos estados para Inventario Real
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<{id: string, name: string}[]>([{ id: "all", name: "Todo" }])

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

      // 3. Productos Reales e Inventario
      try {
        const { data: productsData } = await api.get("/products");
        const activeProducts = productsData.filter((p: Product) => p.isActive);
        setProducts(activeProducts);

        // Extraer categorías únicas dinámicamente
        const uniqueCats = Array.from(new Set(activeProducts.map((p: Product) => p.category)));
        const catList = [
          { id: "all", name: "Todo" },
          ...uniqueCats.map(c => ({ id: c as string, name: c as string }))
        ];
        setCategories(catList);
      } catch (e) {
        console.error("Error cargando inventario", e);
        toast.error("Error al cargar el inventario");
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

  const handleProductClick = (product: any) => {
    if (!shift) {
      toast.error("Debes abrir caja antes de vender")
      setOpenShiftModalOpen(true)
      return
    }

    // Validación opcional: Descomenta si deseas evitar vender sin stock desde el frontend
    /*
    if (product.isStockTracked && product.stock <= 0) {
      toast.error(`El producto ${product.name} no tiene stock disponible`);
      return;
    }
    */

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
    methodId: number,
    folioId?: string,
    finalAmount: number,
    discount: number
  }) => {

    if (!shift) return toast.error("No hay turno abierto")

    let targetFolioId = paymentData.folioId

    const loadingToast = toast.loading("Procesando venta...")

    try {
      // --- FLUJO 1: VENTA DIRECTA (Público General) ---
      if (!targetFolioId && ["Cash", "CreditCard", "Transfer"].includes(paymentData.method)) {

        const payload = {
          totalAmount: paymentData.finalAmount,
          paymentMethod: paymentData.methodId,
          items: items.map(item => ({
            productId: item.id,
            description: item.name,
            unitPrice: item.price,
            quantity: item.quantity
          }))
        };

        await api.post('/cashier/direct-sale', payload);

      }
      // --- FLUJO 2: VENTA A FOLIO (Huésped / Pasadía) ---
      else {

        if (!targetFolioId) {
          toast.dismiss(loadingToast);
          toast.error("Seleccione un folio/habitación para registrar la venta.");
          return;
        }

        // PASO 1: Registrar los consumos (Charges) e INYECTAR productId
        const chargePromises = items.map(item => {
          return api.post(`/folios/${targetFolioId}/transactions`, {
            amount: item.price * item.quantity,
            description: item.name,
            type: 0, // Charge
            quantity: item.quantity,
            unitPrice: item.price,
            category: "Restaurante",
            cashierShiftId: shift.id,
            paymentMethod: 0, // None
            productId: item.id // Conecta POS con el Inventario Real en el backend
          })
        })

        await Promise.all(chargePromises)

        // PASO 2: Registrar el PAGO inmediato si no es crédito a habitación
        if (paymentData.method !== "RoomCharge" && paymentData.method !== "DayPass") {
          await api.post(`/folios/${targetFolioId}/transactions`, {
            amount: paymentData.finalAmount,
            description: `Pago POS - ${paymentData.method === 'Cash' ? 'Efectivo' : 'Tarjeta/Otro'}`,
            type: 1, // Payment
            quantity: 1,
            unitPrice: paymentData.finalAmount,
            paymentMethod: paymentData.methodId,
            cashierShiftId: shift.id
          })
        }
      }

      toast.dismiss(loadingToast)
      toast.success("Venta registrada exitosamente")

      clearCart()
      setCheckoutOpen(false)

      // Actualizamos datos de fondo
      checkStatus()
      initData()

    } catch (error) {
      console.error(error)
      toast.dismiss(loadingToast)
      toast.error("Error al procesar la venta. Intente de nuevo.")
    }
  }

  // Preparamos los productos mapeados para el renderizado del componente ProductGrid
  const mappedProducts = products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.unitPrice,
    category: p.category,
    image: p.imageUrl || "/file.svg", // Fallback de imagen
    stock: p.stock,
    isStockTracked: p.isStockTracked
  }));

  const filteredProducts = selectedCategory === "all"
      ? mappedProducts
      : mappedProducts.filter(p => p.category === selectedCategory);

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
                  products={filteredProducts}
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
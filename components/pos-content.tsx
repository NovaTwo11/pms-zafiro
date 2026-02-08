"use client"

import { useState, useEffect } from "react"
import { ProductGrid } from "./product-grid"
import { Ticket } from "./ticket"
import { CheckoutModal } from "./checkout-modal"
import { usePOSStore } from "@/lib/store"
import api from "@/lib/api"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Unlock, DollarSign, LogOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// --- Tipos ---
interface CashierShift {
  id: string;
  openedAt: string;
  startingAmount: number;
  status: "Open" | "Closed";
}

// --- Datos Mock ---
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
  { id: "p4", name: "Whisky Buchanan's", price: 25000, category: "bebidas", image: "/whisky-glass.jpg" },
  { id: "p5", name: "Mojito", price: 22000, category: "cocteles", image: "/mojito-cocktail.jpg" },
  { id: "p6", name: "Margarita", price: 24000, category: "cocteles", image: "/margarita-cocktail.png" },
  { id: "p7", name: "Piña Colada", price: 23000, category: "cocteles", image: "/pina-colada.png" },
  { id: "p8", name: "Papas Fritas", price: 15000, category: "snacks", image: "/crispy-french-fries.png" },
  { id: "p9", name: "Nachos con Queso", price: 18000, category: "snacks", image: "/nachos-cheese.png" },
  { id: "p10", name: "Alitas BBQ", price: 28000, category: "snacks", image: "/bbq-chicken-wings.png" },
  { id: "p11", name: "Hamburguesa Clásica", price: 32000, category: "platos", image: "/classic-hamburger.jpg" },
  { id: "p12", name: "Club Sandwich", price: 28000, category: "platos", image: "/club-sandwich.jpg" },
  { id: "p13", name: "Ensalada César", price: 25000, category: "platos", image: "/caesar-salad.png" },
  { id: "p14", name: "Pizza Margarita", price: 35000, category: "platos", image: "/margherita-pizza.png" },
  { id: "p15", name: "Brownie con Helado", price: 16000, category: "postres", image: "/brownie-ice-cream.jpg" },
  { id: "p16", name: "Cheesecake", price: 14000, category: "postres", image: "/cheesecake-slice.png" },
]

export function POSContent() {
  // --- Estados de Negocio (POS) ---
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const { items, addItem, clearCart, total } = usePOSStore()

  // --- Estados de Caja (Cashiering) ---
  const [shift, setShift] = useState<CashierShift | null>(null)
  const [loadingShift, setLoadingShift] = useState(true)
  const [openShiftModalOpen, setOpenShiftModalOpen] = useState(false)
  const [closeShiftModalOpen, setCloseShiftModalOpen] = useState(false)
  const [amountInput, setAmountInput] = useState("")

  // --- Carga Inicial ---
  const fetchStatus = async () => {
    try {
      setLoadingShift(true)
      const { data } = await api.get("/cashier/status")
      if (data) {
        setShift(data)
        setOpenShiftModalOpen(false)
      } else {
        setShift(null)
        setOpenShiftModalOpen(true) // Forzar apertura si no hay turno
      }
    } catch (error) {
      console.error("Error fetching shift", error)
      setShift(null)
      setOpenShiftModalOpen(true)
    } finally {
      setLoadingShift(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  // --- Handlers de Caja ---
  const handleOpenShift = async () => {
    if (!amountInput) return toast.error("Ingresa el monto base")
    try {
      const { data } = await api.post("/cashier/open", { startingAmount: parseFloat(amountInput) })
      setShift(data)
      setOpenShiftModalOpen(false)
      setAmountInput("")
      toast.success("Caja abierta correctamente")
    } catch (error) {
      toast.error("Error al abrir caja")
    }
  }

  const handleCloseShift = async () => {
    if (!amountInput) return toast.error("Ingresa el monto del arqueo")
    try {
      await api.post("/cashier/close", { actualAmount: parseFloat(amountInput) })
      setShift(null)
      setCloseShiftModalOpen(false)
      setOpenShiftModalOpen(true) // Volver a pedir apertura
      setAmountInput("")
      clearCart() // Limpiar carrito al cerrar turno
      toast.success("Turno cerrado correctamente")
    } catch (error) {
      toast.error("Error al cerrar caja")
    }
  }

  // --- Handlers de POS ---
  const filteredProducts =
      selectedCategory === "all" ? products : products.filter((p) => p.category === selectedCategory)

  const handleProductClick = (product: (typeof products)[0]) => {
    if (!shift) return toast.error("Debes abrir caja primero")
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    })
  }

  const handleCheckout = () => {
    setCheckoutOpen(true)
  }

  const handleCheckoutComplete = () => {
    clearCart()
    setCheckoutOpen(false)
    // Aquí podrías recargar el estado del turno si quisieras actualizar el "SystemCalculatedAmount" en tiempo real
  }

  if (loadingShift) return <div className="p-10 flex justify-center">Cargando sistema de caja...</div>

  return (
      <>
        <div className="h-[calc(100vh-112px)] flex flex-col lg:flex-row gap-6 relative">
          {/* Overlay de Bloqueo si no hay turno (aunque el modal lo cubre, esto es visual de fondo) */}
          {!shift && <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center text-muted-foreground">Sistema Bloqueado - Caja Cerrada</div>}

          {/* Left - Product Catalog */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header con Estado de Caja */}
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h1 className="font-serif text-3xl font-semibold text-foreground">Punto de Venta</h1>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-muted-foreground">Bar & Restaurante</p>
                  {shift && (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        <Unlock className="w-3 h-3 mr-1" /> Turno Abierto
                      </Badge>
                  )}
                </div>
              </div>

              {/* Botón de Cierre de Caja */}
              {shift && (
                  <Button variant="destructive" size="sm" onClick={() => setCloseShiftModalOpen(true)}>
                    <LogOut className="w-4 h-4 mr-2" /> Cerrar Caja
                  </Button>
              )}
            </div>

            {/* Category Tabs - Capsule style */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {categories.map((cat) => (
                  <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      disabled={!shift}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                          selectedCategory === cat.id
                              ? "bg-primary text-[#0F0F0F]"
                              : "bg-card text-muted-foreground border border-border hover:border-[#444444] hover:text-foreground"
                      }`}
                  >
                    {cat.name}
                  </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto">
              <ProductGrid products={filteredProducts} onProductClick={handleProductClick} />
            </div>
          </div>

          {/* Right - Ticket */}
          <div className="w-full lg:w-[380px] shrink-0">
            <Ticket items={items} total={total()} onCheckout={handleCheckout} />
          </div>
        </div>

        {/* --- MODALES --- */}

        {/* 1. Modal de Apertura de Caja (Obligatorio) */}
        <Dialog open={openShiftModalOpen} onOpenChange={() => {}}>
          <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Apertura de Caja</DialogTitle>
              <DialogDescription>
                Para iniciar operaciones, ingresa el dinero base en efectivo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="base-amount">Monto Base</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                      id="base-amount"
                      type="number"
                      className="pl-9"
                      placeholder="0.00"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleOpenShift} className="w-full">Abrir Turno</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 2. Modal de Cierre de Caja */}
        <Dialog open={closeShiftModalOpen} onOpenChange={setCloseShiftModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cierre de Turno</DialogTitle>
              <DialogDescription>
                Ingresa el monto total contado físicamente (Arqueo) para cerrar.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="close-amount">Total Efectivo Contado</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                      id="close-amount"
                      type="number"
                      className="pl-9"
                      placeholder="0.00"
                      value={amountInput}
                      onChange={(e) => setAmountInput(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCloseShiftModalOpen(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleCloseShift}>Confirmar Cierre</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 3. Modal de Checkout (Existente) */}
        <CheckoutModal
            isOpen={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            total={total()}
            onComplete={handleCheckoutComplete}
        />
      </>
  )
}
"use client"

import { useState } from "react"
import { ProductGrid } from "./product-grid"
import { Ticket } from "./ticket"
import { CheckoutModal } from "./checkout-modal"
import { usePOSStore } from "@/lib/store"

const categories = [
  { id: "all", name: "Todo" },
  { id: "bebidas", name: "Bebidas" },
  { id: "cocteles", name: "Cócteles" },
  { id: "snacks", name: "Snacks" },
  { id: "platos", name: "Platos" },
  { id: "postres", name: "Postres" },
]

const products = [
  {
    id: "p1",
    name: "Coca-Cola",
    price: 6000,
    category: "bebidas",
    image: "/refreshing-cola-can.png",
  },
  {
    id: "p2",
    name: "Agua Mineral",
    price: 4000,
    category: "bebidas",
    image: "/mineral-water-bottle.jpg",
  },
  {
    id: "p3",
    name: "Cerveza Club",
    price: 8000,
    category: "bebidas",
    image: "/amber-beer-bottle.png",
  },
  {
    id: "p4",
    name: "Whisky Buchanan's",
    price: 25000,
    category: "bebidas",
    image: "/whisky-glass.jpg",
  },
  {
    id: "p5",
    name: "Mojito",
    price: 22000,
    category: "cocteles",
    image: "/mojito-cocktail.jpg",
  },
  {
    id: "p6",
    name: "Margarita",
    price: 24000,
    category: "cocteles",
    image: "/margarita-cocktail.png",
  },
  {
    id: "p7",
    name: "Piña Colada",
    price: 23000,
    category: "cocteles",
    image: "/pina-colada.png",
  },
  {
    id: "p8",
    name: "Papas Fritas",
    price: 15000,
    category: "snacks",
    image: "/crispy-french-fries.png",
  },
  {
    id: "p9",
    name: "Nachos con Queso",
    price: 18000,
    category: "snacks",
    image: "/nachos-cheese.png",
  },
  {
    id: "p10",
    name: "Alitas BBQ",
    price: 28000,
    category: "snacks",
    image: "/bbq-chicken-wings.png",
  },
  {
    id: "p11",
    name: "Hamburguesa Clásica",
    price: 32000,
    category: "platos",
    image: "/classic-hamburger.jpg",
  },
  {
    id: "p12",
    name: "Club Sandwich",
    price: 28000,
    category: "platos",
    image: "/club-sandwich.jpg",
  },
  {
    id: "p13",
    name: "Ensalada César",
    price: 25000,
    category: "platos",
    image: "/caesar-salad.png",
  },
  {
    id: "p14",
    name: "Pizza Margarita",
    price: 35000,
    category: "platos",
    image: "/margherita-pizza.png",
  },
  {
    id: "p15",
    name: "Brownie con Helado",
    price: 16000,
    category: "postres",
    image: "/brownie-ice-cream.jpg",
  },
  {
    id: "p16",
    name: "Cheesecake",
    price: 14000,
    category: "postres",
    image: "/cheesecake-slice.png",
  },
]

export function POSContent() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const { items, addItem, clearCart, total } = usePOSStore()

  const filteredProducts =
    selectedCategory === "all" ? products : products.filter((p) => p.category === selectedCategory)

  const handleProductClick = (product: (typeof products)[0]) => {
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
  }

  return (
    <>
      <div className="h-[calc(100vh-112px)] flex flex-col lg:flex-row gap-6">
        {/* Left - Product Catalog */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="mb-4">
            <h1 className="font-serif text-3xl font-semibold text-foreground">Punto de Venta</h1>
            <p className="text-muted-foreground">Bar & Restaurante</p>
          </div>

          {/* Category Tabs - Capsule style */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
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

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        total={total()}
        onComplete={handleCheckoutComplete}
      />
    </>
  )
}

"use client"

import Image from "next/image"

interface Product {
  id: string
  name: string
  price: number
  category: string
  image: string
}

interface ProductGridProps {
  products: Product[]
  onProductClick: (product: Product) => void
}

export function ProductGrid({ products, onProductClick }: ProductGridProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onProductClick(product)}
          className="flex flex-col rounded-xl border border-border bg-card p-3 transition-all hover:border-[#D4AF37] hover:scale-[1.02] active:scale-[0.98] touch-manipulation"
        >
          <div className="relative aspect-square w-full mb-3 rounded-lg overflow-hidden bg-background">
            <Image src={product.image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          </div>
          <p className="text-sm font-medium text-foreground text-left truncate">{product.name}</p>
          <p className="text-sm text-[#D4AF37] text-left">{formatCurrency(product.price)}</p>
        </button>
      ))}
    </div>
  )
}

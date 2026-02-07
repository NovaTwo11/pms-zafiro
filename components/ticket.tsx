"use client"

import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePOSStore } from "@/lib/store"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
}

interface TicketProps {
  items: CartItem[]
  total: number
  onCheckout: () => void
}

export function Ticket({ items, total, onCheckout }: TicketProps) {
  const { updateQuantity, removeItem, clearCart } = usePOSStore()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="h-full flex flex-col rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-[#D4AF37]" />
          <h3 className="font-serif text-lg font-semibold text-foreground">Ticket</h3>
          {itemCount > 0 && (
            <span className="h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-xs font-semibold text-[#0F0F0F] flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            className="h-8 text-[#CF6679] hover:text-[#CF6679] hover:bg-[#CF6679]/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <ShoppingCart className="h-12 w-12 text-[#333333] mb-3" />
            <p className="text-muted-foreground">Carrito vacío</p>
            <p className="text-xs text-[#666666] mt-1">Toca un producto para agregarlo</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} c/u</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="h-8 w-8 rounded-lg bg-accent text-foreground flex items-center justify-center hover:bg-[#333333] transition-colors touch-manipulation"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium text-foreground">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="h-8 w-8 rounded-lg bg-accent text-foreground flex items-center justify-center hover:bg-[#333333] transition-colors touch-manipulation"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-sm font-semibold text-[#D4AF37] w-20 text-right">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer / Checkout */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex items-center justify-between mb-4">
          <span className="text-muted-foreground">Total</span>
          <span className="text-2xl font-bold text-foreground">{formatCurrency(total)}</span>
        </div>
        <Button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full h-14 text-lg font-semibold bg-primary text-[#0F0F0F] hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          COBRAR
        </Button>
      </div>
    </div>
  )
}

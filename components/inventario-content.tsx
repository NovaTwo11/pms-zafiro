"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  AlertTriangle,
  Package,
  TrendingDown,
  Eye,
  Trash2,
  ImageIcon,
  Pencil,
  Save,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

// Sample inventory data
const inventoryItems = [
  {
    id: "i1",
    name: "Coca-Cola 350ml",
    category: "Bebidas",
    stock: 48,
    minStock: 24,
    unit: "unidades",
    price: 6000,
    cost: 3500,
    image: "/refreshing-cola-can.png",
  },
  {
    id: "i2",
    name: "Agua Mineral 600ml",
    category: "Bebidas",
    stock: 72,
    minStock: 36,
    unit: "unidades",
    price: 4000,
    cost: 1800,
    image: "/reusable-water-bottle.png",
  },
  {
    id: "i3",
    name: "Cerveza Club Colombia",
    category: "Bebidas",
    stock: 36,
    minStock: 24,
    unit: "unidades",
    price: 8000,
    cost: 4500,
    image: "/amber-beer-bottle.png",
  },
  {
    id: "i4",
    name: "Whisky Buchanan's 12",
    category: "Licores",
    stock: 5,
    minStock: 3,
    unit: "botellas",
    price: 180000,
    cost: 120000,
    image: "/whisky-bottle.png",
  },
  {
    id: "i5",
    name: "Ron Medellín 8 Años",
    category: "Licores",
    stock: 2,
    minStock: 3,
    unit: "botellas",
    price: 85000,
    cost: 55000,
    image: "/aged-rum-bottle.png",
  },
  {
    id: "i6",
    name: "Papas Margarita",
    category: "Snacks",
    stock: 15,
    minStock: 20,
    unit: "paquetes",
    price: 4500,
    cost: 2800,
    image: "/potato-chips-bag.png",
  },
  {
    id: "i7",
    name: "Maní Salado",
    category: "Snacks",
    stock: 8,
    minStock: 15,
    unit: "paquetes",
    price: 3000,
    cost: 1500,
    image: "/peanuts-bag.jpg",
  },
  {
    id: "i8",
    name: "Hamburguesa (Kit)",
    category: "Cocina",
    stock: 25,
    minStock: 10,
    unit: "kits",
    price: 12000,
    cost: 6500,
    image: "/burger-kit.jpg",
  },
  {
    id: "i9",
    name: "Pan Hamburguesa",
    category: "Cocina",
    stock: 30,
    minStock: 15,
    unit: "unidades",
    price: 2500,
    cost: 1200,
    image: "/hamburger-buns.jpg",
  },
  {
    id: "i10",
    name: "Toallas de Baño",
    category: "Amenities",
    stock: 50,
    minStock: 30,
    unit: "unidades",
    price: 35000,
    cost: 18000,
    image: "/fluffy-bath-towels.png",
  },
  {
    id: "i11",
    name: "Jabón Líquido",
    category: "Amenities",
    stock: 12,
    minStock: 20,
    unit: "galones",
    price: 28000,
    cost: 15000,
    image: "/liquid-soap.jpg",
  },
  {
    id: "i12",
    name: "Shampoo Individual",
    category: "Amenities",
    stock: 85,
    minStock: 50,
    unit: "unidades",
    price: 3500,
    cost: 1800,
    image: "/shampoo-bottle.png",
  },
]

const categories = ["Bebidas", "Licores", "Snacks", "Cocina", "Amenities"]

export function InventarioContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [deductInventory, setDeductInventory] = useState(true)

  // State logic separated for View and Edit
  const [selectedProduct, setSelectedProduct] = useState<(typeof inventoryItems)[0] | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Create Product State
  const [newProductModal, setNewProductModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Form State (Reused for Create and Edit)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    stock: 0,
    minStock: 0,
    unit: "unidades",
    price: 0,
    cost: 0,
    image: "",
  })

  const filteredItems = inventoryItems.filter(
      (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const lowStockItems = inventoryItems.filter((item) => item.stock <= item.minStock)
  const totalValue = inventoryItems.reduce((sum, item) => sum + item.stock * item.price, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // --- Handlers ---

  const handleViewProduct = (product: (typeof inventoryItems)[0]) => {
    setSelectedProduct(product)
    setViewModalOpen(true)
  }

  const handleEditProduct = (product: (typeof inventoryItems)[0]) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      category: product.category,
      stock: product.stock,
      minStock: product.minStock,
      unit: product.unit,
      price: product.price,
      cost: product.cost,
      image: product.image || "",
    })
    setEditModalOpen(true)
  }

  const handleDeleteProduct = (productId: string) => {
    console.log("Deleting product:", productId)
    setDeleteConfirm(null)
    setEditModalOpen(false) // Close edit modal if open
    setViewModalOpen(false) // Close view modal if open
  }

  const handleCreateProduct = () => {
    console.log("Creating product:", formData)
    setNewProductModal(false)
    resetForm()
  }

  const handleUpdateProduct = () => {
    console.log("Updating product:", selectedProduct?.id, formData)
    setEditModalOpen(false)
    // Here you would update the state/backend
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      stock: 0,
      minStock: 0,
      unit: "unidades",
      price: 0,
      cost: 0,
      image: "",
    })
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-[#E5E5E5]">Inventario</h1>
            <p className="text-[#A3A3A3]">Control de stock y productos</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A3A3A3]" />
              <Input
                  placeholder="Buscar producto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[240px] pl-9 bg-[#1A1A1A] border-[#333333] text-[#E5E5E5] placeholder:text-[#666666] focus:border-[#D4AF37] transition-all duration-300"
              />
            </div>
            <Button
                onClick={() => {
                  resetForm()
                  setNewProductModal(true)
                }}
                className="bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90 transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>

        {/* Kill Switch & Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Kill Switch Card */}
          <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-5 sm:col-span-2 lg:col-span-1 transition-all duration-300 hover:border-[#444444]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#E5E5E5]">Descontar Inventario</p>
                <p className="text-xs text-[#A3A3A3] mt-1">
                  {deductInventory ? "Las ventas descuentan stock" : "Ventas sin control de stock"}
                </p>
              </div>
              <Switch
                  checked={deductInventory}
                  onCheckedChange={setDeductInventory}
                  className="data-[state=checked]:bg-[#D4AF37]"
              />
            </div>
            {!deductInventory && (
                <div className="mt-3 p-2 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/30">
                  <p className="text-xs text-[#F59E0B]">Modo sin restricciones activo</p>
                </div>
            )}
          </div>

          {/* Stats */}
          <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-5 transition-all duration-300 hover:border-[#444444]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-[#3B82F6]" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#E5E5E5]">{inventoryItems.length}</p>
                <p className="text-xs text-[#A3A3A3]">Productos</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-5 transition-all duration-300 hover:border-[#444444]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#F59E0B]">{lowStockItems.length}</p>
                <p className="text-xs text-[#A3A3A3]">Stock Bajo</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] p-5 transition-all duration-300 hover:border-[#444444]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#059669]/10 flex items-center justify-center">
                <span className="text-[#059669] font-bold">$</span>
              </div>
              <div>
                <p className="text-lg font-semibold text-[#E5E5E5]">{formatCurrency(totalValue)}</p>
                <p className="text-xs text-[#A3A3A3]">Valor Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="rounded-lg border border-[#333333] bg-[#1A1A1A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
              <tr className="border-b border-[#333333] bg-[#0F0F0F]">
                <th className="px-4 py-3 text-left text-xs font-medium text-[#A3A3A3] uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#A3A3A3] uppercase tracking-wider">
                  Categoría
                </th>
                {/* Conditional Styling Headers */}
                <th className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-[#A3A3A3] uppercase tracking-wider transition-opacity duration-300",
                    !deductInventory && "opacity-40"
                )}>
                  Stock
                </th>
                <th className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-[#A3A3A3] uppercase tracking-wider transition-opacity duration-300",
                    !deductInventory && "opacity-40"
                )}>
                  Mínimo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#A3A3A3] uppercase tracking-wider">
                  Precio Unit.
                </th>
                <th className={cn(
                    "px-4 py-3 text-left text-xs font-medium text-[#A3A3A3] uppercase tracking-wider transition-opacity duration-300",
                    !deductInventory && "opacity-40"
                )}>
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#A3A3A3] uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
              </thead>
              <tbody>
              {filteredItems.map((item) => {
                const isLowStock = item.stock <= item.minStock
                return (
                    <tr
                        key={item.id}
                        className={cn(
                            "border-b border-[#333333] last:border-0 transition-all duration-300",
                            isLowStock && deductInventory ? "bg-[#F59E0B]/5" : "hover:bg-[#252525]",
                        )}
                    >
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-[#E5E5E5]">{item.name}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-[#A3A3A3]">{item.category}</span>
                      </td>

                      {/* Locked Column: Stock */}
                      <td className={cn(
                          "px-4 py-4 transition-all duration-300",
                          !deductInventory && "opacity-40 grayscale select-none"
                      )}>
                      <span className={cn("text-sm font-medium", isLowStock ? "text-[#F59E0B]" : "text-[#E5E5E5]")}>
                        {item.stock} {item.unit}
                      </span>
                      </td>

                      {/* Locked Column: Min Stock */}
                      <td className={cn(
                          "px-4 py-4 transition-all duration-300",
                          !deductInventory && "opacity-40 grayscale select-none"
                      )}>
                      <span className="text-sm text-[#A3A3A3]">
                        {item.minStock} {item.unit}
                      </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-sm text-[#E5E5E5]">{formatCurrency(item.price)}</span>
                      </td>

                      {/* Locked Column: State */}
                      <td className={cn(
                          "px-4 py-4 transition-all duration-300",
                          !deductInventory && "opacity-40 grayscale select-none"
                      )}>
                        {isLowStock ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#F59E0B]/10 text-[#F59E0B]">
                          <AlertTriangle className="h-3 w-3" />
                          Bajo
                        </span>
                        ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#059669]/10 text-[#059669]">
                          OK
                        </span>
                        )}
                      </td>

                      {/* Split Actions: View and Edit */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewProduct(item)}
                              className="h-8 w-8 text-[#A3A3A3] hover:text-[#E5E5E5] hover:bg-[#333333]"
                              title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditProduct(item)}
                              className="h-8 w-8 text-[#D4AF37] hover:text-[#E5E5E5] hover:bg-[#D4AF37]/20"
                              title="Gestionar producto"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                )
              })}
              </tbody>
            </table>
          </div>

          {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#A3A3A3]">No se encontraron productos</p>
              </div>
          )}
        </div>

        {/* VIEW ONLY Modal */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="sm:max-w-[400px] bg-[#1A1A1A] border-[#333333]">
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-heading)] text-xl text-[#E5E5E5]">
                Detalle del Producto
              </DialogTitle>
            </DialogHeader>

            {selectedProduct && (
                <div className="space-y-6 pt-4">
                  <div className="aspect-square w-40 mx-auto rounded-lg bg-[#0F0F0F] border border-[#333333] overflow-hidden flex items-center justify-center">
                    {selectedProduct.image ? (
                        <img
                            src={selectedProduct.image || "/placeholder.svg"}
                            alt={selectedProduct.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <ImageIcon className="h-14 w-14 text-[#333333]" />
                    )}
                  </div>

                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-[#E5E5E5]">{selectedProduct.name}</h3>
                    <p className="text-sm text-[#A3A3A3]">{selectedProduct.category}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-[#0F0F0F] border border-[#333333]">
                      <p className="text-xs text-[#A3A3A3]">Stock</p>
                      <p className="text-lg font-semibold text-[#E5E5E5]">{selectedProduct.stock} {selectedProduct.unit}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#0F0F0F] border border-[#333333]">
                      <p className="text-xs text-[#A3A3A3]">Precio</p>
                      <p className="text-lg font-semibold text-[#D4AF37]">{formatCurrency(selectedProduct.price)}</p>
                    </div>
                  </div>

                  <Button
                      variant="outline"
                      onClick={() => setViewModalOpen(false)}
                      className="w-full border-[#333333] text-[#E5E5E5] hover:bg-[#252525] bg-transparent"
                  >
                    Cerrar
                  </Button>
                </div>
            )}
          </DialogContent>
        </Dialog>

        {/* EDIT / MANAGE Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-[600px] bg-[#1A1A1A] border-[#333333] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-heading)] text-xl text-[#E5E5E5]">
                Gestionar Producto
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Image Upload Simulation */}
              <div className="flex flex-col items-center justify-center gap-4 py-4 border-b border-[#333333]">
                <div className="relative h-32 w-32 rounded-lg bg-[#0F0F0F] border border-[#333333] overflow-hidden group">
                  {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-10 w-10 text-[#333333]" />
                      </div>
                  )}
                  {/* Overlay for edit */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Pencil className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="w-full">
                  <Label className="text-[#A3A3A3] text-xs mb-2 block text-center">URL de Imagen (Simulado)</Label>
                  <Input
                      value={formData.image}
                      onChange={(e) => setFormData({...formData, image: e.target.value})}
                      placeholder="/path/to/image.png"
                      className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] text-xs h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-[#A3A3A3]">Nombre del Producto</Label>
                  <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Categoría</Label>
                  <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#333333]">
                      {categories.map((c) => (
                          <SelectItem key={c} value={c} className="text-[#E5E5E5] focus:bg-[#252525]">
                            {c}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Unidad</Label>
                  <Select
                      value={formData.unit}
                      onValueChange={(v) => setFormData({ ...formData, unit: v })}
                  >
                    <SelectTrigger className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#333333]">
                      <SelectItem value="unidades" className="text-[#E5E5E5] focus:bg-[#252525]">Unidades</SelectItem>
                      <SelectItem value="botellas" className="text-[#E5E5E5] focus:bg-[#252525]">Botellas</SelectItem>
                      <SelectItem value="paquetes" className="text-[#E5E5E5] focus:bg-[#252525]">Paquetes</SelectItem>
                      <SelectItem value="galones" className="text-[#E5E5E5] focus:bg-[#252525]">Galones</SelectItem>
                      <SelectItem value="kits" className="text-[#E5E5E5] focus:bg-[#252525]">Kits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Stock Actual</Label>
                  <Input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Stock Mínimo</Label>
                  <Input
                      type="number"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                      className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Costo Compra</Label>
                  <Input
                      type="number"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                      className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Precio Venta</Label>
                  <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] border-l-4 border-l-[#D4AF37]"
                  />
                </div>
              </div>

              <DialogFooter className="flex gap-2 sm:justify-between pt-4 mt-4 border-t border-[#333333]">
                <Button
                    variant="ghost"
                    onClick={() => selectedProduct && setDeleteConfirm(selectedProduct.id)}
                    className="text-[#CF6679] hover:bg-[#CF6679]/10 hover:text-[#CF6679]"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
                <div className="flex gap-2">
                  <Button
                      variant="outline"
                      onClick={() => setEditModalOpen(false)}
                      className="border-[#333333] text-[#E5E5E5] hover:bg-[#252525] bg-transparent"
                  >
                    Cancelar
                  </Button>
                  <Button
                      onClick={handleUpdateProduct}
                      className="bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </div>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Product Modal - Same fields as Edit but blank */}
        <Dialog open={newProductModal} onOpenChange={setNewProductModal}>
          <DialogContent className="sm:max-w-[500px] bg-[#1A1A1A] border-[#333333]">
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-heading)] text-xl text-[#E5E5E5]">
                Nuevo Producto
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {/* Reusing structure for consistency */}
              <div className="space-y-2">
                <Label className="text-[#A3A3A3]">Nombre del Producto *</Label>
                <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5] focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Categoría *</Label>
                  <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#333333]">
                      {categories.map((c) => (
                          <SelectItem key={c} value={c} className="text-[#E5E5E5] focus:bg-[#252525]">
                            {c}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Unidad</Label>
                  <Select
                      value={formData.unit}
                      onValueChange={(v) => setFormData({ ...formData, unit: v })}
                  >
                    <SelectTrigger className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1A] border-[#333333]">
                      <SelectItem value="unidades" className="text-[#E5E5E5] focus:bg-[#252525]">Unidades</SelectItem>
                      <SelectItem value="botellas" className="text-[#E5E5E5] focus:bg-[#252525]">Botellas</SelectItem>
                      <SelectItem value="paquetes" className="text-[#E5E5E5] focus:bg-[#252525]">Paquetes</SelectItem>
                      <SelectItem value="galones" className="text-[#E5E5E5] focus:bg-[#252525]">Galones</SelectItem>
                      <SelectItem value="kits" className="text-[#E5E5E5] focus:bg-[#252525]">Kits</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Stock Inicial</Label>
                  <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })} className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Stock Mínimo</Label>
                  <Input type="number" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })} className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Costo</Label>
                  <Input type="number" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })} className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#A3A3A3]">Precio Venta</Label>
                  <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className="bg-[#0F0F0F] border-[#333333] text-[#E5E5E5]" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setNewProductModal(false)} className="flex-1 border-[#333333] text-[#E5E5E5] hover:bg-[#252525] bg-transparent">Cancelar</Button>
                <Button onClick={handleCreateProduct} disabled={!formData.name || !formData.category} className="flex-1 bg-[#D4AF37] text-[#0F0F0F] hover:bg-[#D4AF37]/90">Crear Producto</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent className="bg-[#1A1A1A] border-[#333333]">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-[#E5E5E5]">¿Eliminar producto?</AlertDialogTitle>
              <AlertDialogDescription className="text-[#A3A3A3]">
                Esta acción no se puede deshacer. El producto será eliminado permanentemente del inventario.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-[#333333] text-[#E5E5E5] hover:bg-[#252525] bg-transparent">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                  onClick={() => deleteConfirm && handleDeleteProduct(deleteConfirm)}
                  className="bg-[#CF6679] text-white hover:bg-[#CF6679]/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  )
}
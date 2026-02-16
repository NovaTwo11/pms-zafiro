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
  Image as ImageIcon,
  Link as LinkIcon,
  Pencil,
  Save,
  Loader2
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
import { productsApi } from "@/lib/api"
import { toast } from "sonner"

// INTERFAZ EXTENDIDA PARA EL FRONTEND
interface InventoryItem {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  stock: number;
  category: string;
  isActive: boolean;
  isStockTracked: boolean; // Control individual de inventario físico
  createdAt?: string;
  imageUrl?: string;
  minStock?: number;
  unit?: string;
  cost?: number;
}

const categories = ["Bebidas", "Licores", "Cócteles", "Mecato", "Refrescantes", "Cervezas", "Aseo Personal", "Cocina", "Servicios", "Otros"]

export function InventarioContent() {
  const [products, setProducts] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Estados de modales
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null)
  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [newProductModal, setNewProductModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)

  // Formulario (Maneja datos temporales antes de enviar)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    stock: 0,
    minStock: 5,
    unit: "unidades",
    unitPrice: 0,
    cost: 0,
    imageUrl: "",
    isStockTracked: true, // Por defecto se asume que es físico
  })

  // --- Cargar datos ---
  const fetchProducts = async () => {
    setLoading(true)
    try {
      const data = await productsApi.getAll()

      const mappedData: InventoryItem[] = data.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description || "",
        unitPrice: p.unitPrice,
        stock: p.stock,
        category: p.category,
        isActive: p.isActive,
        createdAt: p.createdAt,
        imageUrl: p.imageUrl || "",
        isStockTracked: p.isStockTracked ?? true, // Mapeo de la variable
        minStock: 5,
        unit: "unidades",
        cost: 0
      }))

      setProducts(mappedData)
    } catch (error) {
      console.error("Error cargando productos:", error)
      toast.error("Error al conectar con el servidor")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // --- Lógica de UI ---

  const filteredItems = products.filter(
      (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Cálculos condicionados al tipo de producto (solo cuentan los físicos)
  const lowStockItems = products.filter((item) => item.isStockTracked && item.stock <= (item.minStock || 0))
  const totalValue = products.reduce((sum, item) => item.isStockTracked ? sum + (item.stock * item.unitPrice) : sum, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // --- Handlers ---

  const handleViewProduct = (product: InventoryItem) => {
    setSelectedProduct(product)
    setViewModalOpen(true)
  }

  const handleEditProduct = (product: InventoryItem) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      description: product.description || "",
      category: product.category,
      stock: product.stock,
      minStock: product.minStock || 5,
      unit: product.unit || "unidades",
      unitPrice: product.unitPrice,
      cost: product.cost || 0,
      imageUrl: product.imageUrl || "",
      isStockTracked: product.isStockTracked ?? true,
    })
    setEditModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      stock: 0,
      minStock: 5,
      unit: "unidades",
      unitPrice: 0,
      cost: 0,
      imageUrl: "",
      isStockTracked: true,
    })
  }

  // --- CRUD Actions ---

  const handleDeleteProduct = async (productId: string) => {
    try {
      await productsApi.delete(productId)
      toast.success("Producto eliminado correctamente")
      fetchProducts()
    } catch (error) {
      toast.error("No se pudo eliminar el producto")
    } finally {
      setDeleteConfirm(null)
      setEditModalOpen(false)
      setViewModalOpen(false)
    }
  }

  const handleCreateProduct = async () => {
    if (!formData.name || !formData.category) return
    setIsSubmitting(true)

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        unitPrice: formData.unitPrice,
        stock: formData.stock,
        category: formData.category,
        imageUrl: formData.imageUrl,
        isStockTracked: formData.isStockTracked
      }

      await productsApi.create(payload)
      toast.success("Producto creado exitosamente")
      setNewProductModal(false)
      resetForm()
      fetchProducts()
    } catch (error) {
      console.error(error)
      toast.error("Error al crear el producto")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return
    setIsSubmitting(true)

    try {
      const payload = {
        id: selectedProduct.id,
        name: formData.name,
        description: formData.description,
        unitPrice: formData.unitPrice,
        stock: formData.stock,
        category: formData.category,
        isActive: selectedProduct.isActive,
        imageUrl: formData.imageUrl,
        isStockTracked: formData.isStockTracked
      }

      await productsApi.update(selectedProduct.id, payload)
      toast.success("Producto actualizado")
      setEditModalOpen(false)
      fetchProducts()
    } catch (error) {
      toast.error("Error al actualizar")
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- JSX de Campos de Imagen (Reutilizable) ---
  const renderImageFields = () => (
      <div className="col-span-2 flex flex-col gap-4 border-b border-border pb-4 mb-4">
        <div className="flex justify-center">
          <div className="relative h-32 w-32 rounded-lg bg-muted border border-border overflow-hidden flex items-center justify-center group">
            {formData.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={formData.imageUrl}
                    alt="Vista previa"
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/400?text=Error+URL";
                    }}
                />
            ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-8 w-8 opacity-50" />
                  <span className="text-[10px]">Sin Imagen</span>
                </div>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground flex items-center gap-2">
            URL de la Imagen <span className="text-xs text-muted-foreground/60">(Opcional)</span>
          </Label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://ejemplo.com/foto.jpg"
                className="pl-9 bg-background border-border text-foreground text-sm"
            />
          </div>
        </div>
      </div>
  )

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-heading)] text-3xl font-semibold text-foreground">Inventario</h1>
            <p className="text-muted-foreground">Control de stock y productos</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                  placeholder="Buscar producto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[240px] pl-9 bg-card border-border text-foreground placeholder:text-[#666666] focus:border-[#D4AF37] transition-all duration-300"
              />
            </div>
            <Button
                onClick={() => {
                  resetForm()
                  setNewProductModal(true)
                }}
                className="bg-primary text-[#0F0F0F] hover:bg-primary/90 transition-all duration-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Producto
            </Button>
          </div>
        </div>

        {/* Stats Section (Actualizado para excluir el switch global) */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-5 transition-all duration-300 hover:border-[#444444]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#3B82F6]/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-[#3B82F6]" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {loading ? "..." : products.length}
                </p>
                <p className="text-xs text-muted-foreground">Catálogo de Ítems</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 transition-all duration-300 hover:border-[#444444]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-[#F59E0B]" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#F59E0B]">
                  {loading ? "..." : lowStockItems.length}
                </p>
                <p className="text-xs text-muted-foreground">Físicos con Stock Bajo</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 transition-all duration-300 hover:border-[#444444]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#059669]/10 flex items-center justify-center">
                <span className="text-[#059669] font-bold">$</span>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {loading ? "..." : formatCurrency(totalValue)}
                </p>
                <p className="text-xs text-muted-foreground">Valor Estimado en Bodega</p>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
              <tr className="border-b border-border bg-background">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Precio Unit.
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
              </thead>
              <tbody>
              {loading ? (
                  <tr>
                    <td colSpan={6} className="h-32 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p>Cargando inventario...</p>
                      </div>
                    </td>
                  </tr>
              ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="h-32 text-center text-muted-foreground">
                      No se encontraron productos.
                    </td>
                  </tr>
              ) : (
                  filteredItems.map((item) => {
                    const isLowStock = item.isStockTracked && item.stock <= (item.minStock || 0)
                    return (
                        <tr
                            key={item.id}
                            className="border-b border-border hover:bg-accent transition-all duration-300"
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-md bg-muted border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                                {item.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                ) : (
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{item.name}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm text-muted-foreground">{item.category}</span>
                          </td>

                          {/* Columna Dinámica de Stock */}
                          <td className="px-4 py-4">
                            {item.isStockTracked ? (
                                <span className={cn("text-sm font-medium", isLowStock ? "text-[#F59E0B]" : "text-foreground")}>
                                  {item.stock} {item.unit}
                                </span>
                            ) : (
                                <span className="text-sm font-medium text-muted-foreground/60 italic">Ilimitado (Servicio)</span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <span className="text-sm text-foreground">{formatCurrency(item.unitPrice)}</span>
                          </td>

                          {/* Columna Dinámica de Estado */}
                          <td className="px-4 py-4">
                            {!item.isStockTracked ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">Servicio</span>
                            ) : isLowStock ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[#F59E0B]/10 text-[#F59E0B]">
                                  <AlertTriangle className="h-3 w-3" /> Bajo
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#059669]/10 text-[#059669]">OK</span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewProduct(item)}
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-[#333333]"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditProduct(item)}
                                  className="h-8 w-8 text-[#D4AF37] hover:text-foreground hover:bg-primary/20"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                    )
                  })
              )}
              </tbody>
            </table>
          </div>
        </div>

        {/* VIEW ONLY Modal */}
        <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
          <DialogContent className="sm:max-w-[400px] bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-heading)] text-xl text-foreground">
                Detalle del Producto
              </DialogTitle>
            </DialogHeader>

            {selectedProduct && (
                <div className="space-y-6 pt-4">
                  <div className="aspect-square w-40 mx-auto rounded-lg bg-background border border-border overflow-hidden flex items-center justify-center">
                    {selectedProduct.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={selectedProduct.imageUrl}
                            alt={selectedProduct.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <ImageIcon className="h-14 w-14 text-[#333333]" />
                    )}
                  </div>

                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-foreground">{selectedProduct.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                    <p className="text-xs text-primary mt-1">{selectedProduct.category}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-background border border-border">
                      <p className="text-xs text-muted-foreground">Stock</p>
                      <p className="text-lg font-semibold text-foreground">
                        {selectedProduct.isStockTracked ? `${selectedProduct.stock} ${selectedProduct.unit}` : 'Ilimitado (Servicio)'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-background border border-border">
                      <p className="text-xs text-muted-foreground">Precio</p>
                      <p className="text-lg font-semibold text-[#D4AF37]">{formatCurrency(selectedProduct.unitPrice)}</p>
                    </div>
                  </div>

                  <Button
                      variant="outline"
                      onClick={() => setViewModalOpen(false)}
                      className="w-full border-border text-foreground hover:bg-accent bg-transparent"
                  >
                    Cerrar
                  </Button>
                </div>
            )}
          </DialogContent>
        </Dialog>

        {/* EDIT / MANAGE Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-[600px] bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-heading)] text-xl text-foreground">
                Editar Producto
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">

                {/* Sección de Imagen */}
                {renderImageFields()}

                {/* SWITCH DE STOCK TRACKING */}
                <div className="col-span-2 flex items-center justify-between p-3 border border-border rounded-lg bg-background">
                  <div>
                    <Label className="text-foreground">Controlar Inventario Físico</Label>
                    <p className="text-xs text-muted-foreground">Desactiva esta opción si es un servicio sin cantidad límite.</p>
                  </div>
                  <Switch
                      checked={formData.isStockTracked}
                      onCheckedChange={(v) => setFormData({ ...formData, isStockTracked: v })}
                      className="data-[state=checked]:bg-primary"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className="text-muted-foreground">Nombre del Producto</Label>
                  <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-background border-border text-foreground focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className="text-muted-foreground">Descripción</Label>
                  <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-background border-border text-foreground"
                      placeholder="Detalles cortos..."
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Categoría</Label>
                  <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {categories.map((c) => (
                          <SelectItem key={c} value={c} className="text-foreground focus:bg-accent">
                            {c}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className={cn("text-muted-foreground", !formData.isStockTracked && "opacity-50")}>
                    Stock Actual
                  </Label>
                  <Input
                      type="number"
                      disabled={!formData.isStockTracked}
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="bg-background border-border text-foreground"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className="text-muted-foreground">Precio Venta</Label>
                  <Input
                      type="number"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                      className="bg-background border-border text-foreground border-l-4 border-l-[#D4AF37]"
                  />
                </div>
              </div>

              <DialogFooter className="flex gap-2 sm:justify-between pt-4 mt-4 border-t border-border">
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
                      className="border-border text-foreground hover:bg-accent bg-transparent"
                  >
                    Cancelar
                  </Button>
                  <Button
                      onClick={handleUpdateProduct}
                      disabled={isSubmitting}
                      className="bg-primary text-[#0F0F0F] hover:bg-primary/90"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4 mr-2" />}
                    Guardar
                  </Button>
                </div>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Product Modal */}
        <Dialog open={newProductModal} onOpenChange={setNewProductModal}>
          <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-heading)] text-xl text-foreground">
                Nuevo Producto
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">

              {/* Sección de Imagen */}
              {renderImageFields()}

              {/* SWITCH DE STOCK TRACKING */}
              <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-background">
                <div>
                  <Label className="text-foreground">Controlar Inventario Físico</Label>
                  <p className="text-xs text-muted-foreground">Desactiva esta opción si es un servicio.</p>
                </div>
                <Switch
                    checked={formData.isStockTracked}
                    onCheckedChange={(v) => setFormData({ ...formData, isStockTracked: v })}
                    className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Nombre del Producto *</Label>
                <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-background border-border text-foreground focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-muted-foreground">Descripción</Label>
                <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-background border-border text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Categoría *</Label>
                  <Select
                      value={formData.category}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                  >
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {categories.map((c) => (
                          <SelectItem key={c} value={c} className="text-foreground focus:bg-accent">
                            {c}
                          </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className={cn("text-muted-foreground", !formData.isStockTracked && "opacity-50")}>
                    Stock Inicial
                  </Label>
                  <Input
                      type="number"
                      disabled={!formData.isStockTracked}
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="bg-background border-border text-foreground"
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label className="text-muted-foreground">Precio Venta ($)</Label>
                  <Input
                      type="number"
                      value={formData.unitPrice}
                      onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) })}
                      className="bg-background border-border text-foreground border-l-4 border-l-[#D4AF37]"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setNewProductModal(false)} className="flex-1 border-border text-foreground hover:bg-accent bg-transparent">Cancelar</Button>
                <Button onClick={handleCreateProduct} disabled={!formData.name || !formData.category || isSubmitting} className="flex-1 bg-primary text-[#0F0F0F] hover:bg-primary/90">
                  {isSubmitting ? "Guardando..." : "Crear Producto"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">¿Eliminar producto?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                El producto se marcará como inactivo en el sistema pero no se perderá el historial de ventas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border text-foreground hover:bg-accent bg-transparent">
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
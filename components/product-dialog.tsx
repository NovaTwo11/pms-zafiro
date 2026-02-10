"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Product, CreateProductDto, UpdateProductDto } from "@/types"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { productsApi } from "@/lib/api"
import { toast } from "sonner" // Usando sonner que vi en tus archivos

// Esquema de validación
const productSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    description: z.string().optional(),
    unitPrice: z.coerce.number().min(0.01, "El precio debe ser mayor a 0"),
    stock: z.coerce.number().min(0, "El stock no puede ser negativo"),
    category: z.string().min(1, "Selecciona una categoría"),
})

interface ProductDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    productToEdit?: Product | null
    onSuccess: () => void
}

export function ProductDialog({
                                  open,
                                  onOpenChange,
                                  productToEdit,
                                  onSuccess,
                              }: ProductDialogProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof productSchema>>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            description: "",
            unitPrice: 0,
            stock: 0,
            category: "",
        },
    })

    // Cargar datos si estamos editando
    useEffect(() => {
        if (productToEdit) {
            form.reset({
                name: productToEdit.name,
                description: productToEdit.description,
                unitPrice: productToEdit.unitPrice,
                stock: productToEdit.stock,
                category: productToEdit.category,
            })
        } else {
            form.reset({
                name: "",
                description: "",
                unitPrice: 0,
                stock: 0,
                category: "",
            })
        }
    }, [productToEdit, form, open])

    async function onSubmit(values: z.infer<typeof productSchema>) {
        setIsLoading(true)
        try {
            if (productToEdit) {
                // Editar
                await productsApi.update(productToEdit.id, {
                    ...values,
                    id: productToEdit.id,
                    isActive: productToEdit.isActive,
                })
                toast.success("Producto actualizado correctamente")
            } else {
                // Crear
                await productsApi.create(values)
                toast.success("Producto creado correctamente")
            }
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            toast.error("Error al guardar el producto")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {productToEdit ? "Editar Producto" : "Nuevo Producto"}
                    </DialogTitle>
                    <DialogDescription>
                        Ingresa los detalles del ítem para el inventario.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Botella de Agua" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoría</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Bebidas">Bebidas</SelectItem>
                                                <SelectItem value="Snacks">Snacks</SelectItem>
                                                <SelectItem value="Amenities">Amenities</SelectItem>
                                                <SelectItem value="Servicios">Servicios</SelectItem>
                                                <SelectItem value="Souvenirs">Souvenirs</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="unitPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio Unitario ($)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="stock"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Stock Inicial</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Detalles adicionales..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Guardando..." : "Guardar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
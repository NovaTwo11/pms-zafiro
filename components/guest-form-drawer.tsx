"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import api from "@/lib/api"
import { GuestFormValues } from "@/types"

// --- SCHEMA DE VALIDACIÓN (Zod) ---
const formSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  tipoDocumento: z.string({ required_error: "Selecciona un tipo de documento" }),
  numeroDocumento: z.string().min(5, "Número de documento inválido"),
  email: z.string().email("Correo electrónico inválido"),
  telefono: z.string().min(7, "Teléfono inválido"),
  nacionalidad: z.string().min(2, "Nacionalidad requerida"),
  fechaNacimiento: z.date().optional(),
  ocupacion: z.string().optional(),
})

interface GuestFormDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onGuestCreated?: () => void // Callback para recargar la tabla al crear
}

export function GuestFormDrawer({ open, onOpenChange, onGuestCreated }: GuestFormDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      tipoDocumento: "CC",
      numeroDocumento: "",
      email: "",
      telefono: "",
      nacionalidad: "Colombiana",
      ocupacion: "",
    },
  })

  // --- ENVIAR AL BACKEND ---
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      // 1. Mapear Formulario (Español) -> Backend DTO (Inglés)
      const payload = {
        firstName: values.nombre,
        lastName: values.apellido,
        documentType: values.tipoDocumento, // "CC", "CE", etc.
        documentNumber: values.numeroDocumento,
        email: values.email,
        phone: values.telefono,
        nationality: values.nacionalidad,
        // Backend espera DateOnly? o string ISO "YYYY-MM-DD"
        birthDate: values.fechaNacimiento
            ? format(values.fechaNacimiento, "yyyy-MM-dd")
            : null
      }

      // 2. Llamada a la API
      await api.post('/guests', payload)

      toast.success("Huésped registrado correctamente")

      // 3. Limpieza y Cierre
      form.reset()
      onOpenChange(false)

      // 4. Avisar al padre para recargar la lista
      if (onGuestCreated) onGuestCreated()

    } catch (error: any) {
      console.error(error)
      const errorMsg = error.response?.data?.title || "Error al guardar el huésped"
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nuevo Huésped</SheetTitle>
            <SheetDescription>
              Crea un perfil completo para el check-in. Los campos obligatorios están marcados.
            </SheetDescription>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">

              {/* GRUPO: IDENTIFICACIÓN */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="nombre"
                    render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre *</FormLabel>
                          <FormControl>
                            <Input placeholder="Juan" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="apellido"
                    render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellido *</FormLabel>
                          <FormControl>
                            <Input placeholder="Pérez" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                    )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="tipoDocumento"
                    render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="CC">Cédula (CC)</SelectItem>
                              <SelectItem value="CE">Extranjería (CE)</SelectItem>
                              <SelectItem value="PA">Pasaporte (PA)</SelectItem>
                              <SelectItem value="TI">T. Identidad (TI)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="numeroDocumento"
                    render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Número Documento *</FormLabel>
                          <FormControl>
                            <Input placeholder="1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                    )}
                />
              </div>

              {/* GRUPO: CONTACTO */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo Electrónico *</FormLabel>
                          <FormControl>
                            <Input placeholder="cliente@email.com" type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="telefono"
                    render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono / WhatsApp *</FormLabel>
                          <FormControl>
                            <Input placeholder="300 123 4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                    )}
                />
              </div>

              {/* GRUPO: DEMOGRÁFICO */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="nacionalidad"
                    render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nacionalidad</FormLabel>
                          <FormControl>
                            <Input placeholder="Colombiana" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="fechaNacimiento"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="mb-2.5">Fecha Nacimiento</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                    )}
                                >
                                  {field.value ? (
                                      format(field.value, "PPP")
                                  ) : (
                                      <span>Seleccionar fecha</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                      date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                    )}
                />
              </div>

              <SheetFooter className="mt-6">
                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Huésped
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
  )
}
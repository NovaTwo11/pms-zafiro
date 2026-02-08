"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import {
    CalendarIcon,
    Loader2,
    Trash2,
    User,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    FileText,
    Briefcase
} from "lucide-react"

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
import { Separator } from "@/components/ui/separator"

// --- SCHEMA ---
const formSchema = z.object({
    nombre: z.string().min(2, "Requerido"),
    apellido: z.string().optional(),
    tipoDocumento: z.string(),
    numeroDocumento: z.string().min(3, "Requerido"),
    email: z.string().email("Inválido").optional().or(z.literal("")),
    telefono: z.string().optional(),
    nacionalidad: z.string().optional(),
    fechaNacimiento: z.date().optional(),
})

// --- TYPES ---
interface GuestData {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    nationality: string
    documentType: string
    documentNumber: string
    dateOfBirth?: Date
}

interface GuestFormDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onGuestSaved?: () => void
    guestToEdit?: GuestData | null
}

export function GuestFormDrawer({
                                    open,
                                    onOpenChange,
                                    onGuestSaved,
                                    guestToEdit
                                }: GuestFormDrawerProps) {
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
        },
    })

    // EFECTO: Rellenar o Limpiar
    useEffect(() => {
        if (open) {
            if (guestToEdit) {
                form.reset({
                    nombre: guestToEdit.firstName,
                    apellido: guestToEdit.lastName,
                    tipoDocumento: guestToEdit.documentType || "CC",
                    numeroDocumento: guestToEdit.documentNumber,
                    email: guestToEdit.email || "",
                    telefono: guestToEdit.phone || "",
                    nacionalidad: guestToEdit.nationality || "Colombiana",
                    fechaNacimiento: guestToEdit.dateOfBirth
                })
            } else {
                form.reset({
                    nombre: "",
                    apellido: "",
                    tipoDocumento: "CC",
                    numeroDocumento: "",
                    email: "",
                    telefono: "",
                    nacionalidad: "Colombiana",
                })
            }
        }
    }, [open, guestToEdit, form])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true)
        try {
            const payload = {
                firstName: values.nombre,
                lastName: values.apellido || "",
                documentType: values.tipoDocumento,
                documentNumber: values.numeroDocumento,
                email: values.email,
                phone: values.telefono,
                nationality: values.nacionalidad,
                birthDate: values.fechaNacimiento
                    ? format(values.fechaNacimiento, "yyyy-MM-dd")
                    : null
            }

            if (guestToEdit) {
                // PUT /guests/{id}
                await api.put(`/guests/${guestToEdit.id}`, payload)
                toast.success("Perfil actualizado correctamente")
            } else {
                // POST /guests
                await api.post('/guests', payload)
                toast.success("Huésped registrado correctamente")
            }

            onOpenChange(false)
            if (onGuestSaved) onGuestSaved()

        } catch (error: any) {
            console.error(error)
            toast.error("Error al guardar los datos")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto bg-background border-l border-border p-0 flex flex-col h-full">

                {/* HEADER CON ESTILO */}
                <SheetHeader className="px-6 py-6 border-b border-border bg-card/50">
                    <SheetTitle className="flex items-center gap-2 text-2xl font-serif text-[#D4AF37]">
                        {guestToEdit ? <User className="h-6 w-6"/> : <User className="h-6 w-6"/>}
                        {guestToEdit ? "Editar Perfil" : "Nuevo Registro"}
                    </SheetTitle>
                    <SheetDescription className="text-muted-foreground">
                        {guestToEdit
                            ? "Actualiza la información legal y de contacto del huésped."
                            : "Completa la ficha de registro para el check-in."}
                    </SheetDescription>
                </SheetHeader>

                {/* FORM BODY */}
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* SECCIÓN 1: DATOS PERSONALES */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <User className="h-3 w-3 text-[#D4AF37]" /> Información Personal
                                </h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="nombre"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="Ej: Juan" className="pl-9 bg-accent/50 border-border focus:border-[#D4AF37]" {...field} />
                                                    </div>
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
                                                <FormLabel>Apellido</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ej: Pérez" className="bg-accent/50 border-border focus:border-[#D4AF37]" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="fechaNacimiento"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-col">
                                                <FormLabel>Fecha Nacimiento</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={"outline"}
                                                                className={cn("w-full pl-3 text-left font-normal bg-accent/50 border-border hover:bg-accent focus:border-[#D4AF37]", !field.value && "text-muted-foreground")}
                                                            >
                                                                {field.value ? format(field.value, "PP") : <span>Seleccionar fecha</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50 text-[#D4AF37]" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0 border-border" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={field.value}
                                                            onSelect={field.onChange}
                                                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                                            initialFocus
                                                            className="bg-card text-foreground"
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="nacionalidad"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nacionalidad</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="Colombiana" className="pl-9 bg-accent/50 border-border focus:border-[#D4AF37]" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Separator className="bg-border/60" />

                            {/* SECCIÓN 2: DOCUMENTACIÓN LEGAL */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="h-3 w-3 text-[#D4AF37]" /> Documentación Legal
                                </h3>

                                <div className="grid grid-cols-3 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="tipoDocumento"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Tipo</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-accent/50 border-border focus:border-[#D4AF37]">
                                                            <SelectValue placeholder="Tipo" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="CC">CC</SelectItem>
                                                        <SelectItem value="CE">CE</SelectItem>
                                                        <SelectItem value="PA">Pass</SelectItem>
                                                        <SelectItem value="TI">TI</SelectItem>
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
                                                <FormLabel>Número Documento</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <CreditCard className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="1234567890" className="pl-9 bg-accent/50 border-border focus:border-[#D4AF37]" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <Separator className="bg-border/60" />

                            {/* SECCIÓN 3: CONTACTO */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <Briefcase className="h-3 w-3 text-[#D4AF37]" /> Contacto
                                </h3>

                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Correo Electrónico</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="cliente@ejemplo.com" className="pl-9 bg-accent/50 border-border focus:border-[#D4AF37]" {...field} />
                                                    </div>
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
                                                <FormLabel>Teléfono / WhatsApp</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="+57 300 123 4567" className="pl-9 bg-accent/50 border-border focus:border-[#D4AF37]" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Espaciador invisible para empujar el footer si es necesario en móviles */}
                            <div className="h-4"></div>
                        </form>
                    </Form>
                </div>

                {/* FOOTER ACCIONES */}
                <SheetFooter className="px-6 py-6 border-t border-border bg-card/50 flex flex-col sm:flex-row gap-3 sm:justify-between items-center w-full">
                    {guestToEdit && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 w-full sm:w-auto"
                            onClick={() => toast.info("Funcionalidad de eliminar pendiente de implementación")}
                        >
                            <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                        </Button>
                    )}

                    <div className="flex gap-3 w-full sm:w-auto ml-auto">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="w-full sm:w-auto border-border text-muted-foreground hover:text-foreground"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={form.handleSubmit(onSubmit)}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto bg-[#D4AF37] text-black hover:bg-[#B5952F] font-semibold"
                        >
                            {isSubmitting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                            ) : (
                                guestToEdit ? "Guardar Cambios" : "Crear Huésped"
                            )}
                        </Button>
                    </div>
                </SheetFooter>

            </SheetContent>
        </Sheet>
    )
}
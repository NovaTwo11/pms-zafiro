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
import { Separator } from "@/components/ui/separator"

// --- SCHEMA ---
// Esquema actualizado para soportar campos opcionales completos y lógica de nombres
const formSchema = z.object({
    primerNombre: z.string().min(2, "Requerido"),
    segundoNombre: z.string().optional(),
    primerApellido: z.string().min(2, "Requerido"),
    segundoApellido: z.string().optional(),
    tipoDocumento: z.string(),
    numeroDocumento: z.string().min(3, "Requerido"),
    // Permitir string vacío o email válido
    email: z.union([z.literal(""), z.string().email("Email inválido")]),
    telefono: z.string().optional(),
    nacionalidad: z.string().optional(),
    ciudadOrigen: z.string().optional(),
    fechaNacimiento: z.date().optional(),
})

// --- TYPES ---
// Actualizamos la interfaz para reflejar la estructura detallada que el backend espera y envía
export interface GuestDetailDto {
    id?: string
    primerNombre: string
    segundoNombre?: string
    primerApellido: string
    segundoApellido?: string
    correo?: string
    telefono?: string
    nacionalidad: string
    tipoId: string
    numeroId: string
    fechaNacimiento?: string // ISO string desde backend
    ciudadOrigen?: string
    esTitular?: boolean
}

interface GuestFormDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onGuestSaved?: (data: any) => void // Callback para notificar al padre
    guestToEdit?: GuestDetailDto | null
}

export function GuestFormDrawer({
                                    open,
                                    onOpenChange,
                                    onGuestSaved,
                                    guestToEdit
                                }: GuestFormDrawerProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Configuración del formulario con valores por defecto seguros
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            primerNombre: "",
            segundoNombre: "",
            primerApellido: "",
            segundoApellido: "",
            tipoDocumento: "CC",
            numeroDocumento: "",
            email: "",
            telefono: "",
            nacionalidad: "Colombiana",
            ciudadOrigen: "",
        },
    })

    // EFECTO: Rellenar formulario al editar o limpiar al crear nuevo
    useEffect(() => {
        if (open) {
            if (guestToEdit) {
                // Mapeo inverso de DTO a Formulario
                form.reset({
                    primerNombre: guestToEdit.primerNombre,
                    segundoNombre: guestToEdit.segundoNombre || "",
                    primerApellido: guestToEdit.primerApellido,
                    segundoApellido: guestToEdit.segundoApellido || "",
                    tipoDocumento: guestToEdit.tipoId || "CC",
                    numeroDocumento: guestToEdit.numeroId,
                    email: guestToEdit.correo || "",
                    telefono: guestToEdit.telefono || "",
                    nacionalidad: guestToEdit.nacionalidad || "Colombiana",
                    ciudadOrigen: guestToEdit.ciudadOrigen || "",
                    // Convertir string ISO a Date object seguro
                    fechaNacimiento: guestToEdit.fechaNacimiento ? new Date(guestToEdit.fechaNacimiento) : undefined
                })
            } else {
                // Reset limpio para nuevo registro
                form.reset({
                    primerNombre: "",
                    segundoNombre: "",
                    primerApellido: "",
                    segundoApellido: "",
                    tipoDocumento: "CC",
                    numeroDocumento: "",
                    email: "",
                    telefono: "",
                    nacionalidad: "Colombiana",
                    ciudadOrigen: "",
                    fechaNacimiento: undefined
                })
            }
        }
    }, [open, guestToEdit, form])

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true)
        try {
            const fechaFormatted = values.fechaNacimiento
                ? format(values.fechaNacimiento, "yyyy-MM-dd")
                : null;
            // Construcción del Payload
            const payload = {
                id: guestToEdit?.id,
                primerNombre: values.primerNombre,
                segundoNombre: values.segundoNombre,
                primerApellido: values.primerApellido,
                segundoApellido: values.segundoApellido,
                tipoId: values.tipoDocumento,
                numeroId: values.numeroDocumento,
                correo: values.email,
                telefono: values.telefono,
                nacionalidad: values.nacionalidad,
                ciudadOrigen: values.ciudadOrigen,
                // Convertir Date a ISO string para transporte seguro
                fechaNacimiento: fechaFormatted,
                esTitular: guestToEdit?.esTitular ?? false // Preservar estado
            }

            // Notificar al componente padre
            if (onGuestSaved) {
                await onGuestSaved(payload)
            } else {
                toast.success("Datos listos (Conecte onGuestSaved)")
            }

            onOpenChange(false)

        } catch (error: any) {
            console.error(error)
            toast.error("Error al procesar el formulario")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:w-[540px] overflow-y-auto bg-background border-l border-border p-0 flex flex-col h-full shadow-2xl">

                {/* HEADER CON ESTILO */}
                <SheetHeader className="px-6 py-6 border-b border-border bg-card/50 sticky top-0 z-10 backdrop-blur-md">
                    <SheetTitle className="flex items-center gap-2 text-2xl font-serif text-[#D4AF37]">
                        <User className="h-6 w-6"/>
                        {guestToEdit ? "Editar Huésped" : "Nuevo Huésped"}
                    </SheetTitle>
                    <SheetDescription className="text-muted-foreground">
                        {guestToEdit
                            ? `Actualizando datos de ${guestToEdit.esTitular ? "Titular" : "Acompañante"}`
                            : "Ingrese los datos completos para el registro."}
                    </SheetDescription>
                </SheetHeader>

                {/* FORM BODY */}
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* SECCIÓN 1: DATOS PERSONALES */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                                    <User className="h-3 w-3 text-[#D4AF37]" /> Identificación Personal
                                </h3>

                                {/* Nombres */}
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="primerNombre"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Primer Nombre *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Juan" className="bg-accent/50 border-border focus:border-[#D4AF37]" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="segundoNombre"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Segundo Nombre</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="" className="bg-accent/50 border-border focus:border-[#D4AF37]" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                {/* Apellidos */}
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="primerApellido"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Primer Apellido *</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Pérez" className="bg-accent/50 border-border focus:border-[#D4AF37]" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="segundoApellido"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Segundo Apellido</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="" className="bg-accent/50 border-border focus:border-[#D4AF37]" {...field} />
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
                                                                {field.value ? format(field.value, "PPP") : <span>Seleccionar fecha</span>}
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
                                                            captionLayout="dropdown"
                                                            fromYear={1920}
                                                            toYear={new Date().getFullYear()}
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
                                    <FileText className="h-3 w-3 text-[#D4AF37]" /> Documento de Identidad
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
                                                        <SelectItem value="CC">C.C.</SelectItem>
                                                        <SelectItem value="CE">C.E.</SelectItem>
                                                        <SelectItem value="PASSPORT">Pass</SelectItem>
                                                        <SelectItem value="TI">T.I.</SelectItem>
                                                        <SelectItem value="RC">R.C.</SelectItem>
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
                                                <FormLabel>Número</FormLabel>
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
                                    <Briefcase className="h-3 w-3 text-[#D4AF37]" /> Contacto y Ubicación
                                </h3>

                                <div className="grid grid-cols-1 gap-4">
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
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="telefono"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Teléfono</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        <Input placeholder="+57 300..." className="pl-9 bg-accent/50 border-border focus:border-[#D4AF37]" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="ciudadOrigen"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Ciudad Origen</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ej: Bogotá" className="bg-accent/50 border-border focus:border-[#D4AF37]" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                            {/* Padding extra al final */}
                            <div className="h-8"></div>
                        </form>
                    </Form>
                </div>

                {/* FOOTER ACCIONES */}
                <SheetFooter className="px-6 py-6 border-t border-border bg-card/50 flex flex-col sm:flex-row gap-3 sm:justify-between items-center w-full sticky bottom-0 z-10 backdrop-blur-md">
                    {/* Botón de eliminar */}
                    {guestToEdit && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10 w-full sm:w-auto"
                            onClick={() => toast.info("Para eliminar, use el menú en la lista principal")}
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
                                "Guardar Cambios"
                            )}
                        </Button>
                    </div>
                </SheetFooter>

            </SheetContent>
        </Sheet>
    )
}
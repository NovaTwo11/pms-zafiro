"use client"

import { useState } from "react"
import { CheckCircle, Plus, User, ArrowRight, Save, Trash2, X, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner" // Asegúrate de tener sonner o usa tu sistema de notificaciones

// Tipo para el formulario de huésped
type GuestForm = {
    id?: string // Para identificar en la lista
    primerNombre: string
    segundoNombre: string
    primerApellido: string
    segundoApellido: string
    tipoId: string
    numeroId: string
    fechaCumpleanos: string
    genero: string
    nacionalidad: string
    telefono: string
    correo: string
    ocupacion: string
    paisResidencia: string
    ciudadResidencia: string
    paisOrigen: string
    ciudadOrigen: string
    paisDestino: string
    ciudadDestino: string
}

// Estado inicial limpio
const emptyGuestState: GuestForm = {
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    tipoId: "CC",
    numeroId: "",
    fechaCumpleanos: "",
    genero: "M",
    nacionalidad: "",
    telefono: "",
    correo: "",
    ocupacion: "",
    paisResidencia: "",
    ciudadResidencia: "",
    paisOrigen: "",
    ciudadOrigen: "",
    paisDestino: "",
    ciudadDestino: "",
}

// Datos simulados del titular (pre-llenado)
const initialMainGuestState: GuestForm = {
    ...emptyGuestState,
    primerNombre: "Carlos",
    primerApellido: "García",
    numeroId: "123456789",
    nacionalidad: "Colombiano",
    telefono: "+57 300 123 4567",
    correo: "carlos.garcia@email.com",
    paisDestino: "Colombia",
    ciudadDestino: "Zarzal",
}

interface GuestCheckInContentProps {
    reservationCode: string
}

export function GuestCheckInContent({ reservationCode }: GuestCheckInContentProps) {
    const [step, setStep] = useState(1) // 1: Titular, 2: Acompañantes, 3: Finalizado

    // Datos del Titular
    const [mainGuest, setMainGuest] = useState<GuestForm>(initialMainGuestState)

    // Datos de Acompañantes
    const [companions, setCompanions] = useState<GuestForm[]>([])
    const [isAddingCompanion, setIsAddingCompanion] = useState(false)
    const [newCompanion, setNewCompanion] = useState<GuestForm>(emptyGuestState)

    // --- MANEJADORES ---

    const handleMainGuestChange = (field: keyof GuestForm, value: string) => {
        setMainGuest((prev) => ({ ...prev, [field]: value }))
    }

    const handleNewCompanionChange = (field: keyof GuestForm, value: string) => {
        setNewCompanion((prev) => ({ ...prev, [field]: value }))
    }

    const handleSubmitTitular = (e: React.FormEvent) => {
        e.preventDefault()
        // Aquí podrías validar campos obligatorios adicionales
        setStep(2)
        window.scrollTo({ top: 0, behavior: "smooth" })
    }

    const saveCompanion = (e: React.FormEvent) => {
        e.preventDefault()
        // Validación básica para acompañante
        if (!newCompanion.primerNombre || !newCompanion.primerApellido || !newCompanion.numeroId) {
            toast.error("Nombre, Apellido y Documento son obligatorios")
            return
        }

        setCompanions([...companions, { ...newCompanion, id: crypto.randomUUID() }])
        setNewCompanion(emptyGuestState)
        setIsAddingCompanion(false)
        toast.success("Acompañante agregado")
    }

    const removeCompanion = (id: string) => {
        setCompanions(companions.filter(c => c.id !== id))
        toast.info("Acompañante eliminado")
    }

    const handleFinalize = async () => {
        // Aquí iría la llamada a tu API para guardar TODO (titular + acompañantes)
        console.log("Guardando Reserva:", {
            code: reservationCode,
            mainGuest,
            companions
        })

        // Simulación de carga
        setStep(3)
    }

    // --- RENDERIZADO DE FORMULARIO (Reutilizable para Titular y Acompañante) ---
    const renderFormFields = (
        data: GuestForm,
        onChange: (field: keyof GuestForm, value: string) => void,
        isCompanion: boolean = false
    ) => (
        <div className="space-y-6">
            {/* IDENTIFICACIÓN */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2 border-b border-border pb-1">
                    Identificación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Primer Nombre *</Label>
                        <Input className="bg-background border-border" required value={data.primerNombre} onChange={(e) => onChange("primerNombre", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Segundo Nombre</Label>
                        <Input className="bg-background border-border" value={data.segundoNombre} onChange={(e) => onChange("segundoNombre", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Primer Apellido *</Label>
                        <Input className="bg-background border-border" required value={data.primerApellido} onChange={(e) => onChange("primerApellido", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Segundo Apellido</Label>
                        <Input className="bg-background border-border" value={data.segundoApellido} onChange={(e) => onChange("segundoApellido", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Tipo Documento *</Label>
                        <Select value={data.tipoId} onValueChange={(v) => onChange("tipoId", v)}>
                            <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-card border-border text-white">
                                <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                                <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                                <SelectItem value="PA">Pasaporte</SelectItem>
                                <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Número Documento *</Label>
                        <Input className="bg-background border-border" required value={data.numeroId} onChange={(e) => onChange("numeroId", e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Fecha Nacimiento</Label>
                            <Input type="date" className="bg-background border-border" value={data.fechaCumpleanos} onChange={(e) => onChange("fechaCumpleanos", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Género</Label>
                            <Select value={data.genero} onValueChange={(v) => onChange("genero", v)}>
                                <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-card border-border text-white">
                                    <SelectItem value="M">Masculino</SelectItem>
                                    <SelectItem value="F">Femenino</SelectItem>
                                    <SelectItem value="O">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Nacionalidad</Label>
                        <Input className="bg-background border-border" value={data.nacionalidad} onChange={(e) => onChange("nacionalidad", e.target.value)} />
                    </div>
                </div>
            </div>

            {/* CONTACTO - Opcional para acompañantes */}
            <div className="space-y-4 pt-4">
                <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2 border-b border-border pb-1">
                    Contacto y Perfil
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Email {isCompanion ? '(Opcional)' : '*'}</Label>
                        <Input type="email" className="bg-background border-border" required={!isCompanion} value={data.correo} onChange={(e) => onChange("correo", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Teléfono {isCompanion ? '(Opcional)' : '*'}</Label>
                        <Input className="bg-background border-border" required={!isCompanion} value={data.telefono} onChange={(e) => onChange("telefono", e.target.value)} />
                    </div>
                </div>
            </div>

            {/* UBICACIÓN - Simplificado para acompañantes si se desea, aquí lo dejo completo */}
            {!isCompanion && (
                <div className="space-y-4 pt-4">
                    <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-2 border-b border-border pb-1">
                        Ubicación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">País Residencia *</Label>
                            <Input className="bg-background border-border" required value={data.paisResidencia} onChange={(e) => onChange("paisResidencia", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Ciudad Residencia *</Label>
                            <Input className="bg-background border-border" required value={data.ciudadResidencia} onChange={(e) => onChange("ciudadResidencia", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">País Origen *</Label>
                            <Input className="bg-background border-border" required value={data.paisOrigen} onChange={(e) => onChange("paisOrigen", e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-muted-foreground">Ciudad Origen *</Label>
                            <Input className="bg-background border-border" required value={data.ciudadOrigen} onChange={(e) => onChange("ciudadOrigen", e.target.value)} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center py-10 px-4 animate-in fade-in duration-500">

            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-[#D4AF37] mb-2 font-[family-name:var(--font-heading)]">Hotel Zafiro</h1>
                <p className="text-muted-foreground">Registro de Huéspedes</p>
                <div className="mt-2 inline-block px-3 py-1 rounded-full bg-[#333333] text-xs font-mono text-foreground">
                    Reserva: {reservationCode}
                </div>
            </div>

            <div className="w-full max-w-3xl space-y-6">

                {/* --- PASO 1: FORMULARIO TITULAR --- */}
                {step === 1 && (
                    <Card className="bg-card border-border shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-foreground flex items-center gap-2">
                                <Badge className="bg-primary text-black hover:bg-primary">1</Badge>
                                Datos del Titular
                            </CardTitle>
                            <CardDescription>
                                Por favor complete todos los campos obligatorios (*) para agilizar su ingreso.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmitTitular}>
                            <CardContent>
                                {renderFormFields(mainGuest, handleMainGuestChange)}
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" className="w-full bg-primary text-black hover:bg-primary/90 font-bold h-12">
                                    Guardar y Continuar <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                )}

                {/* --- PASO 2: ACOMPAÑANTES --- */}
                {step === 2 && (
                    <div className="space-y-6">
                        <Card className="bg-card border-border shadow-lg">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-foreground flex items-center gap-2">
                                            <Badge className="bg-primary text-black hover:bg-primary">2</Badge>
                                            Acompañantes
                                        </CardTitle>
                                        <CardDescription>
                                            Agregue las personas que se hospedarán con usted.
                                        </CardDescription>
                                    </div>
                                    {/* Botón flotante si hay acompañantes */}
                                    {!isAddingCompanion && companions.length > 0 && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-[#D4AF37] text-[#D4AF37] hover:bg-primary/10"
                                            onClick={() => setIsAddingCompanion(true)}
                                        >
                                            <Plus className="h-4 w-4 mr-2" /> Agregar Otro
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">

                                {/* LISTA DE ACOMPAÑANTES AGREGADOS */}
                                {companions.length > 0 && (
                                    <div className="grid grid-cols-1 gap-3 mb-6">
                                        {companions.map((comp, idx) => (
                                            <div key={comp.id || idx} className="flex items-center justify-between p-3 rounded bg-background border border-border">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-[#333333] flex items-center justify-center">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">
                                                            {comp.primerNombre} {comp.primerApellido}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {comp.tipoId}: {comp.numeroId}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeCompanion(comp.id!)}
                                                    className="text-[#CF6679] hover:text-red-500 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* ESTADO VACÍO (Sin acompañantes y sin estar agregando) */}
                                {companions.length === 0 && !isAddingCompanion && (
                                    <div className="text-center py-10 border-2 border-dashed border-border rounded-lg bg-background">
                                        <Users className="h-10 w-10 text-[#333333] mx-auto mb-3" />
                                        <p className="text-muted-foreground mb-4">No hay acompañantes registrados aún.</p>
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsAddingCompanion(true)}
                                            className="border-[#D4AF37] text-[#D4AF37] hover:bg-primary/10"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Agregar Acompañante
                                        </Button>
                                    </div>
                                )}

                                {/* FORMULARIO DE AGREGAR ACOMPAÑANTE */}
                                {isAddingCompanion && (
                                    <div className="border border-[#D4AF37]/30 rounded-lg p-4 bg-background animate-in slide-in-from-top-4">
                                        <div className="flex justify-between items-center mb-4 border-b border-border pb-2">
                                            <h4 className="text-[#D4AF37] font-medium">Nuevo Acompañante</h4>
                                            <Button variant="ghost" size="sm" onClick={() => setIsAddingCompanion(false)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <form onSubmit={saveCompanion}>
                                            {renderFormFields(newCompanion, handleNewCompanionChange, true)}
                                            <div className="flex justify-end gap-2 mt-6">
                                                <Button type="button" variant="ghost" onClick={() => setIsAddingCompanion(false)} className="text-muted-foreground">
                                                    Cancelar
                                                </Button>
                                                <Button type="submit" className="bg-primary text-black hover:bg-primary/90">
                                                    Guardar Acompañante
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                            </CardContent>

                            {/* Footer de navegación */}
                            {!isAddingCompanion && (
                                <CardFooter className="flex justify-between border-t border-border pt-6">
                                    <Button variant="ghost" onClick={() => setStep(1)} className="text-muted-foreground hover:text-white">
                                        Atrás (Editar Titular)
                                    </Button>
                                    <Button onClick={handleFinalize} className="bg-[#059669] text-white hover:bg-[#059669]/90 font-bold px-8">
                                        Finalizar Registro <Save className="h-4 w-4 ml-2" />
                                    </Button>
                                </CardFooter>
                            )}
                        </Card>
                    </div>
                )}

                {/* --- PASO 3: ÉXITO --- */}
                {step === 3 && (
                    <Card className="bg-card border-border text-center py-12 shadow-2xl">
                        <CardContent className="flex flex-col items-center">
                            <div className="h-24 w-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                                <CheckCircle className="h-12 w-12 text-green-500" />
                            </div>
                            <h2 className="text-3xl font-bold text-foreground mb-4">¡Registro Completado!</h2>
                            <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
                                Sus datos y los de sus {companions.length} acompañante(s) han sido recibidos correctamente por el Hotel Zafiro.
                                <br /><br />
                                <span className="text-[#D4AF37] font-medium">¡Bienvenido!</span>
                            </p>
                            <Button variant="outline" className="border-border text-muted-foreground" onClick={() => window.close()}>
                                Cerrar Ventana
                            </Button>
                        </CardContent>
                    </Card>
                )}

            </div>
        </div>
    )
}